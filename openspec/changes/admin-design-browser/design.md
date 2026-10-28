## Context

- Los diseños los crea y edita el cliente (`project-front`). El admin no tiene ninguna vista de ellos.
- `GET /design/by-id/:id` ya trae todo el diseño. `POST /design/by-filters-paginated` es el listado del diseñador: trae las hojas enteras de cada fila y no filtra por referencia, fecha, desactualizado ni ajuste.
- `DesignRecalculationService.recalculate` existe, con simulación (`dryRun`) y un informe por sub-diseño (`recalculado`, `sin-cambios`, `omitido` o `fallido`), pero solo se usa desde `apply-recalculation.ts`.
- La lista de materiales se arma solo en el cliente (`buildBomSummary`). La copia del admin se retiró el 2026-10-27 porque se mantenían dos copias para una vista que sobraba.
- El admin ya tiene una rejilla de hoja de cálculo, la del editor de plantillas (`components/template/grid`).
- Medido el 2026-10-27: 21 diseños activos.

## Goals / Non-Goals

**Goals:** que el admin encuentre cualquier diseño por lo que sabe de él, vea toda su información sin poder editarla, y pueda desactivarlo, recalcularlo y exportarlo.

**Non-Goals:** editar diseños desde el admin; tocar la lista ajustada por el cliente; recalcular en lote desde el listado.

## Decisions

### 1. Un listado propio del admin, no `by-filters-paginated`

`POST /admin/designs`, solo ADMIN, devuelve filas ligeras: cabecera, tipo y subtipo, elementos con norma, país y referencia, fechas, `stale` (alguna hoja con `is_stale`) y `adjusted` (hay `design_bom_adjustment` vigente). Además devuelve las opciones de los filtros: normas, países, tipos y subtipos que tienen diseños. Los filtros se resuelven en SQL con `EXISTS`, para que la paginación cuente bien.

*Por qué así:* `by-filters-paginated` es del diseñador. Sus filtros son los del cliente y descarga el contenido de las hojas de cada fila. Si se le añaden filtros de admin, se acopla a dos pantallas.

*Alternativa descartada:* filtrar en el navegador. Rompe la paginación y descarga todas las hojas.

### 2. El detalle reutiliza `GET /design/by-id/:id`

No hace falta otra ruta: ya trae elementos, hojas y costos. La lista ajustada sale de `GET /design/:id/bom-adjustment`, y la estructura, de `GET /bill-of-materials/search`.

### 3. Hojas en solo lectura sobre la rejilla del editor

Las hojas guardadas (`value`, `formula`, `computed` y estilos) se adaptan a la rejilla del editor de plantillas en modo de solo lectura, que pinta los valores calculados y no deja escribir.

*Alternativa descartada:* una tabla HTML propia. Sería una tercera forma de pintar hojas y no mostraría el formato (anchos, combinadas, colores) que el cliente ve.

### 4. La lista de materiales pasa al paquete compartido

`buildBomSummaryCells` y `bomFingerprint` se mueven a `@rymel/design-template`, junto con `bom-cases.json` como prueba del paquete. El cliente y el admin los importan por tag. La lista se define con la configuración de la plantilla (zonas, catálogos, vínculos), que es justo lo que modela ese paquete.

*Por qué así:* el admin necesita la lista generada de los diseños sin ajuste, y una segunda copia de la regla ya se retiró una vez por el riesgo de divergir. Un solo origen lo evita.

*Alternativas descartadas:*
- **Armarla en el servidor.** Daría un único sitio, pero cambia dónde se calcula la lista del cliente, que hoy funciona y ya tiene sus ajustes y su huella. Es más radio de impacto del que pide una vista de admin.
- **Mostrar en el admin solo la lista ajustada.** No sirve para los diseños sin ajuste, que hoy son todos.

### 5. Recálculo de un diseño, con simulación obligatoria antes

`POST /admin/designs/:id/recalculate` recibe `{ dryRun: boolean }`. Toma los `sub_design` desactualizados del diseño y llama a `recalculate(ids, email del admin, dryRun)`. La interfaz solo ofrece «Aplicar» después de una simulación que muestra el informe por hoja.

*Por qué así:* el recálculo reescribe números que alguien ya vio (así lo dice `apply-recalculation.ts`). Simular primero es lo que se hace hoy a mano con el script.

### 6. Exportar a `.xlsx` con ExcelJS

Una pestaña por hoja de diseño, una por hoja de costos y una con la lista de materiales. Se exportan los valores calculados, no las fórmulas: las fórmulas de diseño son cifradas y Excel no las sabría evaluar.

*Alternativa descartada:* un CSV por hoja. Un diseño tiene varias hojas, y varios CSV sueltos no se leen como un diseño. ExcelJS es una dependencia nueva del admin, con licencia MIT y sin dependencias nativas.

## Risks / Trade-offs

- **[Riesgo] Mover la regla al paquete cambia la lista del cliente sin querer.** → Las líneas base del cliente (`check-bom-cases.ts`, `check-design-bom.ts`) se ejecutan antes y después de subir el tag, y deben dar lo mismo.
- **[Riesgo] Recalcular desde el admin reescribe valores que el cliente ya vio.** → La simulación es obligatoria, el informe va por hoja, y la hoja ya muestra el aviso de valores recalculados (`design-recalculation`).
- **[Trade-off] El admin ve la lista generada con la regla de su tag del paquete**, que puede ir por detrás de la del cliente si no se suben a la vez. → Se suben juntos en el plan de despliegue.

## Migration Plan

1. `rymel-design-template`: la regla de la lista y su huella, con sus casos; tag nuevo.
2. `project-front`: importar del paquete; líneas base iguales.
3. `project-back`: `AdminDesignsController`.
4. `project-admin`: sección «Diseños».

Rollback: cada repo por separado. No hay datos.

## Open Questions

_Ninguna por ahora._
