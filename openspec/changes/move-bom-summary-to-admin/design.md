## Context

`BomSummaryTab` en `project-front` arma la lista con tres entradas: la estructura BOM del ERP (por prefijo de la referencia del elemento), las hojas del diseño (zonas de semielaborado, tablas de catálogo e ítems vinculados con su cantidad) y los accesorios del elemento (`element.values["accesories"]`). La lógica vive en `buildBomSummary.ts` (274 líneas) y produce celdas de hoja de cálculo que luego pinta un `SpreadSheet` completo.

El admin ya administra las estructuras BOM (`BomListPage`, `BomEditorPage`) pero no tiene ninguna vista de diseños. `project-back` expone `POST /design/by-filters-paginated` y `GET /design/by-id/:id`, ambos con ADMIN permitido, y el detalle trae el elemento y las hojas guardadas.

## Goals / Non-Goals

**Goals:** la misma lista que hoy ve el diseñador, para cualquier diseño guardado, desde el admin, editable como en el cliente; exportable; y sin quitársela al cliente (se retiró y se pidió de vuelta el 2026-10-27).

**Non-Goals:** guardar la lista editada, armarla en el servidor, o completar las estructuras BOM que faltan.

## Decisions

### 1. Se arma en la pantalla, con las reglas del cliente portadas tal cual

`buildBomSummary` se porta al admin sin cambiar sus reglas, y se fija con una prueba de paridad: con los diseños 90 y 91 y la misma estructura, el admin produce exactamente las celdas que producía el cliente (la línea base `bom-baseline.json` del change anterior).

*Por qué así:* es lo que pidió el responsable del producto —«tal como está hoy en el cliente»—, y es el camino de menor riesgo: la regla ya se usó y no cambia de lugar de cálculo ni de semántica.

*Alternativa considerada:* un endpoint que arme la lista en el servidor. Dejaría una sola implementación para cualquier pantalla futura y permitiría exportar sin navegador. Se descartó por decisión explícita; si aparece una segunda pantalla que la necesite, ese es el paso siguiente, y la prueba de paridad sirve igual para verificar el traslado.

### 2. Una hoja editable con la rejilla del editor de plantillas

La lista se monta como un documento de una hoja en la misma rejilla, motor de fórmulas, barra de fórmulas y barra de formato que el editor de plantillas (`BomSheetEditor`). Se edita como en el cliente, y como en el cliente **no se guarda**: desplegar un semielaborado hijo rearma la hoja desde la estructura y se pierde lo editado. La exportación toma los valores que se ven, con lo editado.

*Por qué así:* el responsable del producto pidió mantener el comportamiento del cliente, donde la lista era una hoja completa en la que se hacen ajustes antes de llevarla a otro lado. Reutilizar la rejilla del editor evita una tercera implementación de hoja en el producto.

*Alternativas consideradas:*
- **Tabla de solo lectura**, que fue la primera versión. Se descartó a pedido: perdía los ajustes que el cliente permitía.
- **Guardar lo editado con el diseño.** Cambia el comportamiento del cliente y exige decidir qué pasa al volver a armarla. Queda fuera.

*Trade-off aceptado:* conservar las ediciones al desplegar sería más cómodo, pero no es lo que hacía el cliente. La pantalla lo avisa.

### 3. CSV como formato de exportación

Con separador `;` y BOM UTF-8, que es lo que Excel en español abre con columnas y acentos correctos.

*Alternativa considerada:* `.xlsx`. Exige una dependencia nueva para cinco columnas sin formato.

### 4. Diseño, elemento y hojas: las mismas que usa el cliente, y el elemento se puede elegir

Las hojas son las del diseño (`subDesigns`), no las de costos, como en el cliente.

El cliente usa siempre el primer elemento del diseño (`selectedElements[0]`). Medido: **10 de los 21 diseños tienen 2 o 3 elementos**, cada uno con su propia referencia ERP, y el orden de `designElements` no lo fija ninguna consulta. El admin parte del primero, igual que el cliente, pero cuando hay varios deja elegir con cuál armar la lista y dice cuál usó.

*Alternativa considerada:* replicar el primero sin más. Es «tal como hoy», pero hereda una elección que depende del orden en que la base devuelve las filas.

### 5. El filtro de país pasa a ser opcional en el listado

Sin país, `findAllPaginated` comparaba `country.id = NULL` y no devolvía nada. El admin necesita ver todos los diseños. El cliente siempre envía el país, así que su resultado no cambia.

## Risks / Trade-offs

- **[Trade-off] Dos copias de la regla.** Al volver la pestaña al cliente, `buildBomSummary` vive en `project-front` y en `project-admin`, y pueden divergir. → Las dos se comprueban contra la misma línea base (`check-design-bom.ts` en el cliente, `buildBomSummary.spec.ts` en el admin), y un cambio de regla toca las dos. Si la divergencia empieza a costar, la salida es la descartada en la decisión 1: armarla en el servidor.
- **[Riesgo] Una lista distinta de la que daba el cliente.** → Prueba de paridad con datos reales, celda a celda.
- **[Riesgo] El diseñador pierde una vista que usaba.** → Medido: solo 2 de 21 diseños pueden generarla hoy, y son de prueba. Pedido explícito del responsable del producto.

## Migration Plan

1. `project-back`: filtro de país opcional.
2. `project-admin`: sección nueva.
3. ~~`project-front`: retirada de la pestaña.~~ Revertida el 2026-10-27: la pestaña se queda.

Rollback: cada repo se revierte con su commit; no hay datos.
