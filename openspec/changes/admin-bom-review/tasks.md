## 1. Evidencia

- [x] 1.1 `project-back/src/db/scripts/audit-bom-sources.ts` contra la base (2026-10-27): 21 diseños, 36 elementos, 9 con accesorios de 8 normas; 21 accesorios, todos con semielaborado; 16 sin unidad, costos ni cantidad (6 normas, 4 en elementos usados por diseños); ningún otro campo de la norma lleva semielaborado

## 2. Reglas de la lista (project-front y project-admin a la vez)

- [x] 2.1 `buildBomSummary` en los dos repos: columnas F–I (Referencia, Costo promedio, Último costo, Observación), unidad desde `unitOfMeasurement` o `unitMeasurement`, faltantes en Observación sin valores por omisión
- [x] 2.2 Casos nuevos en las líneas base: accesorio completo, sin cantidad y con `unitMeasurement`; regenerar `bom-baseline.json` (front) y `client-bom-cases.json` (admin) y revisar a mano el diff de las filas existentes (solo deben cambiar F–I y la unidad corregida). Hecho con `check-bom-parity.ts --write` (nuevo). Revisado: fuera de F–I solo cambia la U.M. de ACC-2, que traía `unitMeasurement`; en `bom-baseline.json`, con datos reales, solo cambian F–I
- [x] 2.3 `check-bom-parity.ts` y `buildBomSummary.spec.ts` en verde con la línea base nueva
- [x] 2.4 Exportación CSV del admin con las columnas nuevas; `summaryTable.spec.ts` actualizado

## 2b. Norma (project-front)

- [ ] 2b.1 `ElementForm.handleAddAccesory`: validar semielaborado antes de escribir; todos los accesorios elegidos con `semiFinished`; añadirlos todos a cada elemento seleccionado
- [ ] 2b.2 Prueba: tres accesorios, un semielaborado, dos elementos → los dos elementos con los tres, todos con semielaborado; sin semielaborado → nada cambia
- [ ] 2b.3 `audit-bom-sources.ts` sigue dando 21 de 21 con semielaborado (no se tocan datos)

## 3. Servidor (project-back)

- [ ] 3.1 Extraer la regla de prefijo de `GET /bill-of-materials/search` a una función compartida
- [ ] 3.2 `POST /design/bom-review` (solo ADMIN): paginado, filtros por norma, referencia ERP, estado y fechas, en SQL; filas sin contenido de hojas
- [ ] 3.3 Script contra la base: el estado de los 21 diseños coincide con la búsqueda de estructuras uno a uno (28 y 29 *generables*, 19 *sin estructura*); un ajuste de prueba aparece como *ajustada* con autor y fecha y se limpia al terminar; DESIGN recibe 403

## 4. Admin (project-admin)

- [ ] 4.1 Servicio y hook de `bom-review`; tipos
- [ ] 4.2 `DesignBomPage`: listado con filtros, sin campo de código; estado y ajuste por fila
- [ ] 4.3 Portar `bomFingerprint` con prueba de que da la misma huella que el cliente para los mismos casos
- [ ] 4.4 Comparación: emparejar filas por semielaborado + Ítem; marcar añadidas, quitadas y cambiadas con sus celdas; aviso de lista cambiada o estructura que ya no corresponde; todo en solo lectura
- [ ] 4.5 Exportar ajustada y generada por separado
- [ ] 4.6 Pruebas de la página: filtro por estado, comparación con cantidad cambiada, fila añadida y fila quitada, sin acciones de guardar ni borrar

## 5. Cierre

- [ ] 5.1 A mano: ajustar en el cliente el diseño 28 (cantidad cambiada + fila añadida), verlo en el admin filtrando por *ajustada* y comparar
- [ ] 5.2 `copilot-rules.md`: dos fuentes de la lista (plantilla y accesorios de la norma), columnas, y que el admin revisa sin modificar
- [x] 5.3 Preguntas de `design.md` respondidas el 2026-10-27 y registradas
