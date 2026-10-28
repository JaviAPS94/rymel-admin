## Why

El menú contextual de la hoja del diseñador en `project-front` mezcla dos oficios. Unas acciones **usan** la hoja (ocultar una celda para trabajar más cómodo, seguir un enlace «Ir a tabla»). La mayoría **definen cómo se calcula y qué materiales lleva** un transformador: etiquetar la celda de Material del Núcleo (MO) y la de Material de Devanado (MD) que forman el código de diseño, declarar rangos, zonas de semielaborado y tablas de catálogo, configurar `goTo`, enrutar una celda al catálogo y fijar el ítem que acaba en el BOM. Esas definiciones son de la plantilla, y desde el change `add-design-template-management` la plantilla se administra en `project-admin`. Hoy el cliente (`project-front`) las sigue pudiendo cambiar en cada diseño, y el editor de plantillas no puede declarar ni la mitad.

Los datos reales (base `project`, consultada el 2026-09-29 con `project-back/src/db/scripts/audit-authoring-usage.ts`) muestran que la configuración de BOM **nunca ha llegado a una plantilla**:

- Las tres plantillas publicadas (3, 25 y 48) tienen **cero** etiquetas MO/MD, **cero** enlaces a ítem, **cero** celdas de condición de catálogo, **cero** zonas de semielaborado y **cero** tablas de catálogo. Solo la 3 usa lo que el editor ya sabe hacer: 151 combinaciones, 1 rango con nombre, 1 `goTo`, 2 desplegables y paneles inmovilizados.
- De los **33** diseños guardados, solo **2** (`sub_design` 90 y 91, con datos de prueba: `"sdasd"`, `"asdasd"`) llevan configuración de BOM: 4 celdas MO/MD, 2 enlaces a ítem, 2 celdas con condiciones, 3 zonas y 2 tablas de catálogo. Se configuraron a mano, diseño por diseño.

Es decir: el flujo de BOM existe, pero se ha usado solo para probarlo, y siempre desde el lado equivocado. Moverlo ahora cuesta poco, porque casi no hay datos que migrar. Cuando haya diseños reales configurados a mano, costará mucho más.

El responsable del producto pidió además, el 2026-09-29, tres cambios relacionados. Los tres completan la misma idea: la plantilla y sus fórmulas se definen en el admin, y el diseñador las usa sin poder alterarlas.

- **Funciones dentro de otra función.** Una fórmula de diseño no puede invocar a otra. `y = QUADRATIC(x) * 2` se cifra sin protestar —cifrar solo comprueba la sintaxis—, pero al evaluar da «Undefined function». El motor cifrado evalúa cada expresión con `mathjs` sin conocer las demás fórmulas. Hoy hay 5 fórmulas activas (`CUBIC`, `DESIGN_VARIABLE`, `DISENO_ALEX`, `QUADRATIC` de tipo `DESIGN`; `ASSOCIATE_COST` de tipo `COST`). Reutilizar una obliga a copiar su expresión, y la copia no se entera cuando el original cambia de versión.
- **Ver qué celdas intervienen en un cálculo, solo en el admin.** Al revisar una plantilla de 3000 celdas, el autor no tiene forma de ver de qué celdas se alimenta una fórmula ni a quién alimenta. Ni el admin ni `project-front` resaltan precedentes o dependientes. El grafo existe (`useTemplateDocument` ya mantiene un `DepGraph` de todo el libro), pero no se muestra. Es una herramienta de autoría, y el diseñador no la recibe.
- **Zonas de solo lectura.** La plantilla no tiene forma de impedir que el diseñador sobrescriba una celda de cálculo o una tabla de referencia. El contrato no tiene ningún concepto de celda protegida. Hoy, lo único que evita que un diseñador borre por accidente el `BUSCARV` de `Resumen!G17` o una fila de la tabla de aluminio es que no lo haga.

## What Changes

**Editor de plantillas (`project-admin`): el mismo menú contextual que el diseñador, completo**

- **Menú contextual en la rejilla** (clic derecho sobre celda, cabecera de fila y cabecera de columna). Reúne en un solo lugar lo que hoy está repartido entre la barra de formato y los paneles laterales, y añade lo que falta. Celda: combinar/separar, inmovilizar/movilizar paneles, nota (añadir/editar/quitar), etiqueta MO/MD, configurar/quitar `goTo`, etiquetar rango como tabla, asignar zona de semielaborado, marcar tabla de catálogo, vincular a ítem del catálogo, configurar vínculo al catálogo. Fila/columna: ocultar/mostrar e inmovilizar hasta ahí.
- **Etiqueta de material MO/MD** (nuevo en el editor). Es exclusiva en toda la plantilla: etiquetar una celda quita la etiqueta de la que la tuviera, en cualquier hoja, y todo en un solo paso de deshacer.
- **Configurar vínculo al catálogo** (`catalogConditionCells`, nuevo en el editor): qué celdas deciden a qué tabla de catálogo se enruta la celda.
- **Selector de ítem de catálogo** en lugar del campo de texto libre actual: muestra las filas de las tablas cuyas etiquetas coinciden con los valores de las celdas de condición, calculados en la vista previa, y permite verlas todas.
- **Señalización en la rejilla** de las etiquetas MO/MD y de las celdas con condiciones de catálogo, junto a las marcas que ya existen (`elementKey`, `itemLink`, `goTo`, nota).

**Contrato (`@rymel/design-template` v2.1.0, menor)**

- Nueva invariante: **una sola celda MO y una sola MD por plantilla**. Hoy la exclusividad solo la impone la interfaz del diseñador; el código de diseño toma la primera que encuentra (`extractMaterialTagValues`), así que dos etiquetas dan un código que depende del orden de recorrido.
- Nueva invariante: **el ítem enlazado existe** en la tabla de catálogo a la que apunta la celda. Hoy solo se comprueba que la tabla existe.
- Ninguna plantilla guardada deja de ser válida: las publicadas no tienen ni etiquetas ni enlaces.

**Diseñador (`project-front`): el menú contextual solo conserva lo que usa la hoja**

- **Se quitan** del menú de celda: combinar/separar, inmovilizar/movilizar, añadir/editar/quitar nota, etiquetas MO/MD, configurar/editar/quitar `goTo`, etiquetar rango y ver tablas etiquetadas, zona de semielaborado, tabla de catálogo, vincular/cambiar/quitar ítem y configurar vínculo al catálogo. Del menú de fila y de columna: inmovilizar/movilizar.
- **Se conservan**: ocultar/mostrar celda, ocultar fila/columna y mostrar todas (es estado de la sesión del diseñador, y el contrato lo excluye a propósito), e **«Ir a tabla»** (seguir un `goTo` ya configurado es navegación, no configuración).
- **Todo lo que declara la plantilla se sigue mostrando y usando**: marcas de celda, notas como información sobre la celda, zonas, el resumen BOM, y el código de diseño formado a partir de MO/MD. Lo único que se retira es la posibilidad de cambiarlo.
- Se retiran los modales, manejadores y pasos de tutorial (`BomTutorial`, sección de `InstructionsModal`) que enseñan a configurar lo que el diseñador ya no puede tocar. Un tutorial que explica un clic derecho que no existe es peor que no tener tutorial.
- **BREAKING (producto)**: un diseñador ya no puede configurar el BOM ni elegir el ítem de material de su diseño. Lo decide la plantilla. Es el objetivo del cambio, confirmado por el responsable del producto el 2026-09-29.

**Fórmulas de diseño que invocan a otras fórmulas**

- Una expresión puede invocar otra fórmula activa **del mismo tipo** por su código: `y = QUADRATIC(x + 1) * k`. Se valida al guardar que existe, que recibe tantos argumentos como variables declara, y que no hay ciclos (`A → B → A`), con una profundidad máxima de anidamiento.
- **El texto plano sigue sin salir del motor cifrado.** `project-back` envía la expresión cifrada de la fórmula y las de su cierre de dependencias. El motor las descifra y las expone a `mathjs` como funciones. El contrato de `evaluate-function` solo gana un campo opcional, así que un `project-back` sin actualizar sigue funcionando.
- **Las dependencias se registran por versión.** El motor devuelve, al validar, qué códigos invoca la expresión, y `project-back` los guarda con la versión. Es lo que permite validar ciclos, impedir dar de baja una fórmula que otra usa, y propagar la obsolescencia.
- **La obsolescencia se propaga.** Publicar una versión de `QUADRATIC` marca como desactualizados los diseños que usan `QUADRATIC` y también los que usan cualquier fórmula que la invoque, directa o indirectamente. El estampado de un diseño incluye las versiones de todo el cierre.
- En el admin, «Funciones disponibles» ofrece también las fórmulas de diseño del mismo tipo, con sus variables. El probador resuelve las anidadas, y la consulta de impacto cuenta quién la invoca.

**Rastreo de celdas en el editor de plantillas (solo admin)**

- Al seleccionar una celda con fórmula, la rejilla resalta sus **precedentes** (las celdas y rangos de los que se alimenta) y sus **dependientes** (las celdas que la usan), con colores distintos. Un panel lista los de otras hojas, con navegación.
- Se puede pedir la **cadena completa**: todos los precedentes transitivos, hasta los literales y las celdas del elemento. Así se ve qué entradas acaban determinando un resultado.
- Una invocación a una fórmula de diseño se muestra con sus argumentos resueltos a celdas. No se muestra su expresión: el editor de plantillas no la necesita, y la expresión solo se ve en el editor de fórmulas.
- `project-front` no recibe esta herramienta.

**Zonas de solo lectura**

- Nueva región de hoja en el contrato, `readOnlyZones`: rangos que el diseñador no puede modificar. Se declaran desde el menú contextual y el panel de regiones del admin, y se señalan en la rejilla.
- En `project-front`, una celda dentro de una zona de solo lectura **no se puede editar, borrar, pegar encima ni rellenar**. Sí se puede seleccionar, copiar y referenciar desde el modo fórmula. Sus fórmulas se siguen recalculando, y las celdas enlazadas al elemento se siguen rellenando al cargar.
- La zona viaja con la copia de las hojas al guardar un diseño, así que un diseño reabierto sigue protegido. `project-back` rechaza la actualización de un diseño que cambie el contenido de una celda protegida en su copia guardada, o que quite una zona.
- Validación: zonas dentro de la hoja, y ninguna celda con lista desplegable dentro de una zona (el diseñador no podría elegir).

**Fuera de alcance (no-goals)**

- Resolver el ítem automáticamente a partir de los valores del diseño, por ejemplo con una fórmula de búsqueda que elija el ítem según el espesor del elemento. Con este cambio, el ítem enlazado es fijo por plantilla. Ver `design.md`, decisión 3 y pregunta abierta 1.
- El resumen BOM (`BomSummaryTab`, `buildBomSummary`) sigue en `project-front`: es un resultado que se calcula con el elemento real, no una configuración.
- Llevar la ocultación de celdas a la plantilla. Se descartó explícitamente: sigue siendo estado del diseñador.
- Migrar la configuración de BOM de los `sub_design` 90 y 91 a una plantilla. Son datos de prueba y un diseño no modifica su plantilla (restricción 1 del change anterior). Siguen abriéndose y calculando igual.
- Recursión entre fórmulas. Un ciclo se rechaza al guardar: no hay caso de negocio para una fórmula que se invoque a sí misma, y aceptarla obligaría a un criterio de parada.
- Invocar una fórmula de otro tipo (`DESIGN` desde `COST` o al revés). Se resuelven en hojas distintas, y el código solo es único dentro de su tipo.
- Proteger con solo lectura la **creación** de un diseño en el servidor. Un diseño no guarda de qué plantilla viene (`sub_design` no tiene `template_id`), así que en el primer guardado no hay contra qué comparar. La protección en esa primera vez es de la interfaz. Ver `design.md`, decisión 9.
- Mostrar el rastreo de celdas al diseñador.

## Capabilities

### New Capabilities

_Ninguna._ El cambio amplía capacidades que definió `add-design-template-management`.

### Modified Capabilities

Las tres capacidades se definieron en `add-design-template-management`, que tiene todas sus tareas cerradas pero **aún no está archivado**. Sus requisitos no están todavía en `openspec/specs/`, así que aquí se añaden requisitos (`ADDED`) en lugar de modificar los existentes. Conviene archivar aquel change antes que este.

- `design-template-admin`: menú contextual en la rejilla, etiqueta MO/MD exclusiva, configuración de condiciones de catálogo, selector de ítem por coincidencia de etiquetas, rastreo de precedentes y dependientes, y declaración de zonas de solo lectura.
- `design-template-contract`: invariantes de unicidad de MO/MD y de existencia del ítem enlazado. Nueva región `readOnlyZones`, con sus invariantes.
- `design-template-consumption`: el diseñador deja de poder configurar la plantilla desde el menú contextual. Conserva lo que es estado de su sesión y la navegación, y sigue mostrando todo lo que la plantilla declara. No puede modificar las celdas protegidas, y el servidor lo comprueba al actualizar un diseño. Esto limita, sin contradecirlo, el requisito «El diseñador sigue siendo el dueño de su propia interfaz»: la rejilla sigue siendo suya; lo que deja de ser suyo es la configuración de la plantilla.

Estas cuatro ya están en `openspec/specs/`:

- `design-function-catalog`: dependencias entre fórmulas registradas por versión, validación de existencia, aridad, tipo y ciclos, y baja bloqueada mientras otra fórmula la invoque. La consulta de impacto cuenta a quienes la invocan.
- `design-function-admin`: el editor de expresión ofrece e inserta fórmulas de diseño del mismo tipo, y el probador resuelve las anidadas.
- `secure-function-engine`: evaluación con un cierre de dependencias cifradas, y validación que devuelve los códigos invocados, sin cambiar el contrato existente.
- `design-recalculation`: el estampado incluye el cierre de dependencias, y la obsolescencia se propaga a quienes invocan la fórmula publicada.

## Impact

**Repos afectados: 5** (`rymel-design-template`, `secure-function-engine-api`, `project-back`, `project-admin`, `project-front`). `rymel-formula-engine` no cambia: ya resuelve funciones personalizadas anidadas en una celda y ya expone el grafo de dependencias.

**`@rymel/design-template`**
- `types.ts`: región `ReadOnlyZone` y `SheetStyles.readOnlyZones`. `validate.ts`: las invariantes de MO/MD, del ítem enlazado y de las zonas de solo lectura, con sus códigos de diagnóstico. Un ayudante `isReadOnly(sheet, ref)` para que los tres consumidores decidan igual. `v2.1.0`, fijado en los tres consumidores. **`project-back` sube antes que nadie**: un servidor con v2.0.0 que normaliza al guardar descartaría `readOnlyZones` (decisión 8).

**`secure-function-engine-api`**
- `evaluate-function` acepta un campo opcional `dependencies` (código → expresión cifrada, variables y constantes), y las inyecta como funciones en el ámbito de `mathjs`, con límite de profundidad.
- `validate` devuelve además los símbolos de función que invoca la expresión.

**`project-back`**
- Tabla `design_function_dependency` (versión que invoca → fórmula invocada), rellenada al guardar una versión.
- `calculateSingleFunction` envía el cierre de dependencias con sus versiones vigentes.
- `markStaleForFunction` propaga la obsolescencia a quienes invocan la fórmula, y el estampado incluye el cierre.
- Baja de fórmula bloqueada si otra la invoca. La consulta de impacto cuenta a quienes la invocan.
- Al actualizar un `sub_design`, se rechaza el cambio de contenido en celdas protegidas por su copia guardada.

**`project-admin`**
- Nuevo `components/template/grid/GridContextMenu.tsx`, conectado al `onContextMenu` que `TemplateGrid` ya expone y que `TemplateEditorPage` no usa.
- `useTemplateDocument`: una mutación atómica para la etiqueta MO/MD, que toca varias hojas en un solo paso de historial.
- `CellBindingsPanel`: etiqueta MO/MD, condiciones de catálogo y el selector de ítem, que sustituye al campo de texto libre.
- Nuevo `components/template/ItemPickerModal.tsx`.
- `GridCell`: marcas de MO/MD, de condiciones y de solo lectura, y resaltado de precedentes y dependientes.
- Nuevo `hooks/useCellTrace.ts` sobre el `DepGraph` que ya mantiene `useTemplateDocument`, y un panel de rastreo.
- `RegionsPanel`: pestaña de zonas de solo lectura.
- Editor de fórmulas: «Funciones disponibles» incluye las fórmulas de diseño del mismo tipo, y el probador y el impacto muestran las dependencias.

**`project-front`**
- `SpreadSheet.tsx`: menú contextual de celda, de fila y de columna recortado; se retiran los modales y manejadores que quedan sin uso (`namedRangeModal`, `semiFinishedZoneModal`, `catalogTableModal`, `goToConfigModal`, `catalogConditionModal`, `noteModal`, `itemPickerModal`, `tagCellAsMaterial` y el resto).
- `ItemPickerModal.tsx`, `BomTutorial.tsx` y la sección de BOM de `InstructionsModal.tsx`: se retiran o se reescriben.
- Las celdas dentro de `readOnlyZones` no aceptan edición, borrado, pegado ni relleno, y se señalan. La zona se conserva en la copia que se guarda con el diseño.
- No cambian ni `buildBomSummary` ni `materialTagUtils`. La evaluación de fórmulas de diseño tampoco: sigue enviando `designFunctionId` y parámetros, y el anidamiento se resuelve en el servidor.

**Datos**: una tabla nueva (`design_function_dependency`), que empieza vacía, porque hoy ninguna expresión puede invocar a otra sin fallar. Se confirma validando las 5 expresiones activas antes de desplegar. Nada guardado cambia de significado.
