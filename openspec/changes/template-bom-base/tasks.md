## 1. Paquete (rymel-design-template)

- [x] 1.1 `SheetStyles.billOfMaterials` (estructura de origen) y su serialización; campo opcional, el contrato no rompe
- [x] 1.2 `buildBomBaseSheet(estructura, hojas)`: secciones de hojas a raíz, hijos desplegados, ítems de las zonas con cantidad, descripción y unidad como fórmulas a la celda vinculada y al catálogo; huérfanos como texto con su aviso
- [x] 1.3 `withAccessories(celdas, elemento)`: accesorios al final de la sección de su semielaborado, con todos sus campos y su Observación, desplazando lo de debajo
- [x] 1.4 Validación: `duplicate-bom-sheet`; las fórmulas de la base a hojas que no existen ya las reporta `unknown-sheet`
- [x] 1.5 `bomBase.spec.ts`: fórmulas correctas, nombre de hoja con espacios entre comillas, marca que sobrevive a guardar y leer, la base **calculada con el motor da las mismas filas** que `buildBomSummaryCells` en los `sub_design` 90 y 91, accesorios, validación. v2.4.0 (`e92b622`). Añadido en la implementación: `evaluateBomBase` (v2.5.0), porque el diseñador solo recalcula la hoja que edita y el `computed` guardado de la base se quedaría atrás. 145/145

## 2. Admin (project-admin)

- [x] 2.1 Editor de plantillas: acción «Lista de materiales» (elegir estructura, generar; si ya hay base, regenerar con confirmación); la hoja base se distingue en las pestañas
- [x] 2.2 Diagnósticos nuevos en el panel de problemas
- [x] 2.3 «Diseños»: con hoja base en el diseño, la lista es la base calculada con `evaluateBomBase` (no su `computed`, por lo mismo que en el cliente) más los accesorios; la base no sale entre las hojas ni se exporta aparte; sin base, como ahora
- [x] 2.4 `BomBasePanel.spec.tsx` (5): generar con fórmulas, regenerar con confirmación y cancelar, `setBomSheet` (al final, calculada, activa; conserva nombre y posición; un paso de deshacer; no pisa una hoja homónima). El ida y vuelta guardar/publicar/leer está en el servidor (`check-bom-base-template.ts`). «Diseños» con base en `DesignPages.spec.tsx` y `exportDesign.spec.ts`. Suite: 225/225

## 3. Cliente (project-front)

- [x] 3.1 Cargar la hoja base con las demás, calcularla y guardarla; no mostrarla en las pestañas de hojas
- [x] 3.2 `BomSummaryTab`: con base, la base calculada más los accesorios; aviso si la estructura de la referencia del elemento es otra; sin base, como ahora
- [x] 3.3 Ajustes y huella sobre la lista con base
- [x] 3.4 `check-bom-base.ts` (front, 10/10): plantilla con base y una fila fija del admin, carga, la base fuera de las pestañas, edición de un valor del diseño, lista con el valor nuevo (no el guardado), accesorio al final de su sección tras las filas de la base, huella que cambia. En el servidor, `check-bom-base-template.ts`: borrador, publicación y biblioteca conservan la marca. `check-template-load.ts`, `check-bom-cases.ts` y `check-design-bom.ts` en verde; 51 errores, los de siempre

## 4. Cierre

- [ ] 4.1 A mano: generar la base en una plantilla, ajustarla, publicarla, crear un diseño en el cliente y ver la lista con los accesorios; verla igual en «Diseños». **Pendiente:** navegador y reiniciar project-back
- [x] 4.2 `copilot-rules.md`: la base vive en la plantilla
