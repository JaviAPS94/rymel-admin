## ADDED Requirements

### Requirement: El diseñador evalúa con un motor que entiende las plantillas reales

`project-front` SHALL consumir una versión de `@rymel/formula-engine` que admita el separador `;`, los rangos calificados en ambos extremos y las celdas de gráfico.

Al cargar una plantilla, ninguna celda SHALL quedar en error por una de esas tres razones.

#### Scenario: Fórmula escrita con la convención regional

- **WHEN** un diseñador carga una plantilla cuya celda contiene `=G14*(VLOOKUP(G13;Tablas!B3:Tablas!C10;2;TRUE))`
- **THEN** la celda muestra su resultado y no un error de fórmula

#### Scenario: El dibujo sobrevive al recálculo

- **WHEN** se carga una plantilla con una celda `DRAW:BOBINADO:...` y la hoja se recalcula
- **THEN** la celda sigue mostrando su dibujo

#### Scenario: Cambio dentro de un rango consultado

- **WHEN** cambia una celda interior de un rango calificado que otra hoja consulta
- **THEN** la celda que lo consulta se recalcula

### Requirement: La carga de una plantilla usa el contrato compartido

`project-front` SHALL obtener las hojas de una plantilla a través de `@rymel/design-template`, y SHALL NOT interpretar por su cuenta la forma persistida.

`project-front` SHALL NOT leer los campos obsoletos `templateHiddenRows`, `templateHiddenColumns` ni `value` una vez adoptado el contrato.

#### Scenario: Filas ocultas de la plantilla

- **WHEN** un diseñador carga una plantilla cuyo autor ocultó filas de cálculo intermedio
- **THEN** esas filas no se ven

#### Scenario: Celda de gráfico sin el signo igual

- **WHEN** la plantilla trae una celda cuyo contenido es `DRAW:FRONTAL:NUCLEO:H53,H54`
- **THEN** el dibujo se resuelve a partir del propio contenido, sin depender de ningún valor calculado persistido

#### Scenario: Plantilla sin los campos espejo

- **WHEN** se carga una plantilla guardada sin `templateHiddenRows` ni `value`
- **THEN** se carga completa, con sus filas ocultas y sus celdas de gráfico

### Requirement: El estado de ocultamiento del diseñador es suyo y no viaja a la plantilla

`project-front` SHALL distinguir lo que la plantilla oculta de lo que el diseñador oculta durante su sesión.

Lo que el diseñador oculte SHALL NOT persistirse como parte de la plantilla ni afectar a lo que vea otro diseñador.

#### Scenario: El diseñador oculta una columna

- **WHEN** un diseñador oculta una columna mientras trabaja y guarda su diseño
- **THEN** la plantilla no cambia, y otro diseñador que la cargue sigue viendo esa columna

#### Scenario: Ocultamiento de la plantilla frente al del diseñador

- **WHEN** un diseñador muestra una fila que la plantilla ocultaba
- **THEN** el cambio vale para su sesión y no altera la plantilla

### Requirement: Paridad verificada antes de conmutar la carga

Antes de sustituir la carga actual por la del contrato, SHALL comprobarse que ambas producen las mismas hojas para las plantillas existentes: mismas celdas con el mismo contenido, mismos estilos, mismas regiones y mismos valores calculados.

Toda diferencia SHALL quedar explicada antes de conmutar, o la conmutación SHALL detenerse.

#### Scenario: Comparación sobre la plantilla real

- **WHEN** se cargan las plantillas existentes por las dos vías
- **THEN** se obtiene un informe de diferencias por hoja y por celda

#### Scenario: Diferencia sin explicar

- **WHEN** la comparación encuentra una diferencia que no corresponde a una corrección conocida
- **THEN** la conmutación no se realiza

### Requirement: Retirada de los campos espejo

Los campos obsoletos `templateHiddenRows`, `templateHiddenColumns`, `value` y `catalogSheetId` SHALL dejar de escribirse **solo** cuando `project-front` y `project-back` consuman el contrato y las plantillas guardadas se hayan reescrito con él.

La retirada SHALL ser un cambio de versión mayor del contrato.

Mientras algún consumidor siga leyéndolos, el serializador SHALL seguir escribiéndolos.

#### Scenario: Retirada prematura

- **WHEN** se intenta dejar de escribir los campos espejo con `project-front` aún sin adoptar el contrato
- **THEN** la retirada no se realiza

#### Scenario: Retirada completa

- **WHEN** los tres consumidores usan el contrato y las plantillas están reescritas
- **THEN** el serializador deja de escribir los campos espejo y el contrato sube de versión mayor

### Requirement: El diseñador sigue siendo el dueño de su propia interfaz

La adopción del contrato SHALL limitarse a los tipos, la carga y la serialización.

`project-front` SHALL conservar su rejilla, su edición y su forma de guardar un diseño. No se comparte interfaz entre el diseñador y el editor de plantillas.

#### Scenario: Alcance de la adopción

- **WHEN** se adopta el contrato en `project-front`
- **THEN** cambia de dónde salen los datos de la plantilla, y no cómo se dibuja ni cómo se edita la hoja

#### Scenario: Guardado de un diseño

- **WHEN** un diseñador guarda su diseño
- **THEN** se guarda como hasta ahora, con sus hojas copiadas dentro del diseño, y la plantilla no se toca
