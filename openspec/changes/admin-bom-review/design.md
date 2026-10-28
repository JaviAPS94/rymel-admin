## Context

- `/design-bom` (`DesignBomPage`) lista diseños con `POST /design/by-filters-paginated` y un campo «Buscar por código de diseño». Ese endpoint carga los `sub_design` con todo su contenido, aunque el listado solo muestre la cabecera.
- Los ajustes del cliente viven en `design_bom_adjustment` y se leen con `GET /design/:id/bom-adjustment` (ADMIN y DESIGN). Cada uno guarda la hoja ajustada entera, la estructura y la huella de la lista generada sobre la que se hizo, y los semielaborados desplegados.
- La lista tiene dos fuentes. La **plantilla** (admin) aporta los ítems vinculados en las zonas de semielaborado. La **norma** (cliente) aporta los accesorios de cada elemento, en `element.values` con la clave `accesories`, cada uno con su `semiFinished`. Los accesorios son ítems del ERP (`OutputAccesoryDto`: `item_id`, `referencia`, `descripcion`, `unidad_inventario`, `costo_promedio`, `ultimo_costo`), y la norma les añade `value` y `semiFinished`.
- Medido el 2026-10-27 (`audit-bom-sources.ts`): 21 accesorios en 9 elementos de 8 normas, todos con semielaborado. 16 no tienen unidad, costos ni cantidad, y 4 de ellos están en elementos que usan diseños. Ningún otro campo de la norma lleva semielaborado.

## Goals / Non-Goals

**Goals:** que el admin encuentre los diseños por lo que sabe (norma, referencia, estado), no por un código; que vea qué cambió el cliente en su lista sin poder tocarlo; y que los accesorios entren en la lista con todos sus campos, diciendo lo que les falta.

**Non-Goals:** que el admin edite o descarte ajustes; completar los accesorios incompletos; que entren en la lista otros campos de la norma.

## Decisions

### 1. Un endpoint de listado propio, no más filtros en `by-filters-paginated`

`POST /design/bom-review`, solo ADMIN, devuelve filas ligeras: id, código, nombre, norma, país, elementos (`id`, `sapReference`), fechas, estado de la lista y, si hay ajuste, `updatedBy` y `updatedAt`.

*Por qué así:* `by-filters-paginated` es el listado del diseñador. Trae las hojas enteras y sus filtros (país, tipo, nombre de norma) son los del cliente. Añadirle estado y ajuste lo acoplaría a una pantalla que no es la suya, y cada fila seguiría trayendo el contenido de las hojas.

*Alternativa descartada:* filtrar en el navegador sobre `by-filters-paginated`. Con 21 diseños funciona, pero rompe la paginación (se filtraría una página, no el total) y descarga todas las hojas.

### 2. El estado de la lista se calcula en el servidor, con la regla de prefijo

Las estructuras BOM activas son pocas (2 hoy), así que se cargan y cada referencia se compara por prefijo, con la misma función que `GET /bill-of-materials/search`. La función se extrae para que las dos rutas usen la misma. Para filtrar por estado sin paginar en memoria, el filtro de estado se resuelve en SQL: `EXISTS` sobre `design_bom_adjustment` para *ajustada*, y `LIKE bom.code + '%'` sobre las estructuras activas para *generable* / *sin estructura*.

*Trade-off:* *lista cambiada desde el ajuste* no se puede filtrar, porque exige generar la lista, y eso solo se hace en el navegador. Se muestra al abrir el diseño, no en el listado.

### 3. La comparación empareja filas por clave, no por posición

Una fila se identifica por **semielaborado de la sección + valor de la columna Ítem (B)**. Las filas de cabecera y de semielaborado hijo se identifican por su texto. Emparejadas así, una fila de la ajustada sin pareja es *añadida*, una de la generada sin pareja es *quitada*, y una pareja con alguna celda distinta (valor que se ve) es *cambiada*, con esas celdas marcadas.

*Por qué así:* el cliente puede añadir o quitar filas (confirmado el 2026-10-27), y con eso todo lo que viene debajo se desplaza. Comparar por posición marcaría como cambiadas todas las filas siguientes.

*Alternativa descartada:* diff de líneas tipo `diff`, sobre filas serializadas. Detecta inserciones, pero no dice qué celda cambió dentro de la fila, y el admin necesita ver justo eso (5 en lugar de 3).

*Límite:* si el cliente cambia el Ítem de una fila, se ve como una quitada más una añadida. Es lo correcto: cambió de material.

### 4. Columnas nuevas al final

Referencia (F), Costo promedio (G), Último costo (H) y Observación (I). A–E no se mueven.

*Por qué así:* así las ediciones de quien ya trabaja con la hoja y los CSV que ya se han exportado siguen cuadrando, y la comparación del punto 3 sigue usando B como clave.

*Alternativa descartada:* Referencia junto al Ítem (C). Es más natural de leer, pero desplaza descripción, cantidad y unidad.

### 5. Un faltante se dice, no se rellena

Cantidad vacía + «sin cantidad en la norma» en Observación; lo mismo para la unidad y los costos. `ElementForm` ya pone `value ?? 1` al asignar accesorios nuevos, pero los 16 accesorios guardados sin cantidad son anteriores a eso.

*Por qué así:* un 1 inventado en una lista de materiales se compra. Un hueco marcado se revisa.

### 6. Asignación de accesorios en la norma

`handleAddAccesory` calcula una vez los accesorios elegidos (todos con `semiFinished` y `value ?? 1`, como hoy). Primero valida que haya semielaborado y después escribe en el formulario y en los elementos seleccionados. Hoy añade solo el primero a los otros elementos y escribe antes de validar.

*Por qué aquí:* sin esto, la regla de armado nueva (accesorios con todos sus campos) seguiría perdiendo accesorios en silencio. Hoy no afecta a ningún dato, pero basta con elegir dos accesorios a la vez para que ocurra.

### 7. Un cambio de regla, en las dos copias y con línea base nueva

`buildBomSummary` cambia igual en `project-front` y en `project-admin`. Se regenera `bom-baseline.json` (cliente) y `client-bom-cases.json` (admin) con un caso que tenga un accesorio completo, uno sin cantidad y uno con `unitMeasurement`. `check-bom-parity.ts` comprueba que coinciden. `bomFingerprint` se porta al admin para la comparación del punto 3 y para el aviso.

## Risks / Trade-offs

- **[Riesgo] Las huellas guardadas dejan de coincidir** porque cambia la lista generada. → Hoy `design_bom_adjustment` está vacía. Si al desplegar ya hay ajustes, todos avisarán de que la lista cambió, y es verdad. Se avisa en la nota de despliegue.
- **[Trade-off] Tres copias de código de la lista** (regla en cliente y admin, huella en cliente y admin). → Misma línea base y `check-bom-parity.ts`. Si hace falta una cuarta pantalla, la salida es armarla en el servidor (decisión 1 de `move-bom-summary-to-admin`).
- **[Trade-off] Costos de la norma.** `averageCost` y `lastCost` son los que devolvió `GET /accesory` (el ERP) cuando se asignó el accesorio en la norma, y la lista los toma de ahí sin volver a consultar el ERP. Confirmado el 2026-10-27: esa es la fuente.

## Migration Plan

1. `project-back`: `POST /design/bom-review` y la función de prefijo extraída. No cambia ninguna ruta existente.
2. `project-admin` y `project-front` a la vez: `buildBomSummary` con columnas nuevas y líneas base regeneradas.
3. `project-admin`: listado con filtros y comparación. Sale el campo de código.

Rollback: revertir cada repo. No hay datos que migrar.

## Resolved Questions (2026-10-27)

1. **Accesorios incompletos:** no se hace nada en código. La norma los trae del ERP con `GET /accesory`, con unidad y costos. Los 16 incompletos se guardaron así antes, y la lista los señala en Observación hasta que se vuelvan a asignar en su norma.
2. **Asignación en `ElementForm`:** se corrige en este change (decisión 6).
3. **Costos:** los del ERP, tal como los guardó la norma al asignar el accesorio.
