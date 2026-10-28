## 1. Punto de partida

- [x] 1.1 Pestaña restaurada en `project-front` revirtiendo `1c43522` (tarea 4b del change `move-bom-summary-to-admin`); `check-design-bom.ts` igual que la línea base, `check-template-load.ts` en verde, 51 errores de compilación, los mismos de antes
- [x] 1.2 Commit de la restauración en `project-front`, separado de los cambios del rastreo de celdas sin commitear
- [x] 1.3 Paridad: `scripts/check-bom-parity.ts` (front) pasa los 6 casos de `client-bom-cases.json` del admin por el `buildBomSummary` restaurado: 6/6 iguales

## 2. Servidor (project-back)

- [x] 2.1 Entidad `DesignBomAdjustment` y migración `design_bom_adjustment` (`design_id` único, FK a `design`)
- [x] 2.2 `GET/PUT/DELETE /design/:id/bom-adjustment` con los roles del guardado de diseños; 404 sin ajustes o sin diseño; límite de cuerpo como el de diseños
- [x] 2.3 `deleteById` del diseño borra sus ajustes; `updateDesign` no los toca
- [x] 2.4 `src/db/scripts/check-bom-adjustment.ts` contra la base, tras la migración `DesignBomAdjustment1788700000000`: 12/12 sobre un diseño de prueba que crea y borra (no el 28 real) — 404 sin ajustes, guardar, reemplazar, una fila por diseño, guardar el diseño no los toca, descartar y volver a guardar, borrar el diseño los borra, base como estaba. Con la app levantada, `GET /design/28/bom-adjustment` sin token responde 401 (la ruta existe)

## 3. Cliente (project-front)

- [x] 3.1 Prop `readOnly` (y `readOnlyMessage`) en `SpreadSheet` sobre `isProtected`. La barra de formato se publicaba en `window.onCellStyleToolbarRender`, compartida entre instancias: pasa a ser la prop `styleToolbar` de `FormulaBar`, para que la lista en lectura no oculte la barra de la hoja del diseño
- [x] 3.2 `bomAdjustmentApi` (RTK Query) registrada en el store
- [x] 3.3 `BomSummaryTab`: lectura por omisión; «Editar», «Guardar ajustes», «Descartar» y «Volver a la lista generada» (con confirmación); «Guardar ajustes» deshabilitado si el diseño no tiene id
- [x] 3.4 Huella SHA-256 de la lista generada sin editar (`bomFingerprint.ts`, JSON con claves ordenadas); al abrir, si hay ajustes, se muestran marcados con autor y fecha, y se avisa si la huella no coincide o la estructura ya no aplica. `check-bom-parity.ts` comprueba que no depende del orden y que cambia con una celda
- [x] 3.5 Las celdas ▶/▼ solo despliegan en lectura y sobre la lista generada; en edición o sobre la ajustada lo explican y no hacen nada
- [x] 3.6 `BomTutorial`: pasos de texto «Generar la lista», «Ajustar y guardar» y aviso de lista cambiada en «¡Listo!». Las escenas animadas no se redibujaron: «Ajustar y guardar» reutiliza la de generar
- [x] 3.7 `check-design-bom.ts` igual que la línea base, `check-template-load.ts` en verde, 51 errores de compilación, los mismos de antes. ESLint no corre en el repo (falla al cargar `@typescript-eslint/no-unused-expressions`, ya pasaba)

## 4. Verificación y cierre

- [ ] 4.1 A mano con el diseño 28: generar en lectura, editar `=3*4`, guardar, reabrir, cambiar un nodo de `1-25-220-120` en el admin, reabrir y ver el aviso, volver a la generada
- [x] 4.2 `copilot-rules.md` del admin: el admin define la estructura, el cliente consulta y ajusta, y los ajustes viven en `design_bom_adjustment`
- [ ] 4.3 Resolver o dejar registradas las preguntas abiertas de `design.md`
