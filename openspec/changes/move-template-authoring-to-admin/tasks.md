## 1. Evidencia (solo lectura)

- [x] 1.1 `project-back/src/db/scripts/audit-authoring-usage.ts`: cuántas celdas y regiones llevan cada configuración, por plantilla publicada, borrador y diseño guardado. Resultado: ninguna plantilla lleva configuración de BOM, y solo `sub_design` 90 y 91 (datos de prueba) la llevan
- [x] 1.2 Clasificar cada acción del menú contextual de `SpreadSheet.tsx` en uso o configuración, y contrastarla con lo que el editor del admin ya ofrece (`design.md`, Context)
- [x] 1.3 Capturar la línea base de la plantilla 3 y de los `sub_design` 90 y 91 en `project-front`: `scripts/check-design-bom.ts --write` guarda marcas, regiones, MO/MD y resumen BOM (el ítem vinculado resuelve a `240 · Fibra de 2 mm`) en `scripts/fixtures/bom-baseline.json`, a partir de los volcados de `dump-bom-designs.ts` y `dump-library-template.ts`

## 2. Contrato `@rymel/design-template` v2.1.0

- [x] 2.1 Añadir `duplicate-material-tag` y `missing-catalog-item` a `DiagnosticCode`
- [x] 2.2 Invariante de unicidad de MO y MD en toda la plantilla, con diagnóstico en cada celda implicada que nombra a la otra
- [x] 2.3 Invariante de existencia del ítem: filas de datos sin encabezado, columna por `idColumnOffset`, `itemId` vacío como error, y omisión si la columna de identificador tiene fórmulas
- [x] 2.4 Región `ReadOnlyZone` en `SheetStyles.readOnlyZones`: lectura tolerante a su ausencia y serialización que la conserva
- [x] 2.4b `isReadOnly(sheet, ref)`, con las celdas combinadas protegidas por su origen, e invariantes `region-out-of-sheet` y `read-only-input`
- [x] 2.4c Pruebas de los escenarios del spec: 20 pruebas nuevas, 116 en total, `npm run verify` en verde. La plantilla que sirve la biblioteca da 0 diagnósticos con v2.1.0
- [x] 2.5 Publicado `v2.1.0` con tag anotado sobre la rama `mover-autoria-plantillas` del contrato; los tres consumidores lo instalan desde el tag y sus pruebas pasan igual que con el build local

## 3. `project-back`

- [x] 3.1 Subir `@rymel/design-template` a `v2.1.0` en `package.json` (probado con el build local instalado en `node_modules`; el `npm install` necesita el tag de 2.5). `src` compila limpio; los 41 errores de tipos de `test/unit/norm` y `test/unit/type` son previos
- [x] 3.2 `check-template-admin.ts` en verde, una publicación con dos MO rechazada por el servidor con `duplicate-material-tag`, e ida y vuelta de un borrador con `readOnlyZones` por la API sin perderlas
- [x] 3.3 Control de solo lectura al actualizar un `sub_design`: rechazar cambios de `formula` en celdas protegidas por la copia guardada, y zonas quitadas o reducidas; aceptar cambios solo de `computed`
- [x] 3.4 `check-read-only-guard.ts` contra la base, por `DesignService.updateDesign`: 6/6. Pasa una actualización que recalcula una celda protegida; se rechazan tocar una celda protegida (nombrando `Resumen!B3`) y quitar la zona, sin dejar cambios a medias. Además, 10 pruebas unitarias de `findReadOnlyViolations` en `test/unit/design`

## 4. Datos y mutaciones del editor (project-admin)

- [x] 4.1 Subir `@rymel/design-template` a `v2.1.0` y cubrir los códigos nuevos en `DiagnosticsPanel`
- [x] 4.2 `setMaterialTag(sheet, ref, tag | null)` en `useTemplateDocument`: exclusiva en todas las hojas, un solo paso de historial, y todas las hojas tocadas marcadas como sucias
- [x] 4.3 Pruebas del hook (4) sobre el hook montado, comprobando lo que sale por el serializador: reasignación entre hojas deshecha en un paso, las dos hojas sucias, MO y MD conviviendo, y quitar la etiqueta sin tocar el contenido
- [x] 4.4 `catalogRows(sheet, table)`: filas de datos de una tabla de catálogo (identificador, descripción, U.M.) leídas con sus desplazamientos. Una sola implementación para el selector y la señalización
- [x] 4.5 `matchCatalogTables(document, values, conditionCells)`: tablas cuyas etiquetas contienen todos los valores de las condiciones, sin distinguir mayúsculas, con los valores de la vista previa

## 5. Menú contextual (project-admin)

- [x] 5.1 `GridContextMenu.tsx`: posición fija recolocada dentro de la ventana, cierre con clic fuera y `Escape`, y entradas según el estado de la celda y de la selección
- [x] 5.2 Conectar `onContextMenu` de `TemplateGrid` en `TemplateEditorPage`: el clic derecho fuera de la selección la mueve a la celda, y dentro la conserva
- [x] 5.3 Menú de cabecera de fila y de columna: ocultar, mostrar las ocultas, inmovilizar hasta ahí y movilizar
- [x] 5.4 Entradas directas: combinar/separar, inmovilizar/movilizar, quitar nota, MO/MD y quitar etiqueta, quitar `goTo`, quitar zona, quitar tabla y quitar vínculo, todas por las mismas mutaciones que la barra y los paneles
- [x] 5.5 `RegionForms.tsx` con los formularios de rango, zona y tabla, compartidos por el panel y el menú, y `CellDialogs.tsx` con nota y listas de condición; abiertos en un modal prellenado con la selección o con la región que contiene la celda. **Hallazgo:** el formulario de tabla de catálogo del admin no permitía poner etiquetas, así que ninguna condición podía enrutar a una tabla creada en el admin; ahora las pide
- [x] 5.6 Modal «Configurar vínculo al catálogo»: referencias separadas por coma, normalizadas, con las inválidas señaladas y sin guardar a medias; también en `CellBindingsPanel`
- [x] 5.7 `ItemPickerModal.tsx`: filas de las tablas que coinciden con las condiciones, «ver todas», búsqueda por identificador y descripción, estado sin tablas que explica cómo crear una, y aviso cuando una condición depende de un dato del elemento. Sustituye al campo de texto libre de `CellBindingsPanel`
- [x] 5.8 `GridCell`: marcas de MO/MD (distinguibles) y de celdas con condiciones de catálogo
- [x] 5.9 `TemplateEditorPage.contextMenu.spec.tsx` (23) sobre la página montada, leyendo el documento que recibiría el guardado: selección con clic derecho dentro y fuera, `Escape`, combinar igual que la barra y deshacer, separar, inmovilizar, nota, MO exclusivo con deshacer en un paso, rango sobre la selección, `goTo`, condiciones, cabeceras y solo lectura. Más `contextMenu.spec.ts` (4). De 104 a 133 pruebas
- [x] 5.10 Pruebas del selector de ítem (5, en el mismo archivo): enrutado por condición, ver todas, búsqueda, sin coincidencias, y el `itemLink` guardado y quitado
- [x] 5.11 Zonas de solo lectura: «Proteger como solo lectura» y «Quitar solo lectura» en el menú, pestaña en `RegionsPanel` y marca en `GridCell`. Detrás de `VITE_READ_ONLY_ZONES` (`src/config/features.ts`) hasta que `project-front` las cumpla (grupo 6)

## 5b. Rastreo de celdas (project-admin)

- [x] 5b.1 `useCellTrace(ref, mode)` sobre el `DepGraph` de `useTemplateDocument`: precedentes y dependientes directos, y cadena completa con recorrido en anchura, conjunto de visitados y tipo de origen (literal, dato del elemento, vacía)
- [x] 5b.2 Agrupar como rango lo que el grafo tiene expandido, con los `refs` de `analyzeExpression`
- [x] 5b.3 Resaltado en `GridCell` con colores de precedente y dependiente distintos de la selección, y panel de rastreo con navegación entre hojas
- [x] 5b.4 Invocaciones a fórmulas de diseño mostradas como código y celdas de argumentos, sin su expresión
- [x] 5b.5 Pruebas: `useCellTrace.spec.ts` (6) con la fórmula real de `G17`, dependientes entre hojas, cadena completa hasta literales y datos del elemento, ciclo sin bucle, literal sin precedentes y fórmula de diseño con sus argumentos; y 2 sobre la página montada (resaltado y navegación a otra hoja)
- [x] 5b.6 Medido junto al presupuesto de `useTemplateDocument.perf.spec.ts`: cadena completa de `C6` (224 precedentes en el primer nivel) 1 ms, cadena de 500 niveles 3 ms. Umbrales fijados en 50 y 100 ms

## 6. Recorte del diseñador (project-front)

> Va después del grupo 5 desplegado, y de la puerta de corte de `design.md`
> (Migration Plan, paso 4).

- [x] 6.1 Menú de celda: dejar solo ocultar/mostrar celda e «Ir a tabla»
- [x] 6.2 Menús de fila y de columna: quitar inmovilizar y movilizar
- [x] 6.3 Retirados 7 modales, 7 estados, la consulta de semielaborados que solo usaba el modal de zonas, 21 manejadores y `ItemPickerModal.tsx`: `SpreadSheet.tsx` pasa de 6297 a 3820 líneas. Se conservan `catalogResolver`, `readCellDisplayValue`, `navigateGoTo`, ocultar de la sesión y el pintado de marcas. Guiado por `noUnusedLocals`: ningún error de compilación nuevo frente a los 51 que ya había. `check-template-load.ts` en verde
- [x] 6.4 Comprobado con `grep`: las únicas escrituras de esos campos que quedan son de fontanería —traducir la plantilla al cargarla, copiar la hoja al guardar, valores por omisión de una hoja nueva y la hoja de resumen BOM—. Copiar y pegar solo lleva contenido y formato, no configuración
- [x] 6.5 `BomTutorial` pasa de 7 pasos a 4 —introducción, de dónde sale la configuración, generar el resumen, cierre— y de 785 a 380 líneas. En `InstructionsModal`, la sección GoTo se queda con navegar y explica que la configuración viene de la plantilla, y la sección «GoTo en Plantillas», que enseñaba a escribir el JSON a mano, se retira: eso lo hace ahora el editor del admin
- [x] 6.6 Subir `@rymel/design-template` a `v2.1.0`
- [x] 6.6b Guarda `isReadOnly` en todas las vías de escritura del diseñador: `updateCell` (celda, barra de fórmulas, modo fórmula, `Supr`), inicio de edición por doble clic, F2 y tecleo —que no pasaba por `handleStartInlineEditing`—, desplegable, y las dos vías de pegado, que escriben las no protegidas y avisan de cuántas se omitieron. El diseñador no tiene cortar ni rellenar. El recálculo y el relleno por `elementKey` no pasan por estas vías. El **formato** (negrita, color, bordes) sigue permitido: no cambia lo escrito, y el servidor compara solo `formula`
- [x] 6.6c Candado en las celdas protegidas (`SpreadSheetCell`, con la propiedad añadida al comparador de `memo`) y aviso en la hoja que se retira solo a los 4 s. El diseñador no tenía sistema de avisos: solo `alert`
- [x] 6.6d `readOnlyZones` en el tipo `Sheet` y en `template-loading.ts`. Guardar y reabrir ya esparcen la hoja entera, así que viaja sin más cambios. `scripts/check-read-only.ts` (10) lo comprueba sobre la plantilla real, combinaciones incluidas. **Sin comprobar en un navegador:** `project-front` no tiene entorno de pruebas de componentes, así que las guardas de la interfaz están verificadas por compilación y revisión, no ejercitadas
- [x] 6.7 `check-design-bom.ts` igual que la línea base para la plantilla 3 y los `sub_design` 90 y 91 (marcas, regiones, MO/MD y resumen BOM); `check-template-load.ts` y `parity-template-loading.ts` en verde. Ningún error de compilación nuevo frente a los 51 previos

## 7. Verificación de extremo a extremo

- [x] 7.1 Extendido el ida y vuelta existente (`roundtrip-template.ts` + `check-roundtrip.ts`) en vez de escribir otro: la plantilla de prueba lleva etiquetas de catálogo, condiciones, ítem vinculado con cantidad, MO y MD, zona que contiene el vínculo y zona de solo lectura. Se publica contra la base real, se lee por la ruta de la biblioteca y el diseñador obtiene código MO=3000/MD=18 y resumen BOM `AC-1 · Acero al silicio · 18 · kg`. De 17 a 22 comprobaciones en el lado del diseñador, todas en verde; la plantilla se borra al terminar
- [x] 7.1b La zona de solo lectura viaja del admin a la biblioteca y al diseñador (`check-roundtrip.ts`), y del diseño guardado al reabierto (`check-read-only.ts`); el servidor rechaza alterarla (`check-read-only-guard.ts`). **Pendiente de probar a mano en el navegador** que la celda no se deja editar: `project-front` no tiene entorno de pruebas de componentes
- [x] 7.1c Protección encendida por omisión en el admin (`VITE_READ_ONLY_ZONES !== "false"`): todo el proyecto corre en local con el diseñador que las cumple. La variable queda como interruptor para apagarla en un despliegue donde el diseñador vaya por detrás
- [x] 7.2 `copilot-rules.md`: sección «Qué configura la plantilla y qué es del diseñador», con el porqué medido, la regla única de solo lectura y la de que menú y paneles escriben por las mismas mutaciones; `VITE_READ_ONLY_ZONES` en la tabla de variables y en `.env.example`. Tag del contrato actualizado a v2.1.0, que seguía diciendo v1.1.0

## 8. Composición de fórmulas: comprobación previa (solo lectura)

- [x] 8.1 Sin leer ninguna en claro: el motor ganó `POST /invoked-formulas`, protegido por el secreto de servicio, que analiza la expresión cifrada y devuelve solo los códigos invocados. Resultado: **ninguna de las 17 versiones guardadas (5 vigentes y activas) invoca otra fórmula**. La tabla nace vacía

## 9. Motor cifrado (`secure-function-engine-api`)

- [x] 9.1 `validate` devuelve `formulas` —funciones invocadas que mathjs no conoce— y `formulaCalls` con cuántos argumentos recibe cada invocación, que es lo que permite comprobar la aridad en `project-back`
- [x] 9.2 `evaluate-function` acepta `dependencies` opcional: descifra cada una, la compila y la expone como función con sus variables en orden y sus constantes. Sin registrar texto plano en el log
- [x] 9.3 Rechazo previo de ciclos y de profundidad mayor que 5; error de aridad que nombra la dependencia
- [x] 9.4 13 pruebas nuevas en `function-engine.service.spec.ts` (de 30 a 43): composición, anidamiento de tres, orden de argumentos, constantes aisladas, ausencia, ciclo, 5 niveles sí y 6 no, aridad, petición sin dependencias idéntica, y el análisis de una expresión cifrada sin devolver su texto. **El motor real es el de `Documents/ProyectoElectrico/…`; la copia de `Rymel/secure-function-engine-api` está obsoleta y no se tocó**

## 10. Composición de fórmulas (project-back)

- [x] 10.1 Migración `1788500000000`: tabla `design_function_dependency(version_id, depends_on_function_id)`, único por par e índice por fórmula invocada. Aplicada, revertida y reaplicada contra la base
- [x] 10.2 `DesignFunctionDependencyService.checkComposition` en `publish` y también en `restore` —que copiaba la expresión cifrada sin validar nada—, con el motor analizando la versión restaurada. Las reglas de grafo, puras, en `validation/function-composition.ts` con 6 pruebas
- [x] 10.3 `calculateSingleFunction` y el recálculo por lotes envían el cierre de dependencias con sus versiones vigentes
- [x] 10.4 Estampado de `sub_design` con el cierre de dependencias
- [x] 10.5 Baja de fórmula rechazada si la versión vigente de otra la invoca
- [x] 10.6 Consulta de impacto: fórmulas que la invocan, directa o indirectamente, y diseños afectados a través de ellas
- [x] 10.7 `check-function-composition.ts --compose`, desde `dist` y con el contexto de la aplicación: 13/13 contra la base y el motor corriendo. Calcula 32, el probador 33, rechaza ciclo, aridad, inexistente y baja, el impacto y el detalle nombran a quien invoca, publicar la invocada marca el diseño que la usa a través de otra, y el cálculo pasa a 18 con la versión nueva. `check-version-service.ts` (20) y `check-recalculation.ts` en verde. **Hallazgo sin tocar:** `DesignFunctionService.create`, un endpoint heredado, crea versiones sin pasar por `publish`, así que no registraría dependencias

## 11. Composición de fórmulas (project-admin)

- [x] 11.1 «Funciones disponibles» con un grupo de fórmulas del mismo tipo, sin la propia, insertadas con sus variables como marcadores
- [x] 11.2 El aviso de símbolos sin declarar reconoce los códigos de fórmula
- [x] 11.3 Errores de composición del servidor junto a la expresión, sin perder lo escrito
- [x] 11.4 Detalle de la fórmula con las que invoca y las que la invocan, y el impacto con los diseños afectados indirectamente
- [x] 11.5 `FormulaEditorModal.spec.tsx` (5) sobre el modal montado —símbolos, la propia fórmula no invocable, error de composición junto a la expresión sin perder lo escrito, probador con tipo, dependencias visibles— más 8 en `mathFunctions.spec.ts` y 2 en `MathFunctionPicker.spec.tsx`. El admin pasa de 104 a 155 pruebas, todas en verde
