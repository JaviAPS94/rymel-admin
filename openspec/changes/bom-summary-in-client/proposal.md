## Why

El change `move-bom-summary-to-admin` sacó la lista de materiales del diseñador (`project-front`) y la llevó a una sección del admin por diseño. El 2026-10-27 se pidió traerla de vuelta al cliente, con un reparto claro (la sección del admin por diseño se retiró después, por la misma razón):

- **El admin define** de qué está hecha la lista: las estructuras BOM (`BomListPage`, `BomEditorPage`) y la configuración de la plantilla (zonas de semielaborado, tablas de catálogo, ítems vinculados). Eso ya es así desde `move-template-authoring-to-admin`.
- **El cliente consulta** la lista de su diseño y, en casos puntuales, la **ajusta**. Esos ajustes se **guardan con el diseño**.

La pestaña ya se restauró revirtiendo el commit `1c43522` de `project-front` (tarea 4b del change anterior). Tal como estaba, no cumple ese reparto: es una hoja libre, editable desde el primer momento, y lo que se edita se pierde al salir.

## What Changes

**Cliente: la pestaña «LISTA DE MATERIALES», en solo lectura por omisión**

- La lista se genera como antes (mismas reglas, mismo `buildBomSummary`) y se muestra **en solo lectura**.
- Un botón **«Editar»** desbloquea la hoja para hacer ajustes: valores, fórmulas y formato, como en la hoja anterior. **«Guardar ajustes»** los guarda y **«Descartar»** vuelve a la lista generada.
- Al abrir un diseño con ajustes guardados se muestra la versión ajustada, marcada como tal, con la opción de volver a la generada.
- Si lo que alimenta la lista cambió desde que se guardaron los ajustes (estructura BOM, hojas del diseño, accesorios o catálogo), se avisa de que los ajustes se hicieron sobre una lista anterior. No se descartan solos.
- Desplegar o plegar un semielaborado hijo solo se puede en solo lectura. Antes rearmaba la hoja y borraba lo editado sin avisar.

**Servidor: los ajustes se guardan aparte del diseño**

- Tabla nueva `design_bom_adjustment`: una fila por diseño con la hoja ajustada, la huella de la lista generada sobre la que se hizo, la estructura BOM usada y quién y cuándo la guardó.
- `GET /design/:id/bom-adjustment`, `PUT /design/:id/bom-adjustment` y `DELETE /design/:id/bom-adjustment`. No pasan por `PUT /design/:id`, que borra y vuelve a crear los `sub_design`.

**Admin: sin cambios de comportamiento**

- La base se sigue definiendo en la plantilla y en las estructuras BOM. No hay vista de la lista por diseño en el admin: se retiró el 2026-10-27 (ver `bom-accessory-fields`).

**Fuera de alcance**

- Que el admin vea o apruebe los ajustes del diseñador.
- Armar la lista en el servidor.
- Restringir qué celdas se pueden ajustar.

## Capabilities

### New Capabilities

- `design-bom-adjustment`: guardar, recuperar y descartar los ajustes que un diseñador hace a la lista de materiales de su diseño, y detectar que se hicieron sobre una lista que ya cambió.

### Modified Capabilities

- `design-bom-summary` (del change `move-bom-summary-to-admin`, aún sin archivar): el requisito «El cliente conserva la lista» pasa a ser solo lectura con edición explícita y ajustes guardados.

## Impact

- **`project-front`**: `BomSummaryTab` (modos lectura/edición, guardar/descartar, aviso de lista cambiada); una prop de solo lectura de hoja entera en `SpreadSheet`, sobre el mecanismo que ya tiene (`isReadOnlyCell`); API `bomAdjustmentApi`; `BomTutorial` explica el flujo nuevo.
- **`project-back`**: entidad y migración `design_bom_adjustment`, tres rutas en `design.controller.ts` (rol de diseñador y ADMIN), y borrado en cascada cuando se borra el diseño.
- **`project-admin`**: ninguno en el código. Se actualiza `copilot-rules.md` con el reparto admin define / cliente ajusta.
- **Datos**: tabla nueva, vacía. Ningún dato existente se migra.
