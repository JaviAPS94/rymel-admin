## 1. Paquete (rymel-design-template)

- [ ] 1.1 `SheetStyles.billOfMaterials` (estructura de origen) y su serialización; campo opcional, el contrato no rompe
- [ ] 1.2 `buildBomBaseSheet(estructura, hojas)`: secciones de hojas a raíz, hijos desplegados, ítems de las zonas con cantidad, descripción y unidad como fórmulas a la celda vinculada y al catálogo; huérfanos como texto con su aviso
- [ ] 1.3 `withAccessories(celdas, elemento)`: accesorios al final de la sección de su semielaborado, con todos sus campos y su Observación, desplazando lo de debajo
- [ ] 1.4 Validación: más de una hoja base; fórmulas de la base a hojas que no existen
- [ ] 1.5 Pruebas: generación sobre la plantilla de prueba (fórmulas correctas), evaluación con `@rymel/formula-engine` igual a la lista de hoy para los `sub_design` 90 y 91, accesorios, validación; tag nuevo

## 2. Admin (project-admin)

- [ ] 2.1 Editor de plantillas: acción «Lista de materiales» (elegir estructura, generar; si ya hay base, regenerar con confirmación); la hoja base se distingue en las pestañas
- [ ] 2.2 Diagnósticos nuevos en el panel de problemas
- [ ] 2.3 «Diseños»: con hoja base en el diseño, la lista es su `computed` más los accesorios; sin base, como ahora; exportación igual
- [ ] 2.4 Pruebas del editor (generar, regenerar con confirmación, guardar y volver a abrir con la marca) y de «Diseños» con base

## 3. Cliente (project-front)

- [ ] 3.1 Cargar la hoja base con las demás, calcularla y guardarla; no mostrarla en las pestañas de hojas
- [ ] 3.2 `BomSummaryTab`: con base, la base calculada más los accesorios; aviso si la estructura de la referencia del elemento es otra; sin base, como ahora
- [ ] 3.3 Ajustes y huella sobre la lista con base
- [ ] 3.4 `check-template-load.ts` y una comprobación de punta a punta: plantilla de prueba con base publicada, diseño con un elemento con accesorios, lista esperada

## 4. Cierre

- [ ] 4.1 A mano: generar la base en una plantilla, ajustarla, publicarla, crear un diseño en el cliente y ver la lista con los accesorios; verla igual en «Diseños»
- [ ] 4.2 `copilot-rules.md`: la base vive en la plantilla
