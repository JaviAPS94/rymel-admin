## Context

```
project-admin (editor de plantillas) ──► configura ──► template / template_draft
                                                              │  (TemplateDocument, contrato v2)
project-front (diseñador) ◄── carga (readTemplate) ◄──────────┘
      │  edita valores y guarda
      └──► sub_design.data  (copia de las hojas; no vuelve a la plantilla)
```

**Qué hay hoy en el menú contextual del diseñador** (`project-front/src/components/design/SpreadSheet.tsx`, ~4370–5080), clasificado por lo que hace:

| Acción | Escribe | Clase | En el admin hoy |
|---|---|---|---|
| Ocultar / mostrar celda | `hiddenCells` (sesión) | uso | — (no aplica) |
| Ocultar fila / columna, mostrar todas | `userHiddenRows/Columns` (sesión) | uso | la plantilla oculta con `hiddenRows/Columns` desde la barra |
| Ir a tabla | nada, navega | uso | — |
| Combinar / separar | `mergedCells` | configuración | barra de formato |
| Inmovilizar / movilizar (celda, fila, columna) | `freezeRow/Column` | configuración | barra de formato |
| Nota | `note` | configuración | panel de celda |
| Etiqueta MO / MD | `materialTag` | configuración | **no existe** |
| Configurar / quitar Ir a | `goTo` | configuración | panel de celda |
| Etiquetar rango / ver tablas | `namedRanges` | configuración | panel de regiones |
| Zona de semielaborado | `semiFinishedZones` | configuración | panel de regiones |
| Tabla de catálogo | `itemCatalogTables` | configuración | panel de regiones |
| Vincular a ítem | `itemLink` | configuración | panel de celda, **identificador escrito a mano** |
| Configurar vínculo al catálogo | `catalogConditionCells` | configuración | **no existe** (el contrato ya tiene el campo) |

**Qué dicen los datos** (base `project`, 2026-09-29, `audit-authoring-usage.ts`, solo lectura):

| Origen | MO/MD | `itemLink` | condiciones | zonas | tablas catálogo | `goTo` | rangos | combinadas |
|---|---|---|---|---|---|---|---|---|
| Plantilla 3 publicada (y su borrador) | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 151 |
| Plantillas 25 y 48 publicadas | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 33 diseños guardados | 4 celdas en 2 diseños | 2 | 2 | 3 | 2 | 0 | 0 | 5 |

Los dos diseños con BOM son `sub_design` 90 y 91, con contenido de prueba (`"sdasd"`, `"asdasd"`). El flujo de BOM se ha usado solo para probarlo, y siempre desde el diseño.

**Restricciones que condicionan el diseño:**

1. **Un diseño copia las hojas.** Lo que el diseñador tocaba en el menú se guardaba en `sub_design.data` y no volvía nunca a la plantilla. Por eso, configurar en el diseño producía configuración huérfana: nadie la reutiliza en el diseño siguiente.
2. **El contrato ya transporta todo.** `TemplateCell` tiene `materialTag`, `catalogConditionCells` e `itemLink`, y `template-loading.ts` en `project-front` ya los traduce al cargar. Lo que falta es poder escribirlos desde el admin y quitarle al diseñador la posibilidad de cambiarlos.
3. **El admin ya tiene casi todo, pero repartido.** Barra de formato, panel de regiones y panel de celda. `TemplateGrid` expone `onContextMenu`, y `TemplateEditorPage` no lo conecta.
4. **La exclusividad de MO/MD solo existe en la interfaz del diseñador** (`tagCellAsMaterial`). `extractMaterialTagValues` toma la primera celda que encuentra.
5. **El texto plano de una fórmula solo existe en el motor cifrado.** `project-back` envía expresiones cifradas a `evaluate-function`, y el motor las evalúa con `mathjs` sin conocer las demás fórmulas. Hay 5 fórmulas activas: 4 `DESIGN` y 1 `COST`. El motor de la hoja (`@rymel/formula-engine`) **ya** resuelve fórmulas de diseño anidadas dentro de una celda (`=QUADRATIC(DISENO_ALEX(A1))`), por vueltas sucesivas dentro de un mismo nivel. Lo que falta es la composición dentro de una expresión.
6. **Un diseño no sabe de qué plantilla viene.** `sub_design` no tiene `template_id`. Lleva su propia copia de las hojas.
7. **El editor de plantillas ya tiene el grafo completo del libro** (`useTemplateDocument`), y no lo muestra.

## Goals / Non-Goals

**Goals:**

- Que toda configuración que el diseñador podía hacer desde el menú contextual se pueda hacer en el editor de plantillas, **desde un menú contextual equivalente**, para que quien conoce el flujo del diseñador no tenga que volver a aprenderlo.
- Que el diseñador no pueda cambiar la configuración de la plantilla, y siga viendo y usando todo lo que la plantilla declara.
- Que las reglas que hoy solo impone una interfaz (una sola MO y una sola MD, el ítem existe) pasen al contrato, y así las apliquen el editor y el servidor.
- Que una fórmula de diseño pueda invocar a otra sin copiarla, sin que su texto plano salga del motor cifrado, y con la obsolescencia propagada a quien la invoca.
- Que el autor vea de qué se alimenta y a quién alimenta cada celda, sin que el diseñador reciba esa herramienta.
- Que la plantilla pueda proteger celdas, y que la protección se cumpla en la interfaz del diseñador y en el servidor.

**Non-Goals:**

- Resolver el ítem vinculado según los valores de cada diseño (pregunta abierta 1).
- Mover el resumen BOM al admin: es un resultado, y se calcula con el elemento real.
- Llevar la ocultación de celdas a la plantilla.
- Migrar la configuración de `sub_design` 90 y 91.
- Compartir el componente de menú entre los dos repos (decisión 1 del change anterior: se comparte el contrato, no la interfaz).
- Recursión entre fórmulas, y composición entre tipos distintos.
- Proteger en el servidor la creación de un diseño (decisión 9).
- Rastreo de celdas en `project-front`.

## Decisions

### 1. Un menú contextual en el admin, además de los paneles, no en lugar de ellos

`GridContextMenu` se abre con clic derecho sobre celda o cabecera, y cada entrada **llama a la misma mutación** que ya usan la barra y los paneles (`updateCell`, `setSheetStyles`, la combinación de `onMerge`). Las acciones que necesitan datos (nota, `goTo`, rango, zona, tabla, condiciones, ítem) abren un modal pequeño, prellenado con la selección, que reutiliza los formularios de `RegionsPanel` y `CellBindingsPanel` extraídos a componentes.

*Por qué así:* el pedido es que el admin tenga lo que tenía el diseñador, y lo que tenía era ese menú. Quien ha configurado BOM en `project-front` sabe hacerlo con clic derecho. Los paneles siguen siendo mejores para revisar: ven todas las regiones de la hoja de un vistazo. Las dos entradas escriben por el mismo camino, así que no pueden divergir.

*Alternativas consideradas:*
- **Solo paneles, añadiendo lo que falta.** Menos código, y deja al admin con un flujo distinto del que el negocio ya conoce. Se descarta porque el pedido es explícito: el mismo menú.
- **Solo menú, retirando los paneles.** Pierde la vista de conjunto (cuántas zonas hay, dónde) que el menú no puede dar, porque siempre trabaja sobre una celda.
- **Copiar el menú de `project-front`.** Son ~700 líneas de JSX con estado local de modales en un componente de 6000. Además, escribe sobre la forma runtime de `Sheet` y no sobre `TemplateDocument`. No se puede trasplantar sin reescribirlo.

### 2. La exclusividad de MO/MD es una mutación del documento, no una secuencia de `updateCell`

`useTemplateDocument` gana `setMaterialTag(sheet, ref, tag | null)`. Quita la etiqueta de cualquier otra celda de cualquier hoja y la pone en la celda indicada, con **una sola** instantánea de historial y marcando como sucias todas las hojas tocadas.

*Por qué así:* hacerlo con dos `updateCell` deja dos pasos en el historial. Deshacer una vez dejaría la plantilla con dos MO, o con ninguna, que es justo el estado que la regla prohíbe. Además, la mutación tiene que marcar como sucia la otra hoja, o el guardado selectivo no la enviaría.

*Alternativa considerada:* un `updateDocument(fn)` genérico. Es más flexible, y abre la puerta a que la interfaz haga transformaciones arbitrarias del documento fuera del hook, que es donde vive la contabilidad de hojas sucias. Se prefiere una operación con nombre.

### 3. El ítem vinculado es fijo por plantilla

Al vincular, el admin elige una fila concreta y la plantilla guarda `itemLink { catalogSheetName, catalogTableId, itemId }`. El diseñador lo hereda y no lo cambia.

*Por qué así:* es lo que pidió el responsable del producto: toda la funcionalidad de BOM pasa al admin. Y es lo que el contrato y el BOM ya saben consumir. `buildBomSummary` lee `itemLink.itemId`, así que no hace falta tocar el cálculo.

*Consecuencia que hay que decir en voz alta:* en el diseñador, las condiciones de catálogo servían para abrir **la tabla correcta según los valores del diseño**. Así, por ejemplo, un espesor 3 ofrecía el catálogo de aluminio rectangular. Con el ítem fijado en la plantilla, las condiciones solo enrutan el selector **del autor**, evaluadas con los valores de prueba de la vista previa. Si el material debe variar según el elemento, este cambio no lo resuelve. La salida natural es un vínculo calculado (el ítem sale de una búsqueda sobre la tabla), y va aparte (pregunta abierta 1).

*Alternativas consideradas:*
- **Que el admin configure el enrutado y el diseñador elija el ítem.** Era la recomendación inicial. El responsable del producto la descartó: el BOM completo es configuración.
- **Ítem por defecto en la plantilla, cambiable por el diseñador.** Reintroduce configuración en el diseño, que es el problema que el cambio resuelve.

### 4. Dos invariantes nuevas en el contrato, versión menor

`duplicate-material-tag` y `missing-catalog-item` entran en `validate.ts`, y con ellas `@rymel/design-template` pasa a v2.1.0.

*Por qué en el contrato:* la interfaz del admin ya impide la doble etiqueta (decisión 2), pero la interfaz no es la autoridad: un borrador restaurado de `template_revision`, o un documento escrito por otro cliente, puede traerla. El servidor valida con el paquete al publicar (decisión 6 del change anterior), así que la regla vale en los dos extremos sin escribirla dos veces.

*Por qué menor y no mayor:* según el criterio del README del contrato, sube la mayor cuando una plantilla guardada deja de significar lo mismo. Aquí ninguna cambia de significado, y ninguna guardada deja de ser válida: las publicadas tienen cero etiquetas y cero vínculos. Añadir miembros a la unión `DiagnosticCode` puede obligar a un consumidor con un `switch` exhaustivo a cubrirlos. Eso es un error de compilación en quien sube el tag, que es el momento correcto para enterarse.

*`missing-catalog-item` es estático:* compara con el **contenido** de la columna de identificador. Si esa columna tiene fórmulas, la comprobación se omite para esa tabla en vez de marcarla como inválida. Es coherente con la decisión 6 del change anterior: publicar exige análisis estático, no evaluación.

### 5. En `project-front` se quita el código, no solo el botón

Se retiran las entradas del menú **y** los modales, estados y manejadores que dejan de tener uso: `noteModal`, `goToConfigModal`, `namedRangeModal`, `semiFinishedZoneModal`, `catalogTableModal`, `catalogConditionModal`, `itemPickerModal`, `tagCellAsMaterial`, `clearCellMaterialTag`, `freezePanes`, `mergeCells` y el resto. También `ItemPickerModal.tsx`, y los pasos de configuración de `BomTutorial` y de `InstructionsModal`.

Se conservan: `catalogResolver` (lo usan el pintado de la celda vinculada y el resumen BOM), `navigateGoTo`, las funciones de ocultar de la sesión, y todo el pintado de marcas.

*Por qué así:* esconder los botones y dejar el código deja manejadores que escriben la configuración a un atajo de teclado de distancia. Además, `SpreadSheet.tsx` es el componente más grande del producto: cada manejador muerto es superficie que alguien tendrá que leer. La especificación exige que no quede **ningún** camino de escritura, y eso se puede comprobar con `grep` sobre los nombres de campo.

*Alternativa considerada:* ocultar las acciones según el rol, dejándolas a `ADMIN` dentro de `project-front`. `project-front` tiene el tipo `Role` y podría hacerlo. Se descarta porque mantiene dos sitios donde configurar una plantilla, y además el que está en el diseñador escribe en el diseño, no en la plantilla (restricción 1). Un administrador que configurara ahí seguiría produciendo configuración huérfana.

*Límite respecto del change anterior:* el requisito «El diseñador sigue siendo el dueño de su propia interfaz» sigue en pie. Este cambio no comparte rejilla ni altera cómo se dibuja o se edita el **contenido**. Retira acciones de configuración que no le correspondían.

### 6. Condiciones y selector se evalúan con la vista previa

El selector de ítem del admin resuelve las condiciones con los valores de `useTemplatePreview`, que ya usa valores de prueba por clave de elemento. Si una condición depende de una celda con `elementKey`, avisa de que el enrutado real dependerá del elemento.

*Por qué así:* es el único lugar del admin donde las celdas tienen valor calculado, incluidas las fórmulas de diseño resueltas por red. Evaluar aparte duplicaría el cálculo.

### 7. La composición de fórmulas se resuelve dentro del motor cifrado, con el cierre enviado por `project-back`

`project-back` conoce las dependencias de cada versión (decisión 7b), calcula el cierre transitivo de la fórmula que se evalúa, y envía a `evaluate-function` la expresión cifrada más `dependencies: { CODE: { encryptedFunction, variables, constants } }`. El motor descifra cada una, la compila con `mathjs`, y la expone en el ámbito de evaluación como una función que asigna sus argumentos a las variables en orden, y aplica sus propias constantes.

*Por qué así:* la clave de descifrado vive solo en el motor, y el requisito «Acceso al texto plano restringido y auditado» no se negocia. Cualquier otra forma de componer obliga a que alguien más vea el texto plano, o a que `project-back` evalúe por partes. Y evaluar por partes no funciona, porque los argumentos de la invocación interna (`x + 1`) son expresiones de la externa, que `project-back` no puede leer.

*Alternativas consideradas:*
- **Que el motor busque las dependencias en la base.** Da al motor acceso a la base, que hoy no tiene, y lo acopla al modelo de versiones de `project-back`. El motor es deliberadamente sin estado.
- **Expandir en línea al guardar** (sustituir `QUADRATIC(x)` por su texto y cifrar el resultado). Resuelve la evaluación sin tocar el motor, y congela la versión de `QUADRATIC` dentro de la otra fórmula. Publicar una versión nueva de `QUADRATIC` no cambiaría nada, en silencio. Es exactamente la copia que el pedido quiere eliminar.
- **Resolver en `project-front`** con el motor de la hoja, que ya anida funciones personalizadas en una celda. No aplica: aquí la composición está dentro de una expresión cifrada que el cliente nunca ve.

*7b. Cómo se conocen las dependencias sin leer el texto plano.* Al guardar una versión, `project-back` ya pasa el texto plano por el motor para validarlo y cifrarlo. `validate` pasa a devolver los símbolos invocados como función que no son de `mathjs`, y `project-back` los contrasta con las fórmulas activas del tipo y los guarda en `design_function_dependency(version_id, depends_on_function_id)`. La dependencia apunta a la **fórmula** y no a la versión, porque se evalúa siempre con la vigente, igual que desde una hoja.

*Ciclos y profundidad* se comprueban dos veces. `project-back` los comprueba al guardar, sobre el grafo de versiones vigentes, y da un error legible. El motor los comprueba al evaluar, como defensa: un ciclo que llegara igualmente no debe colgar el proceso. La profundidad máxima es 5, y no hay ninguna composición todavía: se elige para que un error de diseño se note, no para restringir un uso real. Se sube si aparece un caso.

*Rendimiento:* una fórmula con dependencias se sigue evaluando en una sola llamada al motor, porque el cierre viaja completo. El coste nuevo es descifrar más expresiones por llamada: con 5 fórmulas activas, despreciable.

### 8. Obsolescencia transitiva por el estampado, no por un recorrido al publicar

El estampado de un sub-diseño pasa a incluir el cierre de dependencias con sus versiones. `markStaleForFunction` no cambia de lógica: marca los estampados que tienen una versión anterior de la fórmula publicada, y ahora esos estampados ya contienen las fórmulas indirectas.

*Por qué así:* el estampado es el registro de con qué se calculó un diseño. Si `QUADRATIC` participó, debe figurar. Recorrer el grafo inverso al publicar también funcionaría, pero respondería con las dependencias de **hoy**, no con las que había cuando se calculó el diseño. Si `A` dejó de invocar a `QUADRATIC` en su versión 3, un diseño calculado con `A` v2 sigue dependiendo de `QUADRATIC`.

*Consecuencia:* los estampados existentes no tienen cierre. Hoy no hay composiciones, así que no les falta nada.

### 9. Solo lectura: regla en el contrato, cumplimiento en la interfaz del diseñador y control en el servidor al actualizar

- **Contrato:** región `readOnlyZones` y una única función `isReadOnly(sheet, ref)`, que tiene en cuenta las combinaciones.
- **`project-front`:** todas las vías de escritura del diseñador (edición en celda, barra de fórmulas, `Supr`, pegar, cortar, rellenar) consultan `isReadOnly` antes de escribir. Las escrituras que no son del diseñador (recálculo, relleno por `elementKey` al cargar) no pasan por esa guarda.
- **`project-back`:** al **actualizar** un `sub_design`, compara la copia entrante con la guardada. Rechaza si cambia el `formula` de alguna celda protegida por las zonas de la copia guardada, o si una zona desaparece o se reduce.

*Por qué también en el servidor:* «que no modifique» es una garantía, y la interfaz no es la autoridad. Es la misma lección que llevó a validar las plantillas en el servidor.

*Por qué solo al actualizar:* `sub_design` no guarda de qué plantilla viene, así que en la creación no hay contra qué comparar. Añadir `template_id` y versión a `sub_design` resolvería la creación también, y es un cambio de modelo de datos con su propia migración de 33 diseños sin origen conocido. No compensa para cerrar la ventana de la primera escritura, que solo la interfaz puede abrir. Queda anotado como paso siguiente si se necesita auditar la procedencia de un diseño.

*Qué hoja se compara con cuál:* `updateDesign` borra y vuelve a crear los `sub_design`, así que no hay id de fila estable. Se empareja por el `id` de hoja que lleva el propio `data` (`design-sheet1`), y solo se juzgan las hojas presentes en los dos lados. Cargar otra plantilla sobre un diseño existente reemplaza sus hojas por otras con ids nuevos. Eso **descarta** el contenido protegido, no lo **modifica**, y rechazarlo bloquearía un flujo que el diseñador tiene. Descubierto al implementar (tarea 3.3).

*Por qué se compara `formula` y no `computed`:* el valor de una fórmula protegida cambia legítimamente cuando cambian sus entradas. Lo protegido es lo que el autor escribió.

*Alternativas consideradas:*
- **Un atributo `locked` por celda** en lugar de regiones. Cualquier tabla real necesitaría cientos de marcas, y la plantilla 3 tiene tablas de 200 filas. Se declara como se piensa: por rangos, igual que las demás regiones.
- **Proteger por omisión todo lo que tenga fórmula.** Es tentador y es incorrecto: hay fórmulas que el diseñador debe poder sobrescribir, y decidir cuáles es trabajo del autor.

### 10. El rastreo de celdas lee el grafo del editor

`useCellTrace(ref, mode)` consulta el `DepGraph` que `useTemplateDocument` ya mantiene: `precedents` y `dependents` directos, y un recorrido en anchura con conjunto de visitados para la cadena completa. Los rangos se muestran como rango, aunque el grafo los tenga expandidos celda a celda: se agrupan con los `refs` que devuelve `analyzeExpression` para esa fórmula.

*Por qué así:* un segundo analizador podría discrepar del grafo que de verdad decide el recálculo, y el rastreo existe precisamente para entender ese recálculo. El grafo ya está construido e indexado: el coste es de lectura (medido en el change anterior: 2.8 ms en construirlo para 2039 celdas; consultarlo es O(aristas)).

*Solo admin:* el diseñador no lo recibe. Es una herramienta para escribir la plantilla, y mostrar al cliente de qué celdas se alimenta cada cálculo expone la estructura del modelo sin ninguna necesidad de su trabajo. Las expresiones de las fórmulas de diseño no se muestran en ningún caso: el rastreo muestra la invocación y sus argumentos, no lo que hay dentro.

## Risks / Trade-offs

- **[Riesgo] Un `project-back` en v2.0.0 del contrato borra `readOnlyZones`** al normalizar un borrador que las lleve. → Orden de despliegue: `project-back` sube a v2.1.0 antes que el admin, que es el único que puede escribirlas. Se comprueba con una ida y vuelta por la API antes de habilitar la acción en el editor.
- **[Riesgo] Un `project-front` sin actualizar ignora las zonas** y deja editar. → El admin no ofrece la acción hasta que `project-front` con v2.1.0 esté desplegado. Mientras tanto, el control del servidor en la actualización ya rechaza los cambios, porque las zonas viajan en la copia.
- **[Riesgo] La composición convierte un cambio en `QUADRATIC` en un cambio en todas las que la invocan.** Es el objetivo, y también un radio de impacto mayor. → La consulta de impacto cuenta ahora a quienes la invocan, y el marcado de obsolescencia los incluye. Nadie publica a ciegas.
- **[Riesgo] Una expresión cifrada ya guardada con un nombre que coincide con un código de fórmula** empezaría a resolverse contra esa fórmula. → Hoy fallaría con «Undefined function», así que no hay ninguna funcionando. Se verifica validando las 5 expresiones activas antes de desplegar (tarea 8.1).
- **[Trade-off] La primera escritura de un diseño solo la protege la interfaz** (decisión 9).

- **[Riesgo] Un diseñador que hoy configuraba BOM se queda sin poder hacerlo antes de que haya una plantilla configurada.** → Los datos dicen que nadie lo hace en producción: solo dos diseños de prueba. Aun así, el orden de despliegue pone el admin antes que el recorte del diseñador, y el paso de corte exige que la plantilla que se vaya a usar con BOM esté configurada y publicada.
- **[Trade-off] El material ya no varía por diseño** (decisión 3). → Aceptado por el responsable del producto. Queda como pregunta abierta, con la salida identificada.
- **[Riesgo] Las notas dejan de servir al diseñador como apunte propio.** Hoy el mismo campo servía para las dos cosas. → Es consecuencia directa del pedido. Si se echa de menos, lo correcto es una nota de diseño separada de la de plantilla, no devolver la escritura de `note`.
- **[Riesgo] Quitar código de `SpreadSheet.tsx` rompe algo que compartía estado con lo retirado.** Por ejemplo, `catalogResolver` vive junto al selector de ítem. → Se retira por partes, compilando y ejecutando `check-template-load.ts` después de cada una, y se verifica a mano abriendo los `sub_design` 90 y 91 y la plantilla 3, con su resumen BOM, antes y después.
- **[Riesgo] Diagnósticos nuevos bloquean una publicación que antes pasaba.** → Medido: ninguna plantilla guardada los produce. Se comprueba con `check-template-admin.ts` y validando los tres documentos publicados con v2.1.0 antes de subir el tag en `project-back`.
- **[Trade-off] Dos caminos en el admin (menú y paneles).** → Acotado: los dos llaman a la misma mutación del hook, y las pruebas del menú comprueban el documento serializado, no la interfaz.

## Migration Plan

Dos líneas independientes: plantillas (1–6) y fórmulas (A–D). Pueden avanzar en paralelo.

**Plantillas**

1. **Contrato v2.1.0**: invariantes de MO/MD y del ítem enlazado, región `readOnlyZones`, `isReadOnly` y sus invariantes. Validar contra los documentos publicados reales (cero diagnósticos nuevos). Publicar el tag.
2. **`project-back`**: subir el tag **antes que nadie** (decisión 9, primer riesgo), y añadir el control de solo lectura en la actualización de `sub_design`. `check-template-admin.ts` en verde, e ida y vuelta de un borrador con zonas.
3. **`project-admin`**: subir el tag, mutación `setMaterialTag`, menú contextual, condiciones, selector de ítem, señalización y rastreo de celdas. La acción de proteger queda oculta tras una bandera hasta el paso 5.
4. **Puerta de corte**: si alguna plantilla se va a usar con BOM, se configura y publica en el admin. Con los datos de hoy, ninguna depende de ello.
5. **`project-front`**: recortar el menú, retirar el código muerto y la ayuda, cumplir las zonas de solo lectura, y copiarlas al guardar. Subir el tag a v2.1.0. Verificar la plantilla 3 y los `sub_design` 90 y 91 antes y después.
6. **Habilitar la protección** en el admin.

**Fórmulas**

- A. **Comprobación previa**: validar las 5 expresiones activas con el motor nuevo. Ninguna debe invocar un código de fórmula.
- B. **Motor cifrado**: `dependencies` en `evaluate-function` y símbolos invocados en `validate`. Es aditivo, y el `project-back` actual sigue funcionando.
- C. **`project-back`**: migración de `design_function_dependency` (vacía), registro al guardar, validación de ciclos, aridad, tipo y profundidad, envío del cierre al evaluar, estampado con cierre, baja bloqueada e impacto.
- D. **`project-admin`**: grupo de fórmulas en «Funciones disponibles», errores de composición, dependencias en el detalle y en el impacto.

**Rollback:** cada paso es independiente. `project-front` se revierte con su commit. En el admin, el menú es aditivo. El contrato v2.1.0 añade diagnósticos y un campo opcional: volver a v2.0.0 en un consumidor que lee no cambia ningún dato, pero en `project-back` descartaría las zonas guardadas, así que ahí no se retrocede si ya hay alguna. El motor acepta peticiones con y sin `dependencies`, y la tabla de dependencias se elimina con el `down` de su migración.

## Open Questions

1. **¿Debe el material variar según el elemento?** Si una misma plantilla sirve para aluminio y cobre según el espesor, un ítem fijo no alcanza. La salida identificada es un vínculo calculado: el ítem se resuelve buscando en la tabla con los valores de las condiciones al cargar el diseño. Requiere decidir qué pasa cuando no hay coincidencia o hay varias. Pendiente del responsable del producto; va en un change aparte.
2. **Notas del diseñador.** ¿Hace falta una nota propia del diseño, distinta de la de la plantilla? Hoy nadie la usa: ninguno de los 33 diseños guarda notas.
3. **Procedencia de un diseño.** ¿Se quiere que `sub_design` guarde de qué plantilla y versión viene? Cerraría la protección de solo lectura también en la creación, y permitiría saber qué diseños se hicieron con una plantilla ya superada. Es un cambio de modelo con su propia migración, así que no entra aquí.
4. **Profundidad máxima de 5 niveles** en la composición de fórmulas. Se eligió sin ningún caso real todavía. Confirmar con el responsable del producto si hay algún cálculo que ya se sepa que necesita más.
