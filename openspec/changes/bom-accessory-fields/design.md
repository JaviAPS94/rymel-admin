## Context

- La lista se arma en `project-front` (`buildBomSummary`, pestaña «LISTA DE MATERIALES»). Su base sale de la plantilla, que define el admin, y de los accesorios de la norma. La estructura BOM se busca por prefijo de la referencia del elemento cuando el cliente usa la plantilla.
- Los accesorios son ítems del ERP (`OutputAccesoryDto`: `item_id`, `referencia`, `descripcion`, `unidad_inventario`, `costo_promedio`, `ultimo_costo`). La norma les añade `value` y `semiFinished`, y se guardan en `element.values` bajo `accesories`.
- Medido el 2026-10-27 (`audit-bom-sources.ts`): 21 accesorios, todos con semielaborado; 16 sin unidad, costos ni cantidad, que son datos antiguos.

## Goals / Non-Goals

**Goals:** que los accesorios entren en la lista con todos sus campos, diciendo lo que les falta; y que la norma no deje accesorios sin semielaborado.

**Non-Goals:** completar los 16 accesorios antiguos (se completan volviendo a asignarlos en su norma); que entren en la lista otros campos de la norma; que el admin revise la lista por diseño.

## Decisions

### 1. Columnas nuevas al final

Las columnas nuevas son Referencia (F), Costo promedio (G), Último costo (H) y Observación (I), y A–E no se mueven. Así siguen cuadrando los ajustes ya guardados, los CSV exportados y quien ya trabaja con la hoja.

*Alternativa descartada:* poner Referencia junto al Ítem. Se lee mejor, pero desplaza descripción, cantidad y unidad.

### 2. Un faltante se dice, no se rellena

La cantidad se deja vacía y la Observación dice «sin cantidad en la norma». Lo mismo con la unidad y los costos. Un 1 inventado en una lista de materiales se acaba comprando.

### 3. Asignación de accesorios en la norma

La lógica pasa a `accessoryAssignment.ts` (`pickAccessories`, `addAccessoriesToElements`). `handleAddAccesory` valida primero que haya semielaborado y después escribe todos los accesorios elegidos en el formulario y en cada elemento seleccionado.

### 4. Una sola copia de la regla

La lista se arma solo en el cliente. Los casos de prueba (`sub_design` 90 y 91, ítem inexistente, catálogo borrado y accesorios de la norma) viven en `project-front/scripts/fixtures/bom-cases.json`, y se comprueban y regeneran con `check-bom-cases.ts [--write]`.

## Risks / Trade-offs

- **[Riesgo] Las huellas de ajustes ya guardados dejan de coincidir** porque cambia la lista generada. → Hoy `design_bom_adjustment` está vacía. Si ya hubiera ajustes, avisarían de que la lista cambió, y sería verdad.
- **[Trade-off] Costos de la norma.** Son los que devolvió el ERP al asignar el accesorio. Confirmado el 2026-10-27 que esa es la fuente.
