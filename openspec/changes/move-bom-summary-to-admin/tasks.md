## 1. Evidencia

- [x] 1.1 Medir con la base: 21 diseños, todos con referencia ERP; 10 con 2 o 3 elementos de referencias distintas; 2 estructuras BOM activas; solo `1-25-220-120` es prefijo de alguna referencia, y corresponde a los diseños 28 y 29 (`sub_design` 90 y 91)

## 2. Servidor (project-back)

- [x] 2.1 Filtro de país opcional en `findAllPaginated`
- [x] 2.2 `check-design-list.ts` contra la base: sin país, 21 de 21; con país 1002, 20 de 20, y con país 1004, 1 de 1, igual que el filtro directo

## 3. Admin (project-admin)

- [x] 3.1 Tipos de diseño, elemento, hojas guardadas y BOM; servicio de diseños y búsqueda de BOM por código
- [x] 3.2 Portar `buildBomSummary` y `parseElementValues` sin cambiar sus reglas
- [x] 3.3 `client-bom-cases.json`, generado con el `buildBomSummary` del cliente antes de retirarlo: `sub_design` 90 y 91 con hijos plegados y desplegados, accesorios, ítem inexistente y catálogo borrado. `buildBomSummary.spec.ts` (8) los reproduce celda a celda, estilos incluidos. **Hallazgo portado sin corregir:** un accesorio con su unidad en `unitMeasurement` sale sin unidad, porque el cliente solo lee `unitOfMeasurement`
- [x] 3.4 `DesignBomPage`: listado con búsqueda, elección de diseño, despliegue de hijos y mensajes de fallo
- [x] 3.4b `BomSheetEditor`: la lista como hoja editable, igual que en el cliente, sobre la rejilla, el motor y las barras del editor de plantillas; no se guarda, desplegar la rearma y la exportación lleva lo editado. Pedido el 2026-10-08 tras ver la primera versión de solo lectura
- [x] 3.5 Exportación CSV (`;`, UTF-8 con BOM)
- [x] 3.6 Ruta `/design-bom` solo ADMIN y entrada en el menú
- [x] 3.7 `DesignBomPage.spec.tsx` (6) con los datos reales del diseño 28: lista armada con la estructura de su referencia, despliegue de hijos con la celda ▶/▼, edición con fórmula exportada con lo editado, lo editado perdido al desplegar como en el cliente, elemento elegible y sin referencia ERP; y `summaryTable.spec.ts` (4) para el CSV

## 4. Cliente (project-front)

- [x] 4.1 Retirar la pestaña, `BomSummaryTab`, `buildBomSummary` y `billOfMaterialsApi`
- [x] 4.2 Retirar el videotutorial de BOM; era el único, así que la sección «Videotutoriales» de las instrucciones sale entera. También sale `onCellClick` de `SpreadSheet`, que solo usaba la pestaña
- [x] 4.3 Sale `check-design-bom.ts` del cliente con sus volcados —su línea base la sustituye la prueba de paridad del admin— y `check-roundtrip.ts` deja de armar la lista; sus otras comprobaciones y `check-read-only.ts` y `check-template-load.ts` siguen en verde. 51 errores de compilación, los mismos de antes

## 4b. Vuelta al cliente (2026-10-27)

- [x] 4b.1 Revertido `1c43522` en `project-front`: vuelven la pestaña, `BomSummaryTab`, `buildBomSummary`, `billOfMaterialsApi`, el videotutorial, `onCellClick` de `SpreadSheet`, `check-design-bom.ts` con sus volcados y la comprobación del resumen BOM en `check-roundtrip.ts`
- [x] 4b.2 `check-design-bom.ts` igual que la línea base (90, 91 y `TEMPLATE_1F_0001`) y `check-template-load.ts` en verde; 51 errores de compilación, los mismos de antes
- [ ] 4b.3 Abrir a mano el diseño 28 en el diseñador y ver su lista con la estructura `1-25-220-120`

## 5. Cierre

- [x] 5.1 `dump-design-bom-input.ts` (back) vuelca la respuesta real de `GET /design/by-id/28` y de la búsqueda de BOM, y `scripts/check-design-bom.ts` (admin) arma con ella la lista: 6/6, incluido `240 · Fibra de 2 mm · 3 · KLS` en el CSV
- [x] 5.2 `copilot-rules.md`: la lista de materiales vive en el admin

## 6. Retirada (2026-10-27)

- [x] 6.1 La pestaña vuelve al cliente (`bom-summary-in-client`)
- [x] 6.2 La sección `/design-bom` del admin y su copia de `buildBomSummary` se retiran (`bom-accessory-fields`, tarea 4); los casos de prueba pasan al cliente
- [x] 6.3 El spec se queda con las reglas de armado y los fallos explicados (en el cliente), con que el cliente conserva la lista y con el filtro de país opcional
