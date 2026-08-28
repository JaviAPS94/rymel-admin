## Context

```
project-front ──┐  (SpreadSheet.tsx, 6305 líneas: carga plantillas, no las escribe)
project-admin ──┼──► project-back ──► secure-function-engine-api
   (nuevo         │   (MSSQL, TypeORM)
    editor)       ├──► @rymel/formula-engine        (v1.5.0, ya consumido por los tres)
                  └──► @rymel/design-template       (nuevo: contrato de la plantilla)
```

**Estado real de los datos** (base `project`, MSSQL, consultada el 2026-08-18):

| Plantilla | Código | Tipo | Subtipo | Hojas |
|---|---|---|---|---|
| 3 | `TEMPLATE_1F_0001` | DESIGN | 1 | 2 |
| 4 | `TEMPLATE_3F_0001` | DESIGN | 2 | **0** |
| 5 | `TEMPLATE_3F_0002` | DESIGN | 2 | **0** |
| 6 | `COST_TEMPLATE_1F_0001` | COST | 1 | **0** |

La única plantilla con contenido:

| Hoja | `order` | Celdas | Fórmulas | Bytes celdas | Bytes estilos |
|---|---|---|---|---|---|
| `Resumen` | 0 | 1111 | 8 (`VLOOKUP`) | 114 437 | 19 932 |
| `Tablas` | 0 | 1902 | 1 (`SUM`) | 236 441 | 2 320 |

Qué usa realmente esa plantilla: `mergedCells` 141 + 10, `border` 317 + 1590, `bold` 23 + 1, `textColor` 20, `options` (desplegables) 2, `goTo` 1, `freezeRow` 7, un `namedRange` (`Tabla aluminio`, etiqueta `aluminio`, `J14:J14`), cero `semiFinishedZones` y cero `itemCatalogTables`. La hoja `Tablas` llega hasta la fila 232.

**Restricciones que condicionan el diseño:**

1. **La plantilla es el insumo del cálculo, no su resultado.** Un diseño guardado copia las hojas dentro de `sub_design.data`; editar una plantilla no toca ningún diseño existente. Esto separa este cambio del de fórmulas: aquí no hay obsolescencia que propagar.
2. **El documento es grande.** ~370 KB por plantilla, y la hoja `Tablas` sola son 236 KB. Todo lo que se diseñe — transporte, estado del editor, renderizado — tiene que asumir ese tamaño.
3. **Ya hay un contrato, pero está roto en tres puntos** (plantillas sin hojas, `order` duplicado, nombres de campos ocultos que no coinciden entre lo que se escribe y lo que se lee). Cualquier editor que se construya encima sin arreglarlos hereda los tres.
4. **El motor compartido ya resuelve el libro completo.** `evaluateSheet` indexa por referencia canónica (`Hoja1!A1`), construye un solo grafo sobre todas las hojas y agrupa las funciones personalizadas en un lote por nivel de dependencia. No hay que escribir recálculo: hay que alimentarlo bien.
5. **`project-admin` ya administra lo que la plantilla referencia**: fórmulas de diseño y su asignación por subtipo, semielaborados, BOM y reglas de código. El editor no necesita catálogos nuevos, solo consumir los que ya existen.

## Goals / Non-Goals

**Goals:**

- Que una plantilla se pueda crear, editar, previsualizar calculada, validar y publicar desde `project-admin`, sin SQL.
- Que lo que `project-front` carga sea exactamente lo que se administra aquí: un solo contrato, una sola serialización, verificada en ambos extremos.
- Que una plantilla inválida no llegue nunca a un diseñador: publicación bloqueada por validación, y biblioteca que solo ofrece plantillas publicadas.
- Sanear lo que ya está roto en la base: plantillas vacías ofrecidas como si sirvieran, `order` ambiguo, filas ocultas que se pierden, celdas basura y `computed` congelado.
- Reutilizar el motor compartido tal como está, sin volver a implementar evaluación ni grafo de dependencias en ninguna parte.

**Non-Goals:**

- Reescribir la rejilla de `SpreadSheet.tsx` o extraer una interfaz compartida. `project-front` sí migra al contrato (decisión 10), pero eso cambia de dónde salen los datos, no cómo se dibuja ni cómo se edita. Ver decisión 1.
- Importar `.xlsx`. El contrato que este cambio define es el prerrequisito; la importación viene después.
- Versionado con linaje y recálculo de diseños afectados. No aplica (restricción 1).
- Editar diseños ya guardados desde `project-admin`. Aquí se administra la plantilla, no el diseño.
- Consolidar los repos en un monorepo.

## Decisions

### 1. Se comparte el contrato de datos, no el componente de hoja de cálculo

`project-admin` construye su propio editor. Lo que se comparte con `project-front` es `@rymel/design-template`: tipos, serialización, normalización y validación — cero React.

*Por qué así:* el grid de `project-front` no es un componente de hoja de cálculo, es la pantalla de diseño de un transformador. Sus props lo dicen: `subTypeWithFunctions`, `element`, `designSubtypeId`, `setShowModalAfterSaveDesign`, `allSheets` de otras instancias, `setCreatedDesignId`. Está entrelazado con RTK Query, con el elemento normalizado, con el panel de código de diseño, con el tablero de gráficos y con el resumen de BOM. Nada de eso pertenece a un editor de plantillas, y la mitad de lo que sí pertenece —crear hojas, reordenarlas, declarar regiones, marcar celdas como enlazadas al elemento— hoy no existe allí porque el diseñador no las necesita: las consume.

Además, el peligro real de duplicar no es la UI, es el cálculo y la forma del dato. Eso es exactamente lo que el paquete cubre, y es la misma lección del change anterior: el motor duplicado produjo números distintos en el servidor y en la pantalla; los estilos duplicados, como mucho, producen un botón distinto.

*Alternativas consideradas:*
- **Copiar `SpreadSheet.tsx` y adaptarlo.** Arranca rápido y termina caro: ~10 000 líneas (`SpreadSheet` 6305 + `SpreadSheetGrid` 1034 + `SpreadSheetCell` 652 + `InlineCellGraphic` 1133 + auxiliares) duplicadas entre dos repos con stacks distintos (Redux Toolkit + react-icons contra Tanstack Query + Tabler). Cada arreglo habría que hacerlo dos veces, y la experiencia dice que se hace una.
- **Extraer un paquete de UI compartido `@rymel/spreadsheet-ui`.** Es la opción teóricamente correcta y sigue siendo el destino a plazo. Se descarta ahora porque obliga a refactorizar, dentro de este mismo cambio, el componente por el que pasa toda la producción de diseños. Riesgo desproporcionado para el beneficio: el editor de plantillas necesita *menos* superficie que el diseñador, no la misma.
- **Editor de formulario, sin grid.** Una plantilla de 1902 celdas con 141 combinaciones y bordes en 1590 celdas no se edita en un formulario.

*Trade-off aceptado:* habrá dos implementaciones de grid en el producto. Se acota exigiendo que ninguna lógica de cálculo, serialización o validación viva en la capa de UI de ninguna de las dos — todo eso está en los paquetes, y es verificable por revisión.

### 2. Un solo libro plano por plantilla, indexado por referencia calificada

El estado del editor es `Record<"Hoja!A1", TemplateCell>` — una sola estructura para toda la plantilla, no un mapa por hoja. Se construye **un** `DepGraph` sobre ese libro y se recalcula con `evaluateSheet`.

*Por qué así:* es la forma que el motor ya espera (`splitRef` deriva la hoja de la propia clave, y `evaluateSheet` deriva de las claves el conjunto de hojas conocidas para que una referencia a una hoja inexistente dé error en vez de cero). Con un grafo por hoja, editar `Tablas!J14` no marca como sucias las celdas de `Resumen` que la referencian por `VLOOKUP` — que es precisamente lo que hace hoy `project-front`, recalculando hoja por hoja en un bucle. El editor de plantillas no puede permitírselo: es el lugar donde esas referencias se escriben.

*Alternativa considerada:* mapa por hoja con reconciliación posterior entre hojas. Reimplementa a mano lo que el grafo global ya hace, y se equivoca en los casos que importan (ciclos que cruzan hojas).

La persistencia sí es por hoja: al guardar se parte el libro por prefijo y cada hoja viaja con sus celdas locales (`A1`, sin calificar), que es la forma en que ya está en la base.

### 3. `computed` no se persiste en la plantilla

Al guardar se descarta el valor calculado de toda celda con fórmula. Al cargar, el consumidor recalcula.

*Por qué así:* hoy la plantilla 3 guarda `B11: { formula: "=QUADRATIC(A11)", computed: 1 }`. El change anterior documentó que `QUADRATIC` cambió y que la misma fórmula pasó a dar 7. Un número congelado dentro de la plantilla es una afirmación falsa que sobrevive a la fórmula que la produjo, y `project-front` de todos modos recalcula todo tras cargar (`recalculateAllSheetsFormulas`): el valor persistido nunca se usa, solo engaña a quien lea la base. Descartarlo también reduce el documento.

*Alternativas consideradas:*
- **Conservar `computed` como caché de vista previa.** Obliga a invalidarlo cuando cambia una fórmula de diseño, es decir, a construir el mismo sistema de obsolescencia que aquí se declaró innecesario.
- **Conservarlo estampado con las versiones de fórmula usadas**, como `sub_design`. Coherente, pero se paga el costo de un mecanismo de linaje para un valor que nadie consume.

*Trade-off aceptado:* si al cargar una plantilla falla la resolución de una función personalizada, esas celdas quedan en error en vez de mostrar un número viejo. Es deliberado: un error visible es mejor que un número que ya no es cierto.

Las celdas literales conservan su contenido en `formula` (es donde ya vive) y su valor se deriva al cargar. Las **975 celdas sin contenido** —671 en `Resumen` y 304 en `Tablas`, un 32 % del documento— se eliminan en la normalización. Las 224 que llevan solo formato (bordes de una tabla vacía) **no** se tocan: el formato es contenido.

La celda de gráfico es la excepción a la regla de no persistir el valor calculado, y por eso deja de ser un caso de fórmula: ver decisión 9.

### 4. Estado `DRAFT`/`PUBLISHED` con instantánea al publicar, en vez de versionado con linaje

`template` gana `status` y `version`. `GET /design/templates/:subTypeId` devuelve solo `PUBLISHED`. Editar una plantilla publicada trabaja sobre su borrador; publicar valida el documento completo, incrementa `version` y guarda la versión anterior como instantánea JSON en `template_revision`.

*Por qué así:* la publicación es lo que faltaba, y se nota en la base: hay tres plantillas vacías ofreciéndose a los diseñadores porque nada distingue "existe" de "está lista". La instantánea al publicar es barata (una fila por publicación) y da lo único que de verdad se necesita del historial: revertir. Un autor que lleva media hora reorganizando 1902 celdas necesita poder volver atrás.

*Alternativas consideradas:*
- **Versionado con linaje completo**, como `design_function_version`. Se descarta por la restricción 1: los diseños copian la plantilla, así que no hay nada que marcar como desactualizado ni que recalcular. Sería maquinaria sin consumidor.
- **Nada de estados.** Es lo que hay hoy, y produjo el problema de las tres plantillas vacías.
- **Copia física del borrador como fila aparte de `template`.** Duplica el código de plantilla y obliga a decidir cuál gana en cada lectura; el estado es más simple y hace la regla explícita en la consulta.

*Trade-off aceptado:* mientras se edita un borrador de una plantilla ya publicada, los diseñadores siguen usando la publicada, y la instantánea permite volver a ella; no hay edición concurrente de dos autores sobre el mismo borrador. Con un único administrador es el compromiso correcto; si aparecen varios, el siguiente paso es bloqueo optimista por `updatedAt`, que este diseño ya deja preparado.

### 5. La migración escribe los dos nombres de los campos de ocultamiento

El contrato canónico es `hiddenRows` / `hiddenColumns`. El serializador escribe además `templateHiddenRows` / `templateHiddenColumns` con el mismo contenido, marcados como obsoletos.

*Por qué así:* lo persistido hoy usa los nombres `template*` y `loadTemplate` en `project-front` lee los nombres sin prefijo. Los dos lados están desalineados, pero solo uno se toca en este cambio. Escribir ambos hace que la plantilla funcione con el `project-front` actual y con el que adopte el paquete, sin coordinar despliegues entre repos.

*Alternativa considerada:* corregir `loadTemplate` en `project-front` sin más. Es una línea, y arregla el síntoma dejando en pie la causa: dos repos traduciendo la misma forma persistida por su cuenta, que es lo que produjo la desalineación. Escribir ambos campos permite empezar sin coordinar despliegues; la causa se cierra con la decisión 10.

*El espejo es una ventana, no un estado permanente.* **Cerrada en v2.0.0 del contrato**, después de comprobar —sirviendo las plantillas sin los cuatro campos— que ningún consumidor los leía, no de suponerlo. La migración `1788400000000` los quitó también del dato guardado: 2038 campos, 23 % menos de documento. Se siguen aceptando al leer, porque dejar de escribir algo no es dejar de entenderlo y una copia de seguridad anterior tiene que poder restaurarse. Ver `evidence/retirada-de-espejos.md`.

### 6. Dos niveles de validación: análisis estático sin red, evaluación con red solo en vista previa

**Publicar exige análisis estático limpio** — referencias bien formadas, sin hojas inexistentes, sin ciclos, funciones invocadas que existen y están asignadas al subtipo, regiones dentro de la hoja y sin solapes, `itemLink` y `goTo` que apunten a algo real. Se ejecuta en el editor mientras se escribe y **de nuevo en el servidor** al publicar.

**La vista previa calculada es opcional**: llama a `POST /design-functions/calculate` a través del puerto del motor, con lotes por nivel de dependencia.

*Por qué así:* validar de verdad no puede depender de que el motor cifrado esté arriba ni de que las celdas de la plantilla tengan valores de prueba coherentes — una plantilla en blanco es válida y no evalúa nada útil. Y el servidor tiene que validar por su cuenta: el navegador no es la autoridad sobre lo que entra a la base, que es justo lo que permitió que entraran las tres plantillas vacías.

Esto es lo que obliga a extender `@rymel/formula-engine`: hoy solo diagnostica evaluando, y evaluar significa red por cada función personalizada. El análisis estático es una pasada sobre el tokenizador y el grafo que ya existen.

*Alternativa considerada:* exigir una evaluación completa y exitosa para publicar. Ata la publicación a la disponibilidad del SFE y convierte cualquier `#ARGS` legítimo de una celda de ejemplo en un bloqueo.

### 7. Guardado incremental por hoja, publicación atómica

`PUT /design/templates/:id/sheets/:sheetId` guarda una hoja; el editor marca hojas sucias y solo envía esas. Los metadatos van por su propio endpoint. `POST /design/templates/:id/publish` valida el documento completo en el servidor y publica en una transacción.

*Por qué así:* la hoja `Tablas` son 236 KB. Reenviar el documento entero cada vez que se corrige un rótulo es desperdicio en cada guardado y una ventana de conflicto innecesaria. La atomicidad que importa no es la del guardado de un borrador, sino la de la publicación: es el momento en que el documento se vuelve visible para los diseñadores, y ahí sí se valida y se escribe todo o nada.

*Alternativa considerada:* `PUT` del documento completo, más simple y atómico. Se descarta por la restricción 2; el borrador es un espacio de trabajo, no un artefacto publicado.

### 8. Rejilla virtualizada de 250 × 50 sobre el mismo tamaño de libro que `project-front`

El editor renderiza solo la ventana visible más un margen.

*Por qué así:* `project-front` renderiza 250 filas × 50 columnas = 12 500 celdas y ya nota el costo (usa `startTransition` para no bloquear la escritura). El editor es peor caso: se escribe celda a celda durante horas seguidas. Mantener las mismas dimensiones es obligatorio — una plantilla escrita aquí tiene que caber allá, y `Tablas` ya llega a la fila 232 —, pero renderizarlas todas no lo es.

*Alternativa considerada:* reducir el tamaño de la rejilla en el editor. Rompe el contrato con `project-front` en el peor momento posible: al guardar.

### 9. El motor se adapta a las plantillas reales, y la celda de gráfico deja de ser una fórmula

Descubierto al ejecutar el motor contra el volcado real (`evidence/inventario-de-plantillas.md`): **3 de las 8 fórmulas de la única plantilla completa dan `#ERROR` con `@rymel/formula-engine` v1.5.0**, y como `project-front` ya evalúa con ese motor y recalcula al cargar, son defectos vivos, no riesgos.

Se corrigen en el motor, no en los datos ni en el editor:

- **Separador `;` además de `,`.** Las plantillas están escritas con la convención regional española, que es la que sale de Excel en el idioma en que trabaja el negocio. Normalizar los datos a `,` no sirve: el siguiente autor volverá a escribir `;`, porque es lo que su Excel produce.
- **Rango calificado en ambos extremos** (`Tablas!B45:Tablas!C156`), con expansión correcta en el grafo. Hoy `extractPrecedents` devuelve solo los dos extremos, así que un cambio en `Tablas!C100` no marca como sucia la celda que lo consulta: el grafo está incompleto y nadie lo había notado porque el resultado ya era `#ERROR` por otra razón.
- **La celda de gráfico no es una fórmula.** `=DRAW:BOBINADO:D56:D59,...` es una directiva que `SpreadSheetCell` interpreta para dibujar dentro de la celda. El motor la evalúa, da `#ERROR` y **borra el dibujo** al sobrescribir el `computed` que el renderizador lee. Peor: al leer los tramos `D56:D59` como rangos, le inventa precedentes (`D57`, `D58`, `E59`, `F59`…) y ensucia el grafo con aristas falsas.

En el contrato, la celda de gráfico es **una clase de celda propia**, no un literal ni una fórmula: se valida su sintaxis de directiva y las celdas que referencia, y la migración le retira el `=` para dejarla en la forma que el renderizador espera de primera mano (`rawValue.startsWith("DRAW:")`), sin depender de que un `computed` persistido la salve.

*Alternativas consideradas:*
- **Tolerarlas en el editor y no tocar el motor.** El editor no podría previsualizar la única plantilla que existe, y `project-front` seguiría roto. Se descartó de forma explícita.
- **Normalizar los datos en la migración** (`;`→`,`, rangos, quitar el `=`). Resuelve el caso de hoy y reaparece con cada plantilla nueva, porque no ataca la causa. De aquí solo se conserva la parte que sí es corrección de forma y no de sintaxis: retirar el `=` de la celda de gráfico.
- **Tratar `DRAW:` como texto literal sin validar.** Barato, pero una directiva mal escrita solo se descubre al abrir la plantilla en `project-front` y ver la celda en blanco — exactamente el tipo de fallo silencioso que este cambio existe para eliminar.

*Consecuencia de orden:* el trabajo del motor pasa a ir **antes** que el paquete de contrato. El contrato valida apoyándose en el análisis estático, y el análisis estático tiene que reconocer estas tres formas para no marcar como inválida la plantilla que sí es válida.

### 10. `project-front` migra al contrato, y esa migración es parte de este cambio

`project-front` sube el tag del motor y pasa a cargar las plantillas con `@rymel/design-template`. Deja de tener su propia traducción de la forma persistida.

*Por qué así:* la decisión 5 escribe los campos en espejo para no coordinar despliegues, y eso está bien como puente. Pero un puente sin la otra orilla es deuda permanente: mientras `project-front` traduzca por su cuenta, la siguiente divergencia entre lo que se escribe y lo que se lee es cuestión de tiempo, y será tan invisible como esta —las filas ocultas llevan perdiéndose desde que se guardaron, y nadie lo notó porque los arreglos están vacíos—.

Dejarlo para un cambio posterior tenía un motivo: no abrir la ruta de producción de diseños dentro de un cambio ya grande. Ese motivo se debilitó al medir. La adopción toca **la carga**, no la edición; y la parte que daba miedo —que cambiara números de diseños ya guardados— resultó no existir:

- de los 31 sub-diseños con datos, con 64 celdas con fórmula, **ninguno** usa `;`, ni rango calificado en ambos extremos, ni celda de gráfico, ni tiene un `#ERROR` guardado;
- las tres correcciones del motor solo alcanzan a construcciones que hoy únicamente existen en la plantilla.

Así que la subida de tag no necesita verificación en sombra. La adopción del contrato sí necesita **verificación de paridad**, que es otra cosa y más barata: cargar las plantillas existentes por las dos vías y comparar hojas, celdas, estilos, regiones y valores calculados. Es una comparación de datos, no un despliegue a ciegas.

*Alternativas consideradas:*
- **Solo subir el tag.** Repara los defectos vivos y deja la causa intacta: dos traducciones para una misma forma. Es exactamente el estado que produjo el defecto.
- **Un change propio para la adopción.** Más limpio sobre el papel, y en la práctica deja los campos espejo sin fecha de retirada y el contrato sin su tercer consumidor. Lo que hace falta de un change aparte —reescribir `SpreadSheet.tsx`, compartir rejilla— sigue fuera; lo que se incorpora es la parte acotada y medible.

*Límite explícito:* la adopción cambia **de dónde salen los datos de la plantilla**. No cambia cómo se dibuja la hoja, cómo se edita ni cómo se guarda un diseño. La decisión 1 sigue en pie: no se comparte interfaz entre el diseñador y el editor.

*Orden:* el tag primero, la adopción después de que el contrato esté publicado y el saneamiento de datos aplicado, y la retirada de los espejos al final, cuando los tres consumidores estén sobre el contrato.

### 11. Las filas son lo publicado; el borrador es un documento aparte

`template` y `sheet` guardan **siempre** lo publicado. El borrador vive en
`template_draft`, una fila por plantilla con el `TemplateDocument` completo en
JSON. Publicar valida ese documento, guarda una instantánea de lo que había y
lo vuelca sobre las filas.

*Por qué hizo falta decidirlo:* la decisión 4 dice que editar una plantilla
publicada trabaja sobre su borrador y que la publicada queda intacta mientras
tanto. Con una sola fila por plantilla eso no se sostiene — si el editor
escribe sobre `sheet`, la biblioteca sirve el borrador a medio hacer—, y la
decisión no decía dónde vive el borrador.

*Alternativas consideradas:*
- **Que la biblioteca sirva la última instantánea publicada** en vez de las
  filas. Es coherente, y cambia la ruta de lectura de la que depende
  `project-front` hoy, justo antes de migrarlo. El momento más caro posible
  para tocarla.
- **Una fila de plantilla duplicada como borrador.** Es la alternativa que la
  decisión 4 ya había descartado, y sigue teniendo el mismo problema: obliga a
  decidir cuál gana en cada lectura y a excluir el duplicado de la unicidad de
  código.
- **Editar en sitio y aceptar que el diseñador vea cambios a medias.** Es lo
  más simple y contradice el requisito.

*Lo que se conserva:* el guardado por hoja sigue siendo por hoja **donde
importa**, en el transporte —el editor envía una hoja, no las 141 KB del
documento—; el servidor sustituye esa hoja dentro del documento y reescribe el
blob, que a este tamaño es gratis.

*Trade-off aceptado:* el borrador se reescribe entero en cada guardado. A 141 KB
no es un problema; si una plantilla creciera un orden de magnitud, la salida
natural es pasar el borrador a filas propias, no volver a mezclarlo con lo
publicado.

*Consecuencia visible:* una plantilla nunca publicada existe solo como
borrador. Su fila está en `DRAFT` y no tiene hojas hasta la primera
publicación, lo que encaja con que la biblioteca solo sirva lo publicado.

### 12. La API de administración va bajo `admin/templates`

No bajo `design/templates/admin`, como decía el plan inicial.

*Por qué:* `design/templates/:subTypeId` ya existe y es la ruta que consume la
biblioteca del diseñador. `design/templates/admin` se resolvería como el
subtipo llamado «admin», y el conflicto dependería del orden en que Nest
registre los controladores. Además `admin/design-functions` ya estableció esa
frontera en el cambio anterior: bajo `admin/` van las operaciones que
administran, separadas de las que consume el producto.

## Risks / Trade-offs

- **La normalización toca la única plantilla en producción (370 KB) y descarta un tercio de sus celdas.** → La migración escribe primero una instantánea en `template_revision` con el contenido literal previo, y es reversible desde ahí. La normalización se ejecuta primero en modo simulación, comparando el número de celdas descartadas contra las **671 de `Resumen` y 304 de `Tablas`** medidas en el inventario, y se detiene si el resultado difiere. `project-back` ya tiene el precedente en `src/db/scripts/dry-run-recalculation.ts`.
- **Publicar solo lo `PUBLISHED` puede dejar un subtipo sin plantillas.** El subtipo 2 tiene dos plantillas, ambas vacías: al pasar a `DRAFT` se queda sin ninguna. → Es el estado real —hoy sus plantillas cargan en blanco—, pero hay que decirlo antes de desplegar y la biblioteca de `project-front` debe mostrarlo como "sin plantillas" en vez de una lista vacía sin explicación. Queda como pregunta abierta si se prefiere publicar las vacías para no cambiar lo que el diseñador ve.
- **Dos grids en el producto.** → Acotado por la decisión 1: la lógica vive en los paquetes. Se anota como deuda explícita, con `@rymel/spreadsheet-ui` como paso siguiente si el editor y el diseñador empiezan a pedir las mismas funciones.
- **La adopción del contrato toca la ruta de producción de diseños.** `loadTemplate` es por donde entra cada diseño que se crea. → Se acota a la carga —la edición y el guardado no se tocan— y no se conmuta sin la comparación de paridad de la decisión 10, que es una comparación de datos sobre las plantillas reales, no una prueba de humo. Si aparece una diferencia que no corresponde a una corrección conocida, no se conmuta.
- **La separación entre el ocultamiento de la plantilla y el del diseñador cambia una estructura viva.** Hoy `Sheet` lleva `templateHiddenRows` y `userHiddenRows` y ambos acaban en el mismo `cellsStyles`. → El contrato solo transporta el de la plantilla; el del diseñador se queda en memoria. Los datos actuales lo permiten sin conversión: los cinco arreglos están vacíos en las dos hojas reales.
- **Un tercer paquete distribuido por tag de git.** Cada consumidor fija su versión y pueden divergir, igual que ya ocurre con el motor. → El servidor valida con su propia versión del paquete: si `project-admin` publica con un paquete más nuevo que el de `project-back`, la validación del servidor manda y el error es visible al publicar, no meses después. La versión del paquete con la que se publicó queda registrada en la plantilla.
- **El editor calcula sobre datos de ejemplo, no sobre un elemento real.** Las celdas con `elementKey` se rellenan en `project-front` con los valores del elemento; en el editor no hay elemento. → La vista previa permite cargar un juego de valores de prueba por `elementKey`, y las celdas enlazadas se muestran señaladas para que el autor sepa que su contenido es provisional.
- **`sheet.cells` es `text` en MSSQL** y ya guarda 236 KB. → Suficiente margen (`text` admite 2 GB), pero el tipo está obsoleto en SQL Server; la migración lo pasa a `nvarchar(max)`, que es lo que ya usa `template.name`. Sin esto, cualquier consulta con `LEN()` sobre la columna falla — comprobado al inspeccionar los datos.

## Migration Plan

0. **Motor de fórmulas** primero (decisión 9): compatibilidad con `;`, rangos calificados en ambos extremos y celdas de gráfico, más el análisis estático. Publicado como tag nuevo. Sin esto, el análisis estático marcaría como inválida la única plantilla válida.
1. **Paquete de contrato** después, con las pruebas de ida y vuelta ejecutadas contra el JSON real de las dos hojas de la plantilla 3 extraído de la base. Sin eso, ni el editor ni la migración tienen suelo.
2. **`project-back`**: migración de esquema (`status`, `version`, `template_revision`, `order` único, `code` único entre activas, `cells`/`cellsStyles` a `nvarchar(max)`), y endpoints. La migración de datos corre en simulación, se compara y luego se aplica.
3. **`project-admin`**: listado y editor, contra los endpoints ya desplegados.
4. **`project-front`, subida de tag del motor.** Una línea, con exposición medida en cero. Se puede hacer en cualquier momento a partir del paso 0, y cuanto antes, porque repara defectos vivos.
5. **`project-front`, adopción del contrato**, después de que el paso 2 haya reescrito los datos. Antes de conmutar, comparación de paridad entre las dos vías de carga sobre las plantillas existentes.
6. **Corte de la biblioteca**: `GET /design/templates/:subTypeId` empieza a filtrar por `PUBLISHED` solo cuando la plantilla 3 esté publicada y verificada en `project-front`. Es el único paso visible para los diseñadores y va al final, no al principio.
7. **Retirada de los campos espejo**, ya con los tres consumidores sobre el contrato. Versión mayor del contrato.

**Rollback:** cada paso es independiente. El filtro por `PUBLISHED` se revierte con una bandera; la normalización de datos, restaurando desde `template_revision`; el esquema, con el `down` de la migración.

## Open Questions

1. ~~**Los dos subtipos que se quedarían sin plantillas.**~~ **Resuelta (2026-08-18).** Confirmado por el responsable del producto: hoy solo una plantilla está completa; las otras tres están a medio hacer. Se quedan en `DRAFT` y el subtipo 2 aparece sin plantillas publicadas hasta que se termine la suya. Es el estado real, y ocultarlo con una publicación de conveniencia solo reproduce el problema que este cambio corrige.
2. ~~**Origen de las claves de `elementKey`.**~~ **Resuelta (2026-08-18).** Existe: la tabla `field` guarda en `base` un JSON con la definición de los campos del elemento por subtipo (`phases`, `power`, `primaryVoltage`, `secondaryVoltage`…), cada uno con su etiqueta, su tipo y sus validaciones. Es exactamente lo que el editor necesita para ofrecer las claves en vez de pedirlas escritas. **Falta el endpoint**: el módulo `field` de `project-back` es un esqueleto, con `FieldService` vacío y un controlador sin rutas. Se añade la lectura de campos por subtipo como parte del grupo 5.
3. **Duplicar una plantilla entre subtipos.** ¿Duplicar debe permitir cambiar el subtipo destino? Las fórmulas invocadas están asignadas por subtipo, así que una copia a otro subtipo puede quedar inválida de entrada. La validación lo detectaría, pero conviene decidir si se ofrece.
