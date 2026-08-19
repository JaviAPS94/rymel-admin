## ADDED Requirements

### Requirement: Separación entre identidad y versión de una fórmula

Una fórmula de diseño SHALL tener una identidad estable (nombre, código, tipo y descripción) y un historial de versiones. Cada versión SHALL contener la expresión cifrada, la lista ordenada de variables y el mapa de constantes vigentes en el momento de publicarla.

Exactamente una versión de cada fórmula SHALL estar marcada como vigente. La expresión, las variables y las constantes SHALL NOT almacenarse en el registro de identidad.

Las versiones publicadas SHALL ser inmutables: una corrección SHALL producir una versión nueva, nunca modificar una existente.

#### Scenario: Se publica un cambio de expresión

- **WHEN** un administrador cambia la expresión de una fórmula que está en la versión 1
- **THEN** se crea la versión 2 con la nueva expresión cifrada
- **AND** la versión 2 queda marcada como vigente
- **AND** la versión 1 se conserva íntegra y deja de ser la vigente

#### Scenario: Se consulta el historial

- **WHEN** se pide el historial de una fórmula con tres versiones
- **THEN** se listan las tres, con su número, fecha de publicación, autor y cuál es la vigente

#### Scenario: Se intenta modificar una versión publicada

- **WHEN** se intenta alterar la expresión de una versión que ya no es la vigente
- **THEN** la operación se rechaza

#### Scenario: Migración de las fórmulas existentes

- **WHEN** se aplica la migración sobre la base de datos actual
- **THEN** cada una de las 6 fórmulas existentes conserva su identificador
- **AND** su expresión, variables y constantes actuales quedan como su versión 1 vigente
- **AND** ninguna evaluación existente cambia de resultado por efecto de la migración

### Requirement: Unicidad y no-colisión del código de invocación

El código de una fórmula es el nombre con el que se la invoca desde una hoja de cálculo. El sistema SHALL exigir que el código sea único entre las fórmulas activas del mismo tipo.

El sistema SHALL rechazar un código que sea sufijo de otro código existente del mismo tipo, o del que otro código existente sea sufijo, porque esa combinación hace ambigua la resolución en las hojas.

El código SHALL estar compuesto solo por letras mayúsculas, dígitos y guiones bajos, y SHALL comenzar por una letra.

#### Scenario: Código duplicado

- **WHEN** se intenta crear una fórmula de tipo `DESIGN` con el código `CUBIC` y ya existe otra activa con ese código y tipo
- **THEN** la operación se rechaza indicando cuál fórmula ya lo usa

#### Scenario: Código que es sufijo de otro

- **WHEN** existe la fórmula `ASSOCIATE_COST` y se intenta crear una con código `COST` del mismo tipo
- **THEN** la operación se rechaza explicando la ambigüedad de resolución

#### Scenario: Código con caracteres no permitidos

- **WHEN** se intenta usar el código `costo-total` o `2COST`
- **THEN** la operación se rechaza indicando el formato admitido

#### Scenario: Los duplicados que ya existen en producción

- **WHEN** se aplica la migración y se detectan los códigos `CUBIC` y `QUADRATIC` duplicados
- **THEN** la migración no se pierde datos ni borra fórmulas
- **AND** las fórmulas en conflicto quedan señaladas para que un administrador las resuelva
- **AND** el sistema impide crear conflictos nuevos desde ese momento

### Requirement: El orden de las variables es contrato

Las hojas de cálculo invocan las fórmulas con argumentos posicionales. El sistema SHALL conservar el orden declarado de las variables y SHALL tratar cualquier alteración de ese orden, o la eliminación de una variable, como un cambio incompatible.

Ante un cambio incompatible en las variables, el sistema SHALL advertir explícitamente cuántos diseños usan la fórmula antes de permitir la publicación.

Los nombres de variable SHALL ser únicos dentro de una fórmula y SHALL NOT colisionar con los nombres de las constantes de la misma fórmula.

#### Scenario: Se reordenan las variables

- **WHEN** una fórmula declara `x,c,d` y se intenta publicar una versión con `c,x,d`
- **THEN** el sistema advierte que el cambio altera el significado de las invocaciones existentes
- **AND** informa cuántos diseños contienen celdas que invocan esa fórmula
- **AND** la publicación requiere una confirmación explícita

#### Scenario: Se elimina una variable

- **WHEN** una fórmula declara `x,c,d` y se intenta publicar con `x,c`
- **THEN** el sistema advierte que las invocaciones con tres argumentos quedarán en error

#### Scenario: Se agrega una variable al final

- **WHEN** una fórmula declara `x` y se publica con `x,y`
- **THEN** el sistema advierte que las invocaciones existentes con un solo argumento quedarán incompletas

#### Scenario: Nombre de variable que colisiona con una constante

- **WHEN** se declara la variable `c` y la constante `c` en la misma fórmula
- **THEN** la operación se rechaza

### Requirement: Validación de constantes

Las constantes de una fórmula SHALL declararse como pares de nombre y valor numérico finito. El nombre SHALL estar compuesto por letras mayúsculas, dígitos y guiones bajos, y SHALL comenzar por una letra.

El sistema SHALL rechazar la publicación si la expresión usa un símbolo que no está declarado como variable ni como constante.

#### Scenario: Constante con valor no numérico

- **WHEN** se declara una constante con valor vacío, textual o infinito
- **THEN** la operación se rechaza señalando la constante

#### Scenario: Símbolo no declarado en la expresión

- **WHEN** la expresión es `y = x^2 + K` y `K` no está declarada ni como variable ni como constante
- **THEN** la publicación se rechaza indicando el símbolo no declarado

#### Scenario: Constante declarada y no usada

- **WHEN** se declara una constante que la expresión no menciona
- **THEN** el sistema advierte que no se usa
- **AND** permite publicar

### Requirement: Administración de fórmulas por API

El sistema SHALL exponer operaciones para listar fórmulas con filtros por tipo, texto de búsqueda sobre nombre y código, subtipo asignado y estado; obtener el detalle de una fórmula con su versión vigente; crear; publicar una versión nueva; eliminar de forma lógica; y consultar el historial de versiones.

Todas las operaciones de administración SHALL requerir rol de administrador. La evaluación de fórmulas SHALL seguir disponible para los roles que hoy la usan.

El listado SHALL ser paginado y SHALL NOT incluir la expresión de ninguna fórmula.

#### Scenario: Listado filtrado

- **WHEN** un administrador lista las fórmulas filtrando por tipo `COST`
- **THEN** recibe solo las fórmulas de ese tipo, paginadas
- **AND** ningún elemento del listado incluye la expresión, ni cifrada ni en claro

#### Scenario: Usuario sin rol de administrador

- **WHEN** un usuario con rol de diseño intenta listar o editar fórmulas
- **THEN** la petición se rechaza por falta de permisos
- **AND** ese mismo usuario sigue pudiendo evaluar fórmulas desde una hoja

#### Scenario: Eliminación lógica

- **WHEN** un administrador elimina una fórmula
- **THEN** la fórmula deja de aparecer en los listados y de estar disponible en las hojas
- **AND** su registro y sus versiones se conservan
- **AND** los diseños que la usaban conservan sus valores ya calculados

#### Scenario: Eliminación de una fórmula en uso

- **WHEN** se intenta eliminar una fórmula asignada a subtipos o usada por diseños
- **THEN** el sistema informa cuántos subtipos y diseños se ven afectados
- **AND** la eliminación requiere confirmación explícita

### Requirement: Acceso al texto plano restringido y auditado

El sistema SHALL exponer la expresión en texto plano únicamente a usuarios con rol de administrador, y únicamente al solicitar el detalle de una fórmula para editarla.

Cada acceso al texto plano SHALL quedar registrado con el usuario, la fórmula, la versión y la marca de tiempo.

El sistema SHALL NOT incluir la expresión en texto plano en los listados, en las respuestas de evaluación, ni en ninguna respuesta dirigida a project-front.

#### Scenario: Administrador abre una fórmula para editar

- **WHEN** un administrador pide el detalle de edición de una fórmula
- **THEN** recibe la expresión en texto plano
- **AND** queda registrado el acceso con su usuario y la marca de tiempo

#### Scenario: La hoja de cálculo pide las fórmulas de un subtipo

- **WHEN** project-front consulta las fórmulas asociadas a un subtipo
- **THEN** recibe identificador, nombre, código, tipo, variables y descripción
- **AND** no recibe la expresión en ninguna forma

#### Scenario: El motor cifrado no está disponible

- **WHEN** se pide el detalle de edición y el servicio de descifrado no responde
- **THEN** el sistema responde con un error que indica que la expresión no pudo recuperarse
- **AND** el resto de los datos de la fórmula sigue siendo consultable y editable

### Requirement: Asignación de fórmulas a subtipos de diseño

El sistema SHALL permitir asignar y desasignar fórmulas a subtipos de diseño, y consultar qué fórmulas tiene asignadas un subtipo.

El sistema SHALL rechazar una asignación que introduzca, dentro del mismo subtipo y tipo, dos fórmulas con códigos que colisionen entre sí.

#### Scenario: Asignación válida

- **WHEN** un administrador asigna una fórmula a un subtipo que no la tenía
- **THEN** la fórmula queda disponible para las hojas de ese subtipo

#### Scenario: Asignación que provoca colisión de códigos

- **WHEN** se intenta asignar a un subtipo una fórmula cuyo código colisiona con otra ya asignada del mismo tipo
- **THEN** la operación se rechaza nombrando ambas fórmulas

#### Scenario: Desasignación

- **WHEN** se desasigna una fórmula de un subtipo
- **THEN** deja de ofrecerse en las hojas de ese subtipo
- **AND** los diseños ya guardados conservan sus valores calculados

### Requirement: Consulta de impacto de una fórmula

El sistema SHALL informar, para una fórmula dada, a qué subtipos está asignada, cuántos diseños y sub-diseños contienen celdas que la invocan, y cuántos de ellos están calculados con una versión que ya no es la vigente.

#### Scenario: Consulta antes de editar

- **WHEN** un administrador consulta el impacto de una fórmula
- **THEN** recibe el número de subtipos asignados, el de diseños afectados y el de diseños desactualizados

#### Scenario: Fórmula sin uso

- **WHEN** se consulta el impacto de una fórmula recién creada y sin asignar
- **THEN** todos los conteos son cero
