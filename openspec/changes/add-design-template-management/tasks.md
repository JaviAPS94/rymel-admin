## 1. Evidencia y línea base (project-back, solo lectura)

- [x] 1.1 Extraer a fichero el JSON literal de las dos hojas de la plantilla 3 (`Resumen`, `Tablas`) desde la base `project`, y guardarlo como material de prueba del paquete de contrato
- [x] 1.2 Inventariar sobre ese JSON qué propiedades de celda y de estilo se usan realmente, y contrastarlo con los tipos de `project-front/src/components/design/spreadsheet-types.ts` y `commons/types.ts`; anotar cada divergencia
- [x] 1.3 Confirmar contra la base el estado de partida que asume el change: 4 plantillas, 3 sin hojas, 2 hojas con `order` 0, y el conteo real de celdas sin contenido — resultó 671 en `Resumen` y 304 en `Tablas`, no 45
- [x] 1.5 Ejecutar el motor contra las 8 fórmulas reales y registrar cuáles fallan y por qué (`evidence/inventario-de-plantillas.md`, sección 3)
- [x] 1.4 Verificar si existe un catálogo de claves de elemento consultable por norma o subtipo (pregunta abierta 2 de `design.md`) y dejar la respuesta escrita

> **Orden de ejecución.** El grupo 3 (motor) va **antes** que el grupo 2
> (contrato): el análisis estático del contrato se apoya en el motor, y sin las
> correcciones de compatibilidad marcaría como inválida la única plantilla
> válida. Ver `design.md`, decisión 9.

## 2. Paquete `@rymel/design-template` (repo nuevo)

- [x] 2.1 Inicializar el repo `rymel-design-template` con la misma disposición que `rymel-formula-engine`: build dual ESM/CJS, `vitest`, `typecheck`, y `check:deps` que falle si aparece React, un módulo de Node o una API de navegador
- [x] 2.2 Definir los tipos canónicos `TemplateDocument`, `TemplateSheet`, `TemplateCell`, `SheetStyles` y las regiones (`NamedRange`, `SemiFinishedZone`, `ItemCatalogTable`, `GoToConfig`, `CellItemLink`), unificando las divergencias de la tarea 1.2, y con la celda de gráfico como clase propia junto a literal y fórmula
- [x] 2.2b Implementar el análisis de la directiva de gráfico: vistas y componentes reconocidos, referencias de celda de sus argumentos, y diagnóstico cuando no encaje; retirar el `=` inicial al serializar
- [x] 2.2c Probar el análisis de la directiva contra la celda `K73` real y contra los ejemplos documentados en `InstructionsModal.tsx`
- [x] 2.3 Implementar la deserialización de la forma persistida a documento, aceptando `hiddenRows`/`templateHiddenRows` y prefiriendo el canónico cuando ambos existan y difieran
- [x] 2.4 Implementar la serialización a forma persistida: escribir ambos nombres de los campos de ocultamiento, descartar celdas sin contenido, no persistir el valor calculado y consolidar `value`/`formula` en un solo campo
- [x] 2.5 Probar ida y vuelta contra el JSON real de la tarea 1.1: filas y columnas ocultas preservadas, documento equivalente, y conteo de celdas descartadas igual al esperado
- [x] 2.6 Implementar las invariantes estructurales: nombres de hoja únicos, posiciones consecutivas, regiones dentro de la hoja, zonas de semielaborado sin solapes, desplazamientos de tabla de catálogo dentro del rango, `itemLink` y `goTo` que apunten a algo existente
- [x] 2.7 Implementar la validación de fórmulas: apoyarse en el análisis estático del motor (tarea 3.2) y reportar las invocaciones a funciones no asignadas al subtipo
- [x] 2.8 Definir el tipo de diagnóstico (hoja, celda o región, motivo legible) y unificar todos los reportes en él
- [x] 2.9 Exponer la versión del contrato en el paquete y en el documento serializado
- [x] 2.10 Publicar `v1.0.0` con tag inmutable

## 3. Motor de fórmulas `@rymel/formula-engine` (va primero)

- [x] 3.0a Aceptar `;` como separador de argumentos además de `,`, sin confundirlo con un `;` dentro de un literal de texto; probar con las fórmulas reales `C6` y `G17`
- [x] 3.0b Admitir rangos calificados en ambos extremos (`Tablas!B45:Tablas!C156`), expandiéndolos completos en `extractPrecedents`, y dar error cuando los extremos califiquen hojas distintas
- [x] 3.0c Probar que un cambio en una celda interior de un rango calificado marca como sucia a quien lo consulta — el defecto latente del grafo
- [x] 3.0d Reconocer las celdas de gráfico (`DRAW:` con o sin `=`): no evaluarlas, devolver su texto sin el `=` y no registrarles precedentes
- [x] 3.0e Prueba de regresión con el libro real completo, contra los valores que dejó guardados el evaluador anterior. `G17` vuelve a dar 20 y `K73` conserva su dibujo; `C6` sigue en `#ERROR` por la causa aparte de la sección 3.4 de la evidencia, y la prueba lo fija de forma explícita en vez de esconderlo
- [x] 3.1 Añadir al motor el catálogo de hojas conocidas y la comprobación de argumentos de función personalizada como operaciones sin evaluación, reutilizando el tokenizador y el grafo existentes
- [x] 3.2 Implementar `analyzeSheet` (síncrona): sintaxis inválida, hoja inexistente, referencias y rangos mal formados, función desconocida, cantidad de argumentos incorrecta y celdas circulares, con referencia canónica y motivo
- [x] 3.3 Probar que `analyzeSheet` no invoca el puerto de funciones personalizadas ni realiza operaciones asíncronas
- [x] 3.4 Probar la detección de ciclos que cruzan dos hojas
- [x] 3.5 Publicar tag nuevo del motor y fijarlo en `@rymel/design-template` y en `project-admin`
- [x] 3.6 Medir si la subida de tag puede cambiar algún valor guardado antes de proponerla en `project-front`: 31 sub-diseños, 64 celdas con fórmula, cero con `;`, cero con rango calificado doble, cero `DRAW`, cero `#ERROR`. Exposición nula (`evidence/inventario-de-plantillas.md`, sección 5)

## 4. Esquema y saneamiento (project-back)

- [x] 4.1 Migración de esquema: `status` y `version` en `template`, tabla `template_revision` (plantilla, versión, documento, autor, fecha), único de `code` entre plantillas activas, único de `(template_id, order)`
- [x] 4.2 Migración de tipos: `sheet.cells` y `sheet.cellsStyles` de `text` a `nvarchar(max)`
- [x] 4.3 Script de saneamiento en modo simulación: informar por hoja las celdas que descartaría y los cambios de `order`, sin escribir — siguiendo el patrón de `src/db/scripts/dry-run-recalculation.ts`
- [x] 4.4 Ejecutar la simulación y contrastar el resultado con la línea base de la tarea 1.3; detener si difiere
- [x] 4.5 Migración de datos: instantánea previa del contenido literal en `template_revision`, plantillas sin hojas a `DRAFT`, `order` consecutivo, normalización de estilos y celdas con el paquete de contrato
- [x] 4.6 Probar la reversión: restaurar desde las instantáneas y comprobar igualdad con el contenido literal previo

## 5. API de plantillas (project-back)

- [x] 5.1 Añadir el paquete de contrato como dependencia y un servicio de validación que lo use antes de toda escritura
- [x] 5.2 DTOs de escritura de plantilla y de hoja, con la validación del contrato integrada
- [x] 5.3 `GET /admin/templates` — listado paginado con búsqueda por nombre y código, filtros por subtipo, tipo y estado, y conteo de hojas y celdas por plantilla. Bajo `admin/`, no `design/templates/admin`, que colisionaría con la ruta de la biblioteca (`design.md`, decisión 12)
- [x] 5.4 `GET /admin/templates/:id` — detalle con todas las hojas en orden: el borrador si lo hay, si no lo publicado
- [x] 5.5 `POST /admin/templates` y `PUT /admin/templates/:id` — alta y metadatos, con unicidad de `code` entre activas
- [x] 5.6 `POST|PUT|DELETE /admin/templates/:id/sheets[/:name]` — alta, guardado y baja de hoja, siempre sobre el borrador; lo publicado no se toca hasta publicar (`design.md`, decisión 11)
- [x] 5.7 `PUT /admin/templates/:id/sheet-order` — reordenamiento en una sola operación con posiciones consecutivas. Fuera del espacio de `:id/sheets/:name`: compartirlo dejaba sin poder guardar una hoja llamada «order»
- [x] 5.8 Control de concurrencia por `updatedAt`: rechazar el guardado si la plantilla cambió desde que el cliente la cargó
- [x] 5.9 `POST /admin/templates/:id/publish` — validar el documento completo, guardar instantánea de la versión publicada anterior, incrementar versión y publicar en una transacción; registrar la versión del paquete de contrato usada
- [x] 5.10 `POST /admin/templates/:id/duplicate` — copia en `DRAFT` con código nuevo, hojas y orden, sin instantáneas heredadas
- [x] 5.11 `GET /admin/templates/:id/revisions` y restauración de una instantánea como borrador, sin tocar lo publicado
- [x] 5.12 `DELETE /admin/templates/:id` — baja lógica que libera el código
- [x] 5.13 Restringir todas las operaciones de administración al rol ADMIN, conservando ADMIN+DESIGN en la lectura por subtipo
- [x] 5.13b `GET /field` y `GET /field/by-design-subtype/:id` — claves de campo del elemento desde `field.base` (clave, etiqueta, tipo, descripción). Va por subtipo **de diseño** y no por subtipo de elemento, porque es lo que el editor conoce; el camino atraviesa el tipo de diseño y, si no lleva a ninguno, devuelve todos
- [x] 5.14 `check-template-admin.ts`: 26 comprobaciones contra la base real —código duplicado, hoja duplicada, aislamiento del borrador frente a lo publicado, conflicto de concurrencia, publicación rechazada por diagnósticos, historial y duplicación—, sobre una plantilla de prueba que crea y borra

## 6. Datos y servicios del editor (project-admin)

- [x] 6.1 Añadir `@rymel/design-template` y subir el tag de `@rymel/formula-engine`
- [x] 6.2 `types/template.types.ts` reexportando el contrato del paquete, sin redefinir tipos
- [x] 6.3 `services/templateService.ts` con todas las operaciones de la sección 5
- [x] 6.4 `hooks/useTemplates.ts` — listado, filtros y mutaciones, siguiendo el patrón de `useDesignFunctions`
- [x] 6.5 `hooks/useTemplateDocument.ts` — libro plano indexado por referencia calificada (`Hoja!A1`), un solo `DepGraph` para toda la plantilla, recálculo por celdas sucias y marcado de circulares, sobre el patrón de `usePhantomItemGrid`
- [x] 6.6 Pruebas del hook (14): recálculo entre hojas, cambio interior de un rango calificado, actualización incremental del grafo, ciclo entre hojas, fórmulas de diseño pendientes en vez de erróneas, celdas de gráfico sin dependencias, y el renombrado real —no una reimplementación— incluida la equivalencia de la forma canónica del rango
- [x] 6.7 `hooks/useTemplateValidation.ts` — validación continua con el paquete, agrupada por hoja, con las funciones del subtipo obtenidas de `designFunctionService`
- [x] 6.8 Seguimiento de hojas sucias y guardado selectivo, con estado de cambios sin guardar

## 7. Listado de plantillas (project-admin)

- [x] 7.1 `pages/TemplateListPage.tsx` con búsqueda, filtros por subtipo, tipo y estado, y paginación
- [x] 7.2 Columnas de estado, versión, hojas y celdas, con marca visible para las plantillas sin hojas
- [x] 7.3 Acciones de crear, duplicar, editar, publicar y dar de baja, con confirmación en las destructivas
- [x] 7.4 Ruta protegida por rol ADMIN y entrada en el menú de administración
- [x] 7.5 Estado vacío con limpieza de filtros

## 8. Editor de la plantilla (project-admin)

- [x] 8.1 `pages/TemplateEditorPage.tsx` con la disposición del editor, cabecera de metadatos y estado de guardado
- [x] 8.2 Rejilla virtualizada con las mismas dimensiones que `project-front` (250 filas × 50 columnas), encabezados de fila y columna, y selección de rango
- [x] 8.3 Edición en celda y barra de fórmulas, con navegación por teclado
- [x] 8.4 Deshacer y rehacer sobre las ediciones
- [x] 8.5 Pestañas de hoja: crear, renombrar, reordenar, duplicar y eliminar, con nombres únicos y aviso de fórmulas afectadas al renombrar
- [x] 8.6 Barra de formato: negrita, colores, bordes por lado, decimales, formato condicional, nota y opciones desplegables, aplicables a una selección
- [x] 8.7 Estructura de hoja: anchos y altos, ocultar y mostrar filas y columnas, inmovilizar paneles, combinar y separar celdas
- [x] 8.8 Modal de rangos con nombre, con etiquetas de condición
- [x] 8.9 Modal de zonas de semielaborado, alimentado por `semiFinishedService`, con el color por código y rechazo de solapes
- [x] 8.10 Modal de tablas de catálogo de ítems, con filas de encabezado y desplazamientos validados contra el rango
- [x] 8.11 Configuración `goTo` por celda y enlace de celda a ítem de catálogo, con señalización en la rejilla
- [x] 8.12 Marcado de celdas enlazadas al elemento por clave, con señalización y aviso de contenido provisional
- [x] 8.13 Panel de diagnósticos agrupado por hoja, con navegación a la celda o región afectada
- [x] 8.14 Vista previa calculada: `evaluateSheet` con el puerto apuntando a `POST /design-functions/calculate`, valores de prueba por clave de elemento, número de lotes y celdas en error acotadas
- [x] 8.15 Publicación bloqueada por diagnósticos, y presentación de los diagnósticos que devuelva el servidor
- [x] 8.16 Aviso de salida con cambios sin guardar y manejo del conflicto de edición concurrente
- [x] 8.17 Presupuesto de rendimiento medido a escala real (2039 celdas): grafo 2.8 ms, cálculo inicial 8.3 ms, edición suelta 0.81 ms, edición dentro de un rango consultado 1.09 ms. Fijado en `useTemplateDocument.perf.spec.ts`

## 9. Migración de `project-front` (repo `rymel-front`)

> Va después del grupo 4: la adopción del contrato se conmuta sobre datos ya
> saneados. La subida de tag (9.1) no espera a nada. Ver `design.md`, decisión 10.

- [x] 9.1 Subir `@rymel/formula-engine` a `v1.6.0` en `project-front`
- [x] 9.2 `scripts/check-template-load.ts`: `G17` en 20, `C6` en su estado conocido, dibujo de `K73` intacto tras recalcular, y `C6` como única celda en error de toda la plantilla
- [x] 9.3 Añadir `@rymel/design-template` y reemplazar en `commons/types.ts` y `spreadsheet-types.ts` los tipos que dupliquen el modelo, reexportando los del paquete
- [x] 9.4 `scripts/parity-template-loading.ts`, con las diferencias aceptables declaradas y una de ellas comprobada en vez de afirmada
- [x] 9.5 2891 diferencias, las cuatro categorías explicadas. La primera ejecución detuvo la conmutación con 101 sin explicar, que resultaron ser las celdas con solo formato
- [x] 9.6 Conmutar `loadTemplate` a `readTemplate`, retirando la lectura de `templateHiddenRows`, `templateHiddenColumns` y `value`
- [x] 9.7 Separar el ocultamiento del diseñador del de la plantilla: `userHiddenRows`, `userHiddenColumns` y `hiddenCells` dejan de viajar en `cellsStyles` y viven solo en la sesión
- [x] 9.8 Resolver la celda de gráfico desde el contenido de la celda y no desde su valor calculado, ahora que la directiva se guarda sin el `=`
- [x] 9.9 `check-saved-designs.ts`: las 88 fórmulas de los 37 diseños guardados son **todas** de diseño, así que la comprobación no puede concluir paridad por sí sola y lo dice. La exposición al cambio del motor está medida aparte y es nula
- [x] 9.10 Retirados en `@rymel/design-template` v2.0.0, tras comprobar sirviendo las plantillas sin ellos que nadie los leía (2042 campos quitados de la real, 23 de la de prueba; las dos comprobaciones críticas —fila oculta y enlace a ítem— pasan). Se siguen aceptando al leer. La migración `1788400000000` los quita del dato guardado: 2038 campos, 23 % menos de documento, reversión byte a byte verificada

## 10. Verificación de extremo a extremo y corte

- [x] 10.1 `roundtrip-template.ts` + `check-roundtrip.ts`: 31 comprobaciones entre los dos repos, todas pasan. La plantilla de prueba se crea, se publica, se lee por la ruta de la biblioteca y se borra
- [x] 10.2 Comprobado sobre todas las celdas: el diseñador resuelve el libro con `evaluateSheet` y el editor celda a celda con `evaluateCell`; dan lo mismo
- [x] 10.3 `dump-library-template.ts` vuelca la plantilla normalizada tal como la sirve la biblioteca, y `check-template-load.ts` la carga: mismos valores que antes de sanear
- [x] 10.4 Decidido con el responsable del producto: se quedan en `DRAFT`. Aplicado por la migración de saneamiento
- [x] 10.5 Filtro activo por omisión, reversible con `TEMPLATE_LIBRARY_PUBLISHED_ONLY=false`, que además avisa en el registro. Verificado en los dos sentidos
- [x] 10.6 El mensaje decía «¡Crea tu primera plantilla!» a quien no puede crearlas. Ahora dice que no hay publicadas para ese subtipo, que puede haber alguna en preparación, y de dónde salen

## 11. Documentación y deuda

- [x] 11.1 `copilot-rules.md`: sección «Plantillas de diseño» con la regla —no se declaran tipos ni se traduce a mano— y el porqué, más los estados y el corte reversible de la biblioteca
- [x] 11.2 `DEPRECATED_FIELDS` declara los cuatro campos con su canónico, quién los lee y dónde; `deprecated.spec.ts` impide que la declaración y el serializador diverjan. Verificado quitando una entrada: la prueba cae. Publicado en v1.1.0
- [x] 11.3 Anotada en `copilot-rules.md`, con la regla que la acota (ninguna lógica de cálculo en la interfaz) y la condición concreta que dispararía extraer `@rymel/spreadsheet-ui`
- [x] 11.4 Sección «Versionado» en el README del contrato: qué sube mayor, qué sube menor, y el criterio —si una plantilla guardada deja de significar lo mismo, es mayor, aunque compile en los tres repositorios

## 12. Decimales escritos con coma (pedido tras la verificación)

- [x] 12.1 Medir el alcance y decidir la lectura: 1200 celdas `N,N`, de las que 404 llevan tres decimales y son ambiguas con el separador de miles. Gana la lectura decimal — hay `0,012`, ninguna cifra lleva dos comas y el mismo documento escribe `115.2` con punto
- [x] 12.2 Comprobar qué hacen hoy las fórmulas con ellas. **Corrige lo que este change afirmaba**: el motor no se limita a dejarlas como texto, las trunca dentro de las fórmulas —`=A1+A2` da 4 donde debería dar 5— y `SUMA` las ignora y devuelve 0. La misma celda da un número distinto según qué la lea
- [x] 12.3 `isDecimalComma`, `normalizeDecimalComma`, `findDecimalCommaCells` y `normalizeDecimalCommas` en el contrato, con la conversión **siempre explícita**: nunca al leer ni al guardar
- [x] 12.4 Pruebas que protegen sobre todo lo que **no** se toca: fórmulas con `,` como separador, texto con coma, directivas de gráfico, notación de miles y decimales que ya usan punto. Contra la plantilla real: las 1200 exactas, 404 marcadas ambiguas, ninguna de las 21 celdas de texto alterada
- [x] 12.5 El editor convierte al escribir: teclear `3,36` deja `3.36`
- [x] 12.6 Aviso en el panel de problemas con el conteo, las ambiguas señaladas, una muestra de las conversiones y la acción para convertirlas todas. Entra en el historial, así que se deshace
- [x] 12.7 No bloquea la publicación: una plantilla con `3,36` es válida, y bloquear dejaría sin publicar la única plantilla real
- [x] 12.8 Publicado en `@rymel/design-template` v1.2.0 y fijado en los tres repositorios

## 13. Fallos encontrados al usar el editor

- [x] 13.1 Reproducir los dos: plantilla nueva que no publica «por no tener hojas», y plantilla existente que dice «no hay cambios» habiéndolos. Causa única: el editor edita en local y el servidor solo se enteraba del contenido, nunca de la estructura
- [x] 13.2 `saveSheet` crea la hoja si no existe. El editor las añade en memoria y las trae al guardar; exigir que existieran antes dejaba sin hojas a toda plantilla nueva
- [x] 13.3 `reorderSheets` pasa a `setSheets`, con `PUT` sobre la colección `/:id/sheets`: fija qué hojas hay y en qué orden, creando las que falten y quitando las que sobren
- [x] 13.4 El guardado del editor manda primero la estructura —si cambió— y después el contenido; eliminar o reordenar no ensucia ninguna hoja y sin esto no llegaba nunca
- [x] 13.5 Publicar guarda antes. Y el mensaje de «sin cambios» dice ahora «lo guardado ya es lo que está publicado», que no se lee como «tus cambios no cuentan»
- [x] 13.6 `check-editor-sequence.ts`: 12 comprobaciones sobre la secuencia que produce la interfaz, que es la que `check-template-admin.ts` no ejercitaba —llamaba a `createSheet`, cosa que el editor nunca hace—

## 14. Los estilos no se pintaban en la rejilla

- [x] 14.1 Descartar el dato: el borrador de `TEMPLATE_1F_0001` que lee el admin trae 324 celdas con formato en `Resumen` y 1591 en `Tablas`, y lo que el admin escribiría al publicar es idéntico a lo publicado. El fallo estaba en el dibujo
- [x] 14.2 **Los bordes**: `GridCell` ponía `border` junto a los cuatro lados en `undefined`, y React escribe una `undefined` como cadena vacía, lo que **destruye el atajo**. 1907 celdas con borde y ninguna se pintaba. Ahora el estilo se arma solo con lo que la celda declara
- [x] 14.3 **La inmovilización**: la hoja declara `freezeRow: 7` y la rejilla lo ignoraba. Implementada, con lo inmovilizado dibujándose siempre aunque la virtualización lo deje fuera de la ventana
- [x] 14.4 Cerrar la brecha de método: no había forma de probar un componente ni un hook, y ahí vivían los tres fallos que llegaron al usuario. Añadidos `@testing-library/react` y jsdom
- [x] 14.5 `useTemplateDocument.editor.spec.tsx` (10) sobre el hook montado, comprobando lo que sale por el serializador
- [x] 14.6 `TemplateGrid.spec.tsx` (11) sobre lo que se pinta, con un recorte real del borrador de la plantilla 3. De 27 pruebas a 48

## 15. Color de texto y modo fórmula

- [x] 15.1 El color de texto no se aplicaba: el `input[type=color]` medía 0×0 y se apoyaba en la etiqueta que lo envolvía, así que el selector no llegaba a abrirse. Ahora el input ocupa todo el botón, invisible pero pulsable
- [x] 15.2 `FormatToolbar.spec.tsx` (7): color de texto, color de fondo, negrita, bordes y decimales, sobre la barra montada
- [x] 15.3 El modo fórmula del diseñador —señalar celdas, formar rangos, catálogo de funciones— **no se copia**: lo compartible vive en `@rymel/formula-engine` v1.7.0 como máquina de estados pura. Dos implementaciones de cuándo calificar una referencia acabarían divergiendo, y la misma acción daría dos fórmulas distintas
- [x] 15.4 23 pruebas del reducer en el motor, incluida la fórmula real `=G14*(BUSCARV(G13;Tablas!B3:Tablas!C10;2;FALSO))` armada a base de pulsaciones
- [x] 15.5 `useFormulaBuilder` en el admin es solo la atadura con React: el estado y devolver el foco al input. La barra de fórmulas pasa a ser controlada para que se le pueda escribir desde fuera
- [x] 15.6 `FormulaModeBar` con cursor, «Funciones», «Agregar celda», «Rango» y «Salir», y la rejilla enrutando el clic a la fórmula cuando corresponde
- [x] 15.7 `useFormulaBuilder.spec.tsx` (11) sobre la atadura y la barra. De 48 pruebas a 66
- [x] 15.8 El catálogo del admin ofrece **solo las fórmulas de diseño del subtipo**, como el diseñador, y no las incorporadas: son las del negocio, las únicas que hace falta buscar. Se insertan con sus variables como marcadores —`QUADRATIC(x)`—, porque el orden de los argumentos es contrato
- [x] 15.9 `project-front` adopta el reducer y **se retira su copia**: `insertAtCursor`, la calificación de referencias, el armado del rango y las transiciones de modo pasan a `@rymel/formula-engine`. `formulaInput` deja de ser estado propio y es `builder.draft`; queda local la atadura con React, que el paquete no puede tener sin dejar de correr en el servidor
- [x] 15.10 El motor gana las referencias **entre instancias** (v1.8.0): sin ellas la adopción habría perdido `cost:Hoja1!A1`, que es como el diseñador cruza de una instancia del diseño a otra. `qualifyCellRef` acepta `{ sheet, instance }` además del nombre de hoja suelto, que el editor de plantillas sigue usando
- [x] 15.11 `parity-formula-builder.ts` enfrenta la copia vieja con la compartida sobre las secuencias reales. 4 de 6 escenarios dan la referencia idéntica; los 2 que cambian son arreglos declarados, no accidentes:
  - Un rango se califica en sus **dos extremos**. La copia vieja armaba siempre `B45:C156` sin hoja, así que un rango con otra hoja seleccionada como destino apuntaba a celdas de la hoja actual — no daba error, daba otro número
  - Un nombre de hoja con espacios va entre comillas simples: `'Template 1F'!A11`. Sin ellas el analizador no lo lee
  - Ninguno de los dos toca un diseño ya guardado: solo cambian las fórmulas que se escriban a partir de ahora

## 16. El catálogo del editor estaba vacío

- [x] 16.1 `TEMPLATE_1F_002` no ofrecía ninguna fórmula pese a tener 5 asignadas a su subtipo. La causa no estaba en el editor: `DesignFunction.designSubTypeFunctions` declaraba la inversa equivocada, así que TypeORM unía `stf.design_subtype_id` contra `f.id`. Filtrar por el subtipo 1 exigía además `f.id = 1` y devolvía cero filas — sin error, solo una lista vacía
- [x] 16.2 Es una copia del bloque idéntico de `DesignSubType`, donde la inversa sí es `designSubType`. El diseñador nunca lo notó porque carga las fórmulas desde el otro lado de la relación
- [x] 16.3 Radio: la única consulta que usaba la relación era el listado de administración de fórmulas — su filtro por subtipo y el catálogo del editor, que cuelga de él. Las demás van por `subTypeFunctionRepository` con un `where` directo
- [x] 16.4 `check-subtype-function-filter.ts` fija el invariante contra la base: el SQL une por `design_function_id` y cada subtipo devuelve exactamente sus asignaciones vigentes. 10/10
- [x] 16.5 El catálogo se pide además **del tipo de la plantilla**. Una hoja solo resuelve las fórmulas de su tipo —la de diseño las `DESIGN`, la de costos las `COST`—, y ofrecer las del otro tipo era ofrecer fórmulas que el cliente no iba a poder evaluar. Ninguna plantilla actual invoca fórmulas de diseño, así que el filtro no cambia nada ya guardado

## 17. La barra de fórmulas no aparecía al teclear el `=`

- [x] 17.1 Escribir `=` dentro de una celda no encendía el modo fórmula: había que salir de la celda y volver a entrar. La causa era la misma en los dos, **el borrador tenía dos dueños**: la celda guardaba lo que se escribía en un estado propio y el constructor de fórmulas no se enteraba hasta que el contenido se confirmaba y la celda se volvía a seleccionar
- [x] 17.2 En el admin desaparece `editingValue`: lo que se teclea en la celda **es** `formula.draft`. Con un solo dueño no hay nada que sincronizar y no puede volver a desincronizarse
- [x] 17.3 En el diseñador el input de la celda es no controlado a propósito —redibujar la rejilla en cada tecla es lo que esa decisión evita—, así que se mantiene y solo se avisa al reducer cuando **cambia** si el contenido es fórmula o no. Entre la transición y el `blur` nadie lee el borrador; al soltar el foco se sincroniza con el texto completo
- [x] 17.4 `TemplateEditorPage.spec.tsx` (3) sobre la página montada, no sobre el hook: el fallo no estaba en el hook y una prueba del hook habría pasado con él puesto. Comprobado que las tres fallan si se corta el aviso al reducer. De 68 pruebas a 71

## 18. Se perdía la fórmula al editarla y la selección se arrastraba sola

- [x] 18.1 Abrir una celda con fórmula y pinchar en otra la dejaba vacía. Al cambiar de celda la selección se mueve **antes** de que el input suelte el foco, así que el bloque que resincroniza el borrador ya lo había reemplazado por el contenido de la celda nueva, y eso era lo que se confirmaba en la celda editada
- [x] 18.2 El diseñador no lo sufre porque confirma `inputRef.current.value` —el propio input, no controlado—, que ningún cambio de selección puede pisar. En el admin el input es controlado, así que la guarda va en la resincronización: mientras se edita una celda, el borrador es suyo y no se reescribe
- [x] 18.3 Seleccionar una celda con fórmula marcaba dos o tres celdas hacia arriba. No era un arrastre: al aparecer la barra del modo fórmula la rejilla baja y las celdas desfilan por debajo de un puntero pulsado que no se ha movido, y `onMouseEnter` lo leía como arrastre. Ahora se exige movimiento real del puntero desde la pulsación
- [x] 18.4 Cuatro pruebas más sobre la página montada, comprobadas al revés —fallan si se quita cada arreglo—. `data-selected` en la celda para poder leer qué se pinta como seleccionado. De 71 pruebas a 74

## 19. `#ERROR` al abrir una plantilla que invoca una fórmula de diseño

- [x] 19.1 `=QUADRATIC(5)` se pintaba como `#ERROR` la primera vez que se abría la plantilla. El catálogo de fórmulas se pide por red y llega **después** del primer cálculo, que se hacía una sola vez al montar: en ese momento `QUADRATIC` no era una función conocida. El panel de problemas decía que la plantilla estaba bien porque él sí esperaba al catálogo, lo que hacía el fallo más difícil de creer que de ver
- [x] 19.2 El libro se recalcula entero cuando el catálogo cambia. Una vez por carga, no una por edición
- [x] 19.3 El catálogo se compara **por contenido y no por identidad**: el `= []` del parámetro construía un array nuevo en cada render, así que comparar identidades era un bucle infinito. El vacío pasa a ser una constante del módulo
- [x] 19.4 Además no se pinta la plantilla hasta tener el catálogo, como hace el diseñador —que no monta la hoja sin él—. Corregirse sola ya estaba garantizado; enseñar el `#ERROR` mientras tanto no aportaba nada
- [x] 19.5 Dos pruebas sobre el hook montado, comprobadas al revés. De 74 pruebas a 76

## 20. Ayuda con las funciones disponibles en la expresión

- [x] 20.1 «Funciones disponibles» junto a la expresión, plegable, agrupado y con inserción en el cursor. La inserción la hace `insertIntoFormula` del motor compartido: es la misma operación que en el editor de plantillas
- [x] 20.2 **No es el listado de la hoja de cálculo**, que era lo pedido. La expresión no la evalúa `@rymel/formula-engine` sino el motor cifrado, que por dentro es `mathjs`: comprobado contra el motor vivo, `SUMA`, `SI`, `REDONDEAR` y `RAIZ` dan «Undefined function». Ofrecerlas habría sido ofrecer fórmulas que fallan
- [x] 20.3 El motor **no valida los nombres al guardar** —cifrar solo comprueba que la sintaxis se pueda analizar—, así que `y = RAIZ(x)` se guardaba sin protestar y fallaba al calcular un diseño, lejos y sin relación aparente. De ahí que el listado valga la pena
- [x] 20.4 Corregido de paso el aviso de símbolos sin declarar, que llevaba una lista incrustada equivocada en los dos sentidos: daba por buena `ln` —que mathjs no tiene— y marcaba como error `log10`, `atan`, `asin`, `acos`, `mod`, `sign` y una docena más, que sí funcionan. Ahora usa el mismo catálogo
- [x] 20.5 `check-math-catalog.mjs` cifra y evalúa cada símbolo del catálogo contra el motor real, y comprueba además que las de la hoja de cálculo sigan sin existir. 40 símbolos verificados
- [x] 20.6 `mathFunctions.spec.ts` (7) sobre lo que no necesita el motor levantado: que las dos listas no se contradigan y que no vuelva a colarse un nombre inexistente. De 76 pruebas a 83
