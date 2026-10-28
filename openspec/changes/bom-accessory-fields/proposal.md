## Why

La lista de materiales tiene dos fuentes. La **plantilla**, que define el admin, aporta la base: zonas de semielaborado, tablas de catálogo e ítems vinculados. La **norma**, que define el cliente, aporta los accesorios de cada elemento, cada uno con su semielaborado. La estructura BOM se busca, como hoy, por la referencia del elemento cuando el cliente usa la plantilla. Sobre esa base, el cliente añade filas o la ajusta en su diseño (`bom-summary-in-client`).

De la norma solo entran los accesorios, **pero con todos sus campos** (pedido del 2026-10-27). Medido ese día con `project-back/src/db/scripts/audit-bom-sources.ts`:

- Un accesorio llega del ERP (`GET /accesory`) con `id`, `reference`, `description`, `unitOfMeasurement`, `averageCost` y `lastCost`, y la norma le añade `value` (la cantidad) y `semiFinished`. **La lista solo usaba `id`, `description`, `value` y `unitOfMeasurement`**, y no leía la unidad cuando venía como `unitMeasurement`.
- Hay 21 accesorios en 9 elementos de 8 normas, todos con semielaborado. 16 se guardaron sin unidad, costos ni cantidad. Son datos antiguos: la norma ya los trae completos del ERP.
- `ElementForm.handleAddAccesory` solo asignaba el semielaborado al **primero** de los accesorios elegidos a la vez, y a los otros elementos seleccionados solo les añadía ese primero. Así, el resto nunca llegaba a la lista. Hoy no hay datos afectados.

## What Changes

- **Lista (project-front)**: columnas nuevas al final (F–I): Referencia, Costo promedio, Último costo y Observación. A–E no se mueven. La unidad se lee de `unitOfMeasurement` o, si falta, de `unitMeasurement`. Si a un accesorio le falta la cantidad, la unidad o los costos, la columna Observación lo dice y no se rellena.
- **Norma (project-front)**: todos los accesorios elegidos en una misma acción llevan el semielaborado y van a todos los elementos seleccionados. Si no hay semielaborado, no se escribe nada.

**Retirado de este change (2026-10-27).** La primera versión incluía una sección del admin para revisar la lista diseño por diseño, con filtros, comparación y `POST /design/bom-review`. Partía de un malentendido: la lista la define la plantilla y la ve el cliente, y el admin no la revisa por diseño. Se retiró del admin y del servidor. Ver diseños es otra cosa y va en `admin-design-browser`.

## Capabilities

### New Capabilities

_Ninguna._

### Modified Capabilities

- `design-bom-summary`: los accesorios entran con todos sus campos, y la norma los asigna a su semielaborado.

## Impact

- **`project-front`**: `buildBomSummary` (columnas, unidad, faltantes), `scripts/fixtures/bom-cases.json` y `bom-baseline.json`, `check-bom-cases.ts`, `ElementForm.tsx` + `accessoryAssignment.ts`, `check-accessory-assignment.ts`.
- **`project-back`**: solo el script de auditoría `audit-bom-sources.ts`.
- **`project-admin`**: ninguno en el código.
