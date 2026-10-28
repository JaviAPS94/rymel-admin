## Why

Con `bom-summary-in-client`, el diseñador ve la lista de materiales de su diseño y la puede ajustar, y sus ajustes se guardan. El admin no tiene forma de saber qué diseños se ajustaron ni qué cambió. Su única vista, `/design-bom`, obliga a buscar un diseño por su código, que es justo lo que el admin no sabe de antemano. El 2026-10-27 se pidió:

- **Una sección aparte en el admin** para ver todos los diseños del cliente con un listado con filtros, sin campo de código, y **ver y comparar** la lista ajustada contra la generada. El admin no la modifica.
- Que los ajustes del cliente puedan **cambiar filas**, no solo cantidades. Ya es así: se guarda la hoja entera (decisión 1 de `bom-summary-in-client`). Aquí solo se confirma.
- Dejar escrito el **reparto de fuentes** de la lista. La **plantilla** (admin) define qué ítems entran: zonas de semielaborado, tablas de catálogo e ítems vinculados. La **norma** (cliente) define los **accesorios** de cada elemento, cada uno con su semielaborado. De la norma solo entran los accesorios, pero **con todos sus campos**.

Medido en la base `project` el 2026-10-27 con `project-back/src/db/scripts/audit-bom-sources.ts`:

- Hay 21 diseños activos y 36 elementos, 9 de ellos con accesorios (de 8 normas). Son 21 accesorios en total y **todos llevan semielaborado**. Ningún otro campo de la norma lleva semielaborado.
- Un accesorio llega del ERP con `id`, `reference`, `description`, `unitOfMeasurement`, `averageCost` y `lastCost`. La norma le añade `value` (la cantidad) y `semiFinished`. **La lista solo usa `id`, `description`, `value` y `unitOfMeasurement`.** Además lee `unitOfMeasurement` pero no `unitMeasurement`, un hallazgo que se portó al admin sin corregir.
- **16 de los 21 accesorios no tienen unidad, costos ni cantidad.** Están en 6 normas, y 4 en elementos que usan diseños. Hoy salen en la lista con la cantidad vacía y sin aviso.

## What Changes

**Admin: la sección «Lista de materiales» pasa a ser una revisión de diseños**

- **BREAKING (admin)**: se quita la búsqueda por código. La sustituye un listado de todos los diseños con filtros por norma, referencia ERP del elemento, estado de la lista (*sin referencia ERP*, *sin estructura BOM*, *generable*, *ajustada por el cliente*) y fecha de creación o de ajuste.
- Cada fila muestra el código, la norma, los elementos con su referencia ERP, el estado de la lista y, si se ajustó, quién la ajustó y cuándo.
- Al abrir un diseño ajustado se ven **en solo lectura** la lista ajustada y la generada, con las filas añadidas, quitadas y cambiadas marcadas, y el aviso si la lista generada cambió desde el ajuste (la misma huella que usa el cliente). Se pueden exportar las dos.
- En los diseños sin ajuste se mantiene lo de hoy: generarla, editarla sin guardar y exportarla.

**Lista: los accesorios entran con todos sus campos (cliente y admin)**

- Columnas nuevas: **Referencia**, **Costo promedio** y **Último costo**. Un ítem que viene de la plantilla no tiene esos datos y deja la celda vacía.
- La unidad se lee de `unitOfMeasurement` o, si falta, de `unitMeasurement`. Se corrige el hallazgo portado.
- Un accesorio sin cantidad, sin unidad o sin costos **lo dice en su fila** («sin cantidad en la norma»…) y no se rellena con valores por omisión.
- Las dos copias de `buildBomSummary` cambian a la vez, con la misma línea base nueva.

**Cliente: los accesorios se asignan bien en la norma**

- `ElementForm.handleAddAccesory` tiene dos fallos al elegir varios accesorios a la vez. Solo el primero recibe el semielaborado elegido, así que los demás no llegan nunca a la lista. Y a los otros elementos seleccionados de la norma solo se les añade el primero. Se corrigen: todos los accesorios elegidos llevan el semielaborado y van a todos los elementos seleccionados, y no se escribe nada antes de validar que haya semielaborado. Hoy no hay datos afectados (21 de 21 con semielaborado).

**Servidor**

- `POST /design/bom-review`: listado ligero, solo ADMIN, con los filtros de arriba y el estado de la lista calculado en el servidor (por prefijo, como el cliente). No trae el contenido de las hojas.
- `GET /design/:id/bom-adjustment` ya admite ADMIN. No cambia.

**Fuera de alcance**

- Que el admin edite o descarte los ajustes del cliente.
- Completar los 16 accesorios guardados sin unidad, costos ni cantidad. Los accesorios y sus costos vienen del ERP por `GET /accesory` cuando se asignan en la norma, y eso ya funciona (confirmado el 2026-10-27). Los 16 se guardaron así antes; la lista los señala, y se completan volviendo a asignarlos en su norma.

## Capabilities

### New Capabilities

- `design-bom-review`: revisión en el admin de las listas de materiales de los diseños del cliente: listado con filtros y comparación de la lista ajustada con la generada.

### Modified Capabilities

- `design-bom-summary`: el listado del admin deja la búsqueda por código y pasa a ser un listado con filtros. Las reglas de armado añaden los campos del accesorio y señalan los datos que faltan.

## Impact

- **`project-admin`**: `DesignBomPage` (listado con filtros, vista de comparación), `buildBomSummary` y `summaryTable` (columnas nuevas), `client-bom-cases.json` regenerado, `bomFingerprint` portado, servicio `bom-review`.
- **`project-front`**: `buildBomSummary` (columnas nuevas, unidad, faltantes), `check-design-bom.ts` y su línea base regenerada, `check-bom-parity.ts`; `ElementForm.tsx` (asignación de accesorios).
- **`project-back`**: `POST /design/bom-review` con su DTO y su servicio.
- **Datos**: ninguno se migra. Hoy `design_bom_adjustment` está vacía, así que cambiar la lista generada no deja ningún ajuste con aviso de lista cambiada. Si se despliega cuando ya haya ajustes, todos avisarán, y es correcto: la lista generada cambió de verdad.
