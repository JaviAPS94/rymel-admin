## 1. Lista de materiales en el paquete (rymel-design-template, project-front)

- [ ] 1.1 Mover `buildBomSummaryCells`, `BOM_SUMMARY_COLUMN_WIDTHS` y `bomFingerprint` a `@rymel/design-template`, con `bom-cases.json` como prueba del paquete; tag nuevo
- [ ] 1.2 `project-front` importa del paquete y sube el tag; `check-bom-cases.ts`, `check-design-bom.ts` y `check-accessory-assignment.ts` dan lo mismo que antes

## 2. Servidor (project-back)

- [ ] 2.1 `POST /admin/designs` (solo ADMIN): filtros por código o nombre, norma, país, tipo, subtipo, referencia, fechas, desactualizado y con lista ajustada, en SQL; filas sin hojas; opciones de filtros
- [ ] 2.2 `POST /admin/designs/:id/recalculate` (solo ADMIN) con `dryRun`, sobre los sub-diseños desactualizados del diseño
- [ ] 2.3 Script contra la base: el listado devuelve los 21 activos; cada filtro, contrastado con una consulta directa; la simulación de recálculo no escribe

## 3. Admin (project-admin)

- [ ] 3.1 Servicio, hooks y tipos de diseños; ruta `/designs` y `/designs/:id` solo ADMIN; entrada «Diseños» en el menú
- [ ] 3.2 `DesignListPage`: listado con filtros combinables, que vuelven a la página 1
- [ ] 3.3 Visor de hoja de solo lectura sobre la rejilla del editor
- [ ] 3.4 `DesignDetailPage`: cabecera, elementos con norma y características, hojas de diseño y de costos, estado de versiones, lista de materiales (ajustada o generada)
- [ ] 3.5 Desactivar con confirmación
- [ ] 3.6 Recalcular: simular, ver el informe por hoja, aplicar
- [ ] 3.7 Exportar a `.xlsx` (ExcelJS): hojas de diseño, de costos y lista de materiales
- [ ] 3.8 Pruebas de las dos páginas: filtros, solo lectura, lista ajustada frente a generada, desactivar con y sin confirmación, recálculo solo tras simular, exportación con sus pestañas

## 4. Cierre

- [ ] 4.1 A mano: filtrar, abrir el diseño 28, ver sus hojas y su lista, exportarlo
- [ ] 4.2 `copilot-rules.md`: la sección «Diseños», y que la regla de la lista vive en el paquete
