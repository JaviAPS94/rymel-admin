## Why

Una **plantilla de diseño** es el punto de partida de todo cálculo: cuando un diseñador abre `project-front` y elige una plantilla, lo que carga es la hoja completa — celdas, fórmulas, tablas de consulta, zonas de semielaborado, celdas enlazadas al catálogo — y sobre esa base calcula el transformador. La plantilla decide qué se calcula y cómo. **No existe ninguna forma de administrarla.**

`project-back` solo expone `GET /design/templates/:subTypeId`. `TemplateService` tiene un único método, `findBySubTypeId`. No hay POST, ni PUT, ni DELETE, ni listado. Las plantillas nacieron de un seed (`1752536215183-template.ts`) y desde entonces se editan con SQL directo o no se editan.

El daño ya está en la base de datos (base `project`, MSSQL, consultada el 2026-08-18):

- **Tres de las cuatro plantillas están vacías.** `template` tiene 4 filas; solo `TEMPLATE_1F_0001` (id 3) tiene hojas. `TEMPLATE_3F_0001`, `TEMPLATE_3F_0002` y `COST_TEMPLATE_1F_0001` tienen **0 filas en `sheet`**. La migración `1771559492573-template-sheets` movió `cells`/`cellsStyles` de `template` a `sheet` y esas tres se quedaron sin contenido: hoy aparecen en la biblioteca de plantillas de `project-front` y al cargarlas el diseñador obtiene una hoja en blanco. Nadie lo detectó porque nada las inspecciona.
- **El orden de las hojas es ambiguo.** Las dos hojas vivas — `Resumen` y `Tablas` — tienen ambas `order = 0`. `TemplateResponseDto` ordena por `order`, así que el orden efectivo lo decide el motor de base de datos. El orden importa: las referencias entre hojas se resuelven por nombre (`'Tablas'!J14`), pero la hoja activa inicial y la numeración por defecto salen del orden.
- **Las filas y columnas ocultas de una plantilla se pierden al cargarla.** Lo persistido en `cellsStyles` es la forma *runtime* de `Sheet` (`templateHiddenRows`, `templateHiddenColumns`, `userHiddenRows`, `hiddenCells`), pero `loadTemplate` en `SpreadSheet.tsx` lee `cellsStyles.hiddenRows` y `cellsStyles.hiddenColumns`. Son campos distintos. Hoy el daño es latente porque los arreglos están vacíos; el primer autor que oculte una fila de cálculo intermedio descubrirá que el diseñador la ve.
- **Un tercio del documento es basura.** De las 3013 celdas de la plantilla, **975 no tienen contenido alguno** (671 en `Resumen`, 304 en `Tablas`), y no son las que llevan solo formato, que sí hacen falta. Y cada plantilla persiste `computed`, es decir, resultados congelados en el momento en que alguien guardó — con fórmulas de diseño cuyas versiones ya cambiaron.
- **3 de las 8 fórmulas de la plantilla dan `#ERROR` con el motor compartido, hoy, en producción.** `project-front` ya evalúa con `@rymel/formula-engine` y recalcula la plantilla entera al cargarla. Fallan `C6` y `G17`, porque están escritas con la convención regional española —`VLOOKUP(G13;Tablas!B3:Tablas!C10;2;TRUE)`— y el motor solo acepta `,` como separador y `Hoja!A1:B5` como rango calificado. Y falla `K73`, que no es una fórmula sino una directiva de gráfico (`=DRAW:BOBINADO:...`) que `SpreadSheetCell` dibuja dentro de la celda: el motor la evalúa como fórmula, su `computed` pasa a `#ERROR` y **el dibujo desaparece**. En los dos casos el daño va más allá del valor: el rango calificado en ambos extremos no se expande, así que el grafo de dependencias queda incompleto, y la directiva `DRAW:` genera precedentes inventados al leer sus tramos como rangos.

Mientras tanto, `project-admin` ya administra todas las piezas que la plantilla referencia — fórmulas de diseño, BOM, semielaborados, reglas de código de diseño — y ya consume `@rymel/formula-engine` v1.5.0 en la grilla de ítems fantasma. La plantilla es la única pieza del cálculo que quedó fuera.

## What Changes

**Contrato de plantilla compartido (nuevo paquete `@rymel/design-template`)**

- Tipos canónicos `TemplateDocument` / `TemplateSheet` / `TemplateCell` / `SheetStyles`, y las funciones de (de)serialización entre la forma persistida y la forma runtime. Es el único lugar donde se traduce `hiddenRows` ↔ `templateHiddenRows`, y por eso cierra de raíz la pérdida de filas ocultas.
- Validación e invariantes de una plantilla: referencias de celda y rangos bien formados, regiones (`namedRanges`, `semiFinishedZones`, `itemCatalogTables`) dentro de la hoja y sin solaparse, `itemLink` que apunta a una tabla de catálogo existente, `goTo` con celdas de condición reales, códigos de función invocados que existen y están asignados al subtipo.
- Normalización al guardar: se descartan las celdas sin contenido y **no se persiste `computed`** — el valor se recalcula al cargar.
- Sin React y sin dependencias de runtime salvo `@rymel/formula-engine`, para que `project-back` pueda validar el mismo documento que valida el navegador.

**Administración de plantillas (project-admin)**

- Nueva sección **Plantillas**, restringida a ADMIN: listado con búsqueda, filtros por subtipo, tipo (`DESIGN`/`COST`) y estado, y las acciones de crear, duplicar, editar, publicar y dar de baja.
- **Editor tipo hoja de cálculo**: múltiples hojas con orden explícito, edición de celdas y fórmulas con barra de fórmulas, estilos (negrita, colores, bordes, decimales, formato condicional), anchos y altos, filas/columnas ocultas, inmovilizar paneles, celdas combinadas, notas y listas desplegables.
- **Editores de región**: rangos con nombre y sus etiquetas, zonas de semielaborado (contra el catálogo real que `project-admin` ya administra), tablas de catálogo de ítems, configuración `goTo` y enlace de celda a ítem.
- **Enlace a datos del elemento** (`elementKey`): declarar qué celdas se rellenan con los valores del elemento al cargar la plantilla.
- **Vista previa calculada**: recalcular la plantilla completa con `@rymel/formula-engine`, resolviendo las funciones de diseño contra `POST /design-functions/calculate`, para ver los mismos números que verá el diseñador antes de publicar.
- **Validación bloqueante antes de publicar**: la plantilla no se publica con referencias circulares, funciones inexistentes o regiones inválidas.

**Catálogo de plantillas (project-back)**

- API REST completa: listado paginado con filtros, detalle con hojas, creación, actualización de metadatos, **guardado por hoja** (una plantilla viva pesa ~370 KB: `Resumen` 114 KB + `Tablas` 236 KB; enviar el documento entero en cada guardado es innecesario), reordenar hojas, duplicar plantilla y baja lógica.
- **Estado `DRAFT` / `PUBLISHED`** y contador de versión. `GET /design/templates/:subTypeId` pasa a devolver **solo publicadas**: es lo que evita que una plantilla a medio escribir llegue a un diseñador.
- **Unicidad de `code`** entre plantillas activas, y `order` de hoja único y consecutivo dentro de una plantilla.
- Validación en el servidor con el mismo paquete que usa el editor: el navegador no es la autoridad.
- Migración de saneamiento: las tres plantillas sin hojas pasan a `DRAFT` (dejan de ofrecerse), las dos hojas de la plantilla 3 reciben `order` 0 y 1, y `cellsStyles` se normaliza al contrato canónico.
- **BREAKING (interno)**: `GET /design/templates/:subTypeId` deja de devolver plantillas no publicadas. Las tres plantillas vacías desaparecen de la biblioteca de `project-front` — que es el resultado buscado.

**Motor de fórmulas (`@rymel/formula-engine`)**

- Nueva capacidad de **análisis estático de una hoja sin evaluarla**: referencias a hojas inexistentes, rangos mal formados, funciones desconocidas y ciclos, devueltos como diagnósticos por celda. El editor la necesita para validar una plantilla sin gastar una petición por función personalizada, y `project-back` para validar en el servidor sin red.
- **Separador de argumentos `;`**, además de `,`. Es la convención con la que están escritas las plantillas reales.
- **Rangos calificados en ambos extremos** (`Tablas!B45:Tablas!C156`), expandidos correctamente en el grafo de dependencias. Hoy solo se registran los dos extremos como precedentes, de modo que un cambio dentro del rango no dispara el recálculo.
- **Las celdas de gráfico dejan de tratarse como fórmulas.** Una celda cuyo contenido es una directiva `DRAW:` se reconoce como tal: no se evalúa, no aporta precedentes inventados, y su contenido se conserva íntegro.
- Estos tres puntos **reparan defectos vivos de `project-front`** en cuanto adopte el tag nuevo; no son solo requisitos del editor. Verificado contra el libro real: `G17` vuelve a dar los 20 que tenía guardados y `K73` conserva su dibujo. `C6` sigue en `#ERROR`, pero por una causa distinta y ajena a este cambio: su tabla de consulta está a medio escribir y el cuarto argumento de `BUSCARV` está invertido respecto de Excel desde el evaluador anterior. Ver `evidence/inventario-de-plantillas.md`, sección 3.4.

**Migración de `project-front`**

- **Sube el tag del motor** a la versión que entiende las plantillas reales. Repara sus tres defectos vivos: `G17` vuelve a calcular, el dibujo de `K73` deja de desaparecer al recalcular, y los rangos calificados vuelven a arrastrar el recálculo de quien los consulta.
- **Adopta `@rymel/design-template` para cargar plantillas.** `loadTemplate` deja de interpretar por su cuenta la forma persistida: los tipos, la lectura y la serialización pasan a ser los mismos que usan el editor y el servidor. Es lo que cierra de raíz la pérdida de filas ocultas, en vez de taparla escribiendo los dos nombres.
- **Separa lo que oculta la plantilla de lo que oculta el diseñador.** Hoy ambas cosas se persisten juntas en `cellsStyles`; el estado de una sesión no pertenece a la plantilla.
- **Paridad verificada antes de conmutar**: las dos vías de carga se comparan sobre las plantillas existentes, y toda diferencia queda explicada antes de cambiar nada.
- Una vez adoptado, **se retiran los campos espejo** (`templateHiddenRows`, `templateHiddenColumns`, `value`, `catalogSheetId`), lo que es un cambio de versión mayor del contrato.

**Fuera de alcance (no-goals)**

- Importar una plantilla desde `.xlsx`. Se hará después, sobre el contrato que este cambio define.
- Reescribir `SpreadSheet.tsx` ni extraer una rejilla compartida. La adopción del contrato en `project-front` cambia **de dónde salen los datos**, no cómo se dibuja ni cómo se edita la hoja. Ver `design.md`, decisiones 1 y 10.
- Versionado con linaje y obsolescencia de diseños, como el de fórmulas. No aplica: un diseño guardado copia las hojas a `sub_design.data`, así que editar una plantilla no altera ningún diseño existente.

## Capabilities

### New Capabilities

- `design-template-contract`: El contrato canónico de la plantilla — tipos, serialización entre forma persistida y forma runtime, normalización al guardar, invariantes y reglas de validación — empaquetado en `@rymel/design-template` y compartido por `project-admin`, `project-back` y (a futuro) `project-front`.
- `design-template-catalog`: Modelo de datos y API REST de plantillas en `project-back`: listado y filtros, CRUD, guardado por hoja, orden de hojas, duplicación, estado de publicación, unicidad de código y validación en servidor.
- `design-template-admin`: La sección de administración en `project-admin`: listado, editor de hojas y celdas, editores de región, enlace a datos del elemento, vista previa calculada, validación y publicación.
- `design-template-consumption`: Cómo `project-front` consume una plantilla: motor capaz de leer las fórmulas reales, carga a través del contrato compartido, separación entre lo que oculta la plantilla y lo que oculta el diseñador, verificación de paridad antes de conmutar, y las condiciones bajo las que se retiran los campos espejo.

### Modified Capabilities

- `shared-formula-engine`: Se añade el análisis estático de una hoja sin evaluación, que reporta por celda las referencias inválidas, las funciones desconocidas y los ciclos. Hoy el motor solo diagnostica evaluando, lo que obliga a resolver funciones personalizadas por red para saber si una plantilla es válida. Se añaden además tres reglas de compatibilidad con las plantillas reales: separador `;`, rangos calificados en ambos extremos con expansión correcta en el grafo, y celdas de gráfico excluidas de la evaluación.

## Impact

**Repos afectados: 5** (4 existentes + 1 paquete nuevo). Los artefactos de planificación viven en `project-admin/openspec/`; la implementación se reparte.

**`@rymel/design-template`** (nuevo, `github.com/JaviAPS94/rymel-design-template`)
- Paquete TypeScript con una sola dependencia de runtime, `@rymel/formula-engine`, fijada por tag. Sin React ni APIs de Node: `project-back` valida con el mismo código que el navegador.
- Distribución igual que el motor: dependencia de git con tag inmutable. Semilla: los tipos de `project-front/src/components/design/spreadsheet-types.ts` y `commons/types.ts`, unificados — hoy divergen entre sí y con lo persistido.

**`project-admin`** (`rymel-admin`)
- Nueva `TemplateListPage` y `TemplateEditorPage`, ruta protegida por rol ADMIN y entrada de menú.
- Nuevos `services/templateService.ts`, `hooks/useTemplates.ts` y `hooks/useTemplateSheet.ts`, siguiendo el patrón de `usePhantomItemGrid` — que ya resuelve grafo de dependencias, recálculo por celdas sucias y marcado de circulares sobre el motor compartido.
- Reutiliza lo que ya existe: `designFunctionService` para las funciones del subtipo y la evaluación, `semiFinishedService` para las zonas, y los componentes `ui/`.
- Dos dependencias nuevas: `@rymel/design-template` y una subida de tag de `@rymel/formula-engine` (análisis estático).

**`project-back`** (`rymel-back`)
- Migración: `status` y `version` en `template`, `order` único por plantilla, índice único de `code` entre activas, saneamiento de las 3 plantillas vacías y normalización de `cellsStyles`. Reversible.
- `src/modules/design/`: `TemplateService` pasa de un método a un servicio de administración completo; nuevos DTOs de escritura; endpoints bajo `/design/templates` con rol ADMIN, salvo la lectura por subtipo que conserva ADMIN+DESIGN.
- Nueva dependencia del paquete de contrato.

**`project-front`** (`rymel-front`)
- **Sube el tag de `@rymel/formula-engine`.** Medido antes de decidirlo: de los 31 sub-diseños guardados, con 64 celdas con fórmula, **ninguno** usa el separador `;`, ni un rango calificado en ambos extremos, ni una celda de gráfico. Las tres correcciones solo alcanzan a la plantilla, así que la subida de tag no puede alterar ningún número ya calculado y no necesita verificación en sombra.
- **Adopta el contrato en la carga de plantillas**: `loadTemplate`, los tipos de `commons/types.ts` y `spreadsheet-types.ts` que dupliquen el modelo, y la separación del ocultamiento del diseñador respecto del de la plantilla. `SpreadSheet.tsx` conserva su rejilla y su edición.
- Impacto observable: deja de ver las plantillas no publicadas, y las que carga vienen normalizadas — sin celdas basura, sin `computed` obsoleto y con las filas ocultas donde de verdad se leen.
- Los campos espejo (`templateHiddenRows`, `value`) existen solo hasta que esta migración termine. Ver `design.md`, decisiones 5 y 10.
