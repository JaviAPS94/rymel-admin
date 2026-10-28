## 1. Lista de materiales en el paquete (rymel-design-template, project-front)

- [x] 1.1 `@rymel/design-template` v2.3.0 (`f5af7b5`, tag publicado): `buildBomSummaryCells`, `BOM_SUMMARY_COLUMN_WIDTHS`, `parseElementValues` y `bomFingerprint`, con tipos de entrada propios. La huella usa un SHA-256 escrito en el paquete (`sha256.ts`): el guardarraíl prohíbe APIs del entorno y la `lib` es ES2022, sin `crypto.subtle` ni `TextEncoder`. `sha256.spec.ts` con los vectores de FIPS 180-4 y contra `node:crypto`; `bom.spec.ts` con los 7 casos y las huellas que el cliente calculaba con `crypto.subtle`, que coinciden. 136/136
- [x] 1.2 `project-front` (`10291d8`) importa del paquete y borra sus copias; la huella pasa a ser síncrona. `check-bom-cases.ts`, `check-design-bom.ts`, `check-accessory-assignment.ts` y `check-template-load.ts` dan lo mismo que antes; 51 errores de compilación, los de siempre

## 2. Servidor (project-back)

- [x] 2.1 `POST /admin/designs` (solo ADMIN): filtros por código o nombre, norma, país, tipo, subtipo, referencia, fechas, desactualizado y con lista ajustada, en SQL; filas sin hojas; opciones de filtros
- [x] 2.2 `POST /admin/designs/:id/recalculate` (solo ADMIN) con `dryRun`, sobre los sub-diseños desactualizados del diseño
- [x] 2.3 `check-admin-designs.ts` (`83af3a0`, `4443ec7`): 21 de 21 activos; cada filtro contra una consulta SQL directa; sin contenido de hojas; el recálculo recibe solo las hojas desactualizadas y en simulación (con el servicio de recálculo sustituido: no se ejecuta el motor de fórmulas); 404 para un diseño inexistente; solo ADMIN. Añadido `GET /admin/designs/:id/versions` para el estado de versiones (el detalle no lo traía), contrastado con la base

## 3. Admin (project-admin)

- [x] 3.1 Servicio, hooks y tipos de diseños; ruta `/designs` y `/designs/:id` solo ADMIN; entrada «Diseños» en el menú
- [x] 3.2 `DesignListPage`: listado con filtros combinables, que vuelven a la página 1
- [x] 3.3 Visor de hoja de solo lectura sobre la rejilla del editor
- [x] 3.4 `DesignDetailPage`: cabecera, elementos con norma y características, hojas de diseño y de costos, estado de versiones, lista de materiales (ajustada o generada)
- [x] 3.5 Desactivar con confirmación
- [x] 3.6 Recalcular: simular, ver el informe por hoja, aplicar
- [x] 3.7 Exportar a `.xlsx` (ExcelJS 4.4.0, cargado bajo demanda: queda en su propio chunk de 939 kB): hojas de diseño, de costos y lista de materiales, con valores, negrita, colores, decimales, anchos y combinadas; `exportDesign.spec.ts` vuelve a leer el libro
- [x] 3.8 `DesignPages.spec.tsx` (12): fila con tipo, norma, país, elementos y estado; filtros combinados que vuelven a la página 1; abrir el detalle; resumen con características, accesorios y versiones; hojas sin edición y con la fórmula de la celda elegida; costos; lista generada que despliega hijos; lista ajustada marcada y con aviso; desactivar con cancelar y confirmar; recálculo solo tras simular; sin desactualizadas no hay recálculo; exportación con la lista. Suite: 218/218

## 4. Cierre

- [ ] 4.1 A mano: filtrar, abrir el diseño 28, ver sus hojas y su lista, exportarlo
- [ ] 4.2 `copilot-rules.md`: la sección «Diseños», y que la regla de la lista vive en el paquete
