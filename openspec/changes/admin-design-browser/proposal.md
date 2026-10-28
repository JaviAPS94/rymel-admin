## Why

El admin define plantillas, fórmulas, estructuras BOM y reglas de código, pero no tiene dónde ver lo que el cliente hace con todo eso: los diseños. Para saber qué diseños hay, con qué norma y elemento, si están desactualizados o qué lista de materiales lleva cada uno, hoy hay que entrar en `project-front` o consultar la base. El 2026-10-27 se pidió una sección del admin para **ver todos los diseños del cliente con toda la información posible, con filtros, y gestionarlos**. Es una sección distinta de la lista de materiales, que se define en la plantilla.

Lo que ya existe en `project-back`:

- `POST /design/by-filters-paginated` (ADMIN y DESIGN) filtra por país (opcional desde `move-bom-summary-to-admin`), nombre de norma, tipo, subtipo y código, pero **carga el contenido de todas las hojas** de cada diseño de la página.
- `GET /design/by-id/:id` (ADMIN y DESIGN) devuelve el diseño completo: subtipo y tipo, elementos con su norma y país, hojas (`sub_design`) y costos (`cost` con sus `sub_cost`).
- `DELETE /design/:id` hace el borrado lógico.
- `DesignRecalculationService.recalculate(subDesignIds, triggeredBy, dryRun)` recalcula sub-diseños desactualizados (`sub_design.is_stale`), pero **solo desde un script** (`apply-recalculation.ts`): no tiene ruta.
- `GET /design/:id/bom-adjustment` da la lista de materiales ajustada por el cliente, si la hay.

## What Changes

**Admin: sección «Diseños»** (solo ADMIN)

- Un **listado** de todos los diseños activos con filtros por código o nombre, norma, país, tipo y subtipo, referencia ERP del elemento, fecha de creación o de actualización, *desactualizado* (alguna hoja con `is_stale`) y *con lista ajustada por el cliente*. Cada fila muestra el código, el nombre, el tipo y el subtipo, la norma, el país, los elementos con su referencia, las fechas y las marcas de desactualizado y de lista ajustada.
- Un **detalle** de solo lectura con toda la información del diseño:
  - la cabecera;
  - los elementos con su norma y sus características técnicas;
  - las hojas de diseño y las de costos, como hoja de cálculo de solo lectura;
  - el estado de versiones (qué fórmulas se usaron y si hay alguna desactualizada);
  - la lista de materiales que ve el cliente: la ajustada, si la ajustó, o la generada.
- **Acciones**:
  - **Desactivar** (borrado lógico, con confirmación).
  - **Recalcular** un diseño desactualizado: primero se simula y se ven los cambios, después se aplica.
  - **Exportar** el diseño a Excel, con una pestaña por hoja.

**Servidor**

- `POST /admin/designs` (solo ADMIN): el listado ligero con los filtros de arriba, sin el contenido de las hojas, y con las opciones de los filtros (normas, países, tipos y subtipos que tienen diseños).
- `POST /admin/designs/:id/recalculate` (solo ADMIN), con `dryRun`: llama a `DesignRecalculationService.recalculate` con los sub-diseños desactualizados del diseño y el usuario que lo pide.

**La lista de materiales en un solo sitio**

- Para que el admin muestre la lista generada sin una segunda copia de `buildBomSummary`, la regla pasa del cliente al paquete compartido `@rymel/design-template`, que ya consumen los dos repos por tag. El cliente la importa de ahí, y su comportamiento no cambia (lo fijan `check-bom-cases.ts` y `check-design-bom.ts`).

**Fuera de alcance**

- Editar un diseño desde el admin. Se edita en el cliente.
- Modificar o descartar la lista ajustada por el cliente.
- Recalcular en lote varios diseños desde el listado. Va primero el recálculo de uno, con simulación.

## Capabilities

### New Capabilities

- `design-admin-browser`: listado con filtros, detalle de solo lectura y gestión (desactivar, recalcular, exportar) de los diseños del cliente desde el admin.

### Modified Capabilities

_Ninguna._ El recálculo usa la regla existente de `design-recalculation`, y solo gana una ruta.

## Impact

- **`project-admin`**: página `DesignListPage` (`/designs`) y `DesignDetailPage` (`/designs/:id`), entrada en el menú, servicio y hooks de diseños, visor de hoja de solo lectura sobre la rejilla del editor de plantillas, exportación a Excel (dependencia nueva, ver `design.md`).
- **`project-back`**: `AdminDesignsController` con el listado y el recálculo.
- **`rymel-design-template`**: `buildBomSummaryCells` y su huella, con sus casos de prueba; versión menor nueva.
- **`project-front`**: importa la lista del paquete y sube el tag.
- **Datos**: ninguno.
