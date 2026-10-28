## 1. Evidencia

- [x] 1.1 `project-back/src/db/scripts/audit-bom-sources.ts` contra la base (2026-10-27): 21 diseños, 36 elementos, 9 con accesorios de 8 normas; 21 accesorios, todos con semielaborado; 16 sin unidad, costos ni cantidad (6 normas, 4 en elementos usados por diseños); ningún otro campo de la norma lleva semielaborado

## 2. Reglas de la lista (project-front y project-admin a la vez)

- [x] 2.1 `buildBomSummary` en los dos repos: columnas F–I (Referencia, Costo promedio, Último costo, Observación), unidad desde `unitOfMeasurement` o `unitMeasurement`, faltantes en Observación sin valores por omisión
- [x] 2.2 Casos nuevos en las líneas base: accesorio completo, sin cantidad y con `unitMeasurement`; regenerar `bom-baseline.json` (front) y `client-bom-cases.json` (admin) y revisar a mano el diff de las filas existentes (solo deben cambiar F–I y la unidad corregida). Hecho con `check-bom-parity.ts --write` (nuevo). Revisado: fuera de F–I solo cambia la U.M. de ACC-2, que traía `unitMeasurement`; en `bom-baseline.json`, con datos reales, solo cambian F–I
- [x] 2.3 `check-bom-parity.ts` y `buildBomSummary.spec.ts` en verde con la línea base nueva
- [x] 2.4 Exportación CSV del admin con las columnas nuevas; `summaryTable.spec.ts` actualizado

## 2b. Norma (project-front)

- [x] 2b.1 `ElementForm.handleAddAccesory`: validar semielaborado antes de escribir; todos los accesorios elegidos con `semiFinished`; añadirlos todos a cada elemento seleccionado
- [x] 2b.2 `scripts/check-accessory-assignment.ts` (front, 8/8): tres accesorios, un semielaborado, dos elementos → los dos con los tres, todos con semielaborado, sin repetir, y los tres en la lista bajo su semielaborado. La lógica pasa a `accessoryAssignment.ts`; «sin semielaborado no se escribe» queda en el componente, que ahora valida antes de escribir (sin prueba automática: el cliente no tiene framework de pruebas de componentes)
- [x] 2b.3 `audit-bom-sources.ts` sigue dando 21 de 21 con semielaborado (no se tocan datos)

## 3. Servidor (project-back)

- [x] 3.1 Extraer la regla de prefijo de `GET /bill-of-materials/search` a una función compartida
- [x] 3.2 `POST /design/bom-review` (solo ADMIN): paginado, filtros por norma, referencia ERP, estado y fechas, en SQL; filas sin contenido de hojas
- [x] 3.3 `check-bom-review.ts` contra la base: 21 de 21 diseños con el estado que da `findByCode` (28 y 29 *generables*, 19 *sin estructura*); filtros por estado, referencia y fecha de ajuste; paginación; sin contenido de hojas; un ajuste de prueba sale como *ajustada* con autor y fecha. El 403 de DESIGN se comprueba por los metadatos de roles de la ruta (solo `ADMIN`), no con una petición: no hay token de prueba

## 4. Admin (project-admin)

- [x] 4.1 Servicio y hook de `bom-review`; tipos
- [x] 4.2 `DesignBomPage`: listado con filtros, sin campo de código; estado y ajuste por fila
- [x] 4.3 Portar `bomFingerprint` con prueba de que da la misma huella que el cliente para los mismos casos
- [x] 4.4 Comparación: emparejar filas por semielaborado + Ítem; marcar añadidas, quitadas y cambiadas con sus celdas; aviso de lista cambiada o estructura que ya no corresponde; todo en solo lectura
- [x] 4.5 Exportar ajustada y generada por separado
- [x] 4.6 `DesignBomPage.spec.tsx` (11): sin campo de código, estado y norma por fila, filtros que vuelven a la página 1, comparación con cantidad cambiada (celda marcada), fila añadida y accesorio quitado, sin hoja editable ni acciones de guardar o borrar, aviso de lista cambiada, exportación de la ajustada; `bomDiff.spec.ts` (5) y `bomFingerprint.spec.ts` (3, con huellas calculadas en el cliente). Suite completa: 237/237. Arreglado de paso: al cambiar un filtro se vaciaba el desplegable de normas mientras cargaba (`keepPreviousData`)

## 5. Cierre

- [ ] 5.1 A mano: ajustar en el cliente el diseño 28 (cantidad cambiada + fila añadida), verlo en el admin filtrando por *ajustada* y comparar. **Pendiente:** necesita sesión en el navegador y reiniciar project-back para que cargue `POST /design/bom-review`
- [x] 5.2 `copilot-rules.md`: dos fuentes de la lista (plantilla y accesorios de la norma), columnas, y que el admin revisa sin modificar
- [x] 5.3 Preguntas de `design.md` respondidas el 2026-10-27 y registradas
