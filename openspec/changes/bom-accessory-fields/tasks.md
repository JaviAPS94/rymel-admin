## 1. Evidencia

- [x] 1.1 `project-back/src/db/scripts/audit-bom-sources.ts` contra la base (2026-10-27): 21 diseños, 36 elementos, 9 con accesorios de 8 normas; 21 accesorios, todos con semielaborado; 16 sin unidad, costos ni cantidad (6 normas, 4 en elementos usados por diseños); ningún otro campo de la norma lleva semielaborado

## 2. Lista (project-front)

- [x] 2.1 `buildBomSummary`: columnas F–I, unidad desde `unitOfMeasurement` o `unitMeasurement`, faltantes en Observación sin valores por omisión
- [x] 2.2 Caso nuevo de accesorios de la norma (completo, sin cantidad, con `unitMeasurement`); líneas base regeneradas y revisadas a mano: fuera de F–I solo cambia la U.M. del accesorio que traía `unitMeasurement`; con datos reales (`bom-baseline.json`), solo F–I
- [x] 2.3 Los casos viven en `scripts/fixtures/bom-cases.json` y los comprueba `check-bom-cases.ts` (antes `check-bom-parity.ts`, contra el fixture del admin, que se retiró)

## 3. Norma (project-front)

- [x] 3.1 `ElementForm.handleAddAccesory`: validar semielaborado antes de escribir; todos los accesorios elegidos con `semiFinished`; añadirlos todos a cada elemento seleccionado
- [x] 3.2 `scripts/check-accessory-assignment.ts` (8/8): tres accesorios, un semielaborado, dos elementos → los dos con los tres, todos con semielaborado, sin repetir, y en la lista bajo su semielaborado
- [x] 3.3 `audit-bom-sources.ts` sigue dando 21 de 21 con semielaborado

## 4. Retirada de la revisión por diseño (2026-10-27)

- [x] 4.1 Admin: fuera `/design-bom`, `DesignBomPage`, `components/bom-summary` (copia de `buildBomSummary`, huella, comparación, CSV, `BomSheetEditor`), `useDesignBom`, `designService`, `designBom.types`, `bomService.searchByCode` y `scripts/check-design-bom.ts`. Compila; 204/204 pruebas
- [x] 4.2 Servidor: revertido `POST /design/bom-review` (`314c06b`)
- [ ] 4.3 Probar a mano en el cliente la lista del diseño 28 con las columnas nuevas
