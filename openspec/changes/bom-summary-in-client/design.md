## Context

- La pestaña del cliente ya está restaurada (revertido `1c43522` en `project-front`). `BomSummaryTab` genera la hoja con `buildBomSummaryCells(bom, expandedChildNodes, sheets, element)` y la pinta en un `SpreadSheet` completo y editable. Desplegar un hijo (`onCellClick` → `bomToggleNodeId`) rearma la hoja entera y borra lo editado.
- `SpreadSheet` ya bloquea celdas una a una: `isReadOnlyCell={isProtected}`, alimentado por las zonas de solo lectura de la plantilla (`isReadOnly` de `@rymel/design-template`), con aviso `readOnlyNotice`.
- Al guardar un diseño, `DesignService.updateDesign` **borra y vuelve a crear** sus `sub_design` y `design_element`. Lo único estable del diseño es la fila de `design`.
- `sub_design.data` lo intercambian tres consumidores (cliente, admin y servidor). Por eso `function_versions` fue a una columna propia.
- La lista solo se genera hoy en 2 de 21 diseños (28 y 29; medido el 2026-10-08), así que hay poco uso real que proteger.

## Goals / Non-Goals

**Goals:** el cliente ve la lista en solo lectura, la ajusta solo si lo pide, y sus ajustes se guardan con el diseño y sobreviven a guardarlo; avisar cuando un ajuste se hizo sobre una lista que ya cambió; el admin sigue siendo el único sitio donde se define la estructura.

**Non-Goals:** que el admin vea o apruebe los ajustes; armar la lista en el servidor; limitar qué celdas se ajustan; fusionar ajustes con una lista nueva.

## Decisions

### 1. Se guarda la hoja ajustada entera, no una lista de cambios por fila

`PUT` lleva las celdas de la hoja tal como se ven (el mismo `Cell` que pinta `SpreadSheet`), además de los semielaborados desplegados.

*Por qué así:* en edición, la hoja es libre (valores, fórmulas, formato, filas nuevas). Un ajuste no siempre se puede atar a una fila de la estructura, así que guardar la hoja es lo único que conserva todo lo que el diseñador ve.

*Alternativa descartada:* guardar cambios por fila con clave `(nodo, ítem, columna)` y aplicarlos sobre la lista recién generada. Sobreviviría mejor a cambios de estructura, pero pierde fórmulas que cruzan filas, formato y filas añadidas, y exige decidir qué pasa con un cambio cuya fila desaparece. Sería la opción si se restringe la edición a la columna Cantidad (fuera de alcance).

### 2. Tabla propia, rutas propias

`design_bom_adjustment(id, design_id UNIQUE → design, bom_id, base_fingerprint, sheet nvarchar(max), expanded_nodes nvarchar(max), updated_by, created_at, updated_at)`, con `GET/PUT/DELETE /design/:id/bom-adjustment`.

*Por qué así:* `updateDesign` borra los `sub_design` cada vez que se guarda, así que un ajuste guardado ahí se perdería o habría que copiarlo en cada guardado. Una ruta aparte permite guardar el ajuste sin volver a validar ni a reescribir el diseño entero.

*Alternativas descartadas:*
- **Dentro de `sub_design.data`.** Se pierde con cada guardado y contamina un JSON que comparten tres consumidores.
- **Columna `bom_adjustment` en `design`.** Funcionaría, pero no deja sitio para el autor, la huella y la estructura usada sin añadir cuatro columnas a `design`. Además, el detalle del diseño la traería siempre.
- **Enviarlo dentro de `POST/PUT /design`.** Acopla el ajuste al guardado del diseño, y un ajuste no debería obligar a revalidar las zonas de solo lectura de todo el diseño.

### 3. Detección de cambios por huella de la lista generada

Al guardar, el cliente calcula una huella (SHA-256 de las celdas que produce `buildBomSummaryCells` **sin editar**, con los mismos nodos desplegados) y la envía. Al abrir, vuelve a generar la lista y compara.

*Por qué así:* la lista depende de cuatro fuentes (estructura BOM y sus nodos, hojas del diseño, accesorios del elemento y catálogo). Una huella del resultado las cubre todas sin tener que rastrear cada una. `bill_of_materials.updated_at` no basta: editar un nodo no siempre lo actualiza, y no cubre las otras tres.

*Trade-off:* si cambia una regla de `buildBomSummary`, todas las listas ajustadas avisarán de cambio. Es correcto: la lista generada cambió de verdad.

### 4. Solo lectura de hoja entera sobre el mecanismo existente

Se añade a `SpreadSheet` una prop `readOnly` que hace que `isReadOnlyCell` devuelva `true` para todo y oculta la barra de formato. No se crea otro modo.

*Alternativa descartada:* una tabla HTML aparte para la lectura. Sería otra forma de pintar la misma lista, y el paso a edición cambiaría de componente.

### 5. Desplegar solo en lectura

En edición, las celdas ▶/▼ no hacen nada y lo indican. Rearmar la hoja borraría lo editado, que era el comportamiento anterior y ya no vale ahora que lo editado se guarda.

Tampoco sobre una lista ajustada en lectura: es una instantánea, y desplegar exigiría volver a generarla y perder el ajuste. Para desplegar, se edita (las celdas son libres) o se vuelve a la lista generada.

## Risks / Trade-offs

- **[Riesgo] Una lista ajustada se queda vieja sin que nadie la mire.** → Aviso al abrirla (decisión 3), y el ajuste guarda autor y fecha. Si el admin necesita verlo, va en la pregunta abierta 1.
- **[Trade-off] Dos copias de `buildBomSummary`** (cliente y admin). → Misma línea base en los dos repos. Además, ahora la huella depende de la copia del cliente: si las copias divergen, el admin y el cliente pueden ver listas distintas sin aviso. Por eso la tarea de paridad entra en este change.
- **[Riesgo] Hoja grande en `nvarchar(max)`.** → La lista de los diseños 28 y 29 son decenas de celdas. Se limita el cuerpo del `PUT` igual que el de diseños.
- **[Riesgo] Dos diseñadores ajustan a la vez.** → Gana el último. Se acepta por el uso medido (2 diseños); si molesta, `updated_at` como precondición del `PUT`.

## Migration Plan

1. `project-back`: migración y rutas. La tabla nace vacía; desplegar sin cliente nuevo no cambia nada.
2. `project-front`: modos, guardar/descartar y aviso.
3. `project-admin`: `copilot-rules.md`.

Rollback: revertir el cliente deja la tabla sin usar; revertir la migración la borra. No hay datos previos.

## Open Questions

1. **¿El admin debe ver los ajustes del diseñador?** Por ejemplo, en `/design-bom`, con una marca «ajustada por X el día Y». Encaja con que el admin administra la lista, pero no se ha pedido.
2. **¿Hay que restringir qué se puede ajustar?** «Pequeñas modificaciones» sugiere cantidades. Si se restringe, la decisión 1 cambia a cambios por fila.
