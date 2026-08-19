## ADDED Requirements

### Requirement: Sección de fórmulas restringida a administradores

project-admin SHALL ofrecer una sección "Fórmulas" accesible solo para usuarios con rol de administrador, enlazada desde el menú de administración.

Un usuario sin ese rol SHALL NOT ver la entrada de menú ni poder alcanzar la ruta directamente.

#### Scenario: Administrador entra a la sección

- **WHEN** un usuario con rol de administrador abre el menú de administración
- **THEN** ve la entrada "Fórmulas" y puede acceder al listado

#### Scenario: Usuario sin permiso intenta entrar por URL

- **WHEN** un usuario con rol de diseño navega directamente a la ruta de fórmulas
- **THEN** es redirigido y no ve ningún dato de fórmulas

### Requirement: Listado de fórmulas con búsqueda y filtros

La sección SHALL mostrar las fórmulas en un listado paginado con su nombre, código, tipo, versión vigente, cantidad de subtipos asignados y estado de actualización de los diseños que la usan.

El listado SHALL permitir buscar por nombre y código, y filtrar por tipo y por subtipo asignado.

El listado SHALL señalar visualmente las fórmulas cuyo código colisiona con el de otra, para que el administrador pueda resolver los conflictos heredados.

#### Scenario: Búsqueda por código

- **WHEN** el administrador escribe `CUBIC` en la búsqueda
- **THEN** el listado muestra solo las fórmulas cuyo nombre o código coincide

#### Scenario: Filtro por tipo

- **WHEN** el administrador filtra por tipo `COST`
- **THEN** el listado muestra únicamente las fórmulas de costo

#### Scenario: Fórmulas con código en conflicto

- **WHEN** dos fórmulas activas del mismo tipo comparten código o colisionan por sufijo
- **THEN** ambas aparecen marcadas como en conflicto en el listado
- **AND** la marca explica por qué

#### Scenario: Sin resultados

- **WHEN** ninguna fórmula coincide con los filtros
- **THEN** se muestra un estado vacío que lo indica y permite limpiar los filtros

### Requirement: Editor de fórmula con expresión en claro

El editor SHALL mostrar la expresión en texto plano al abrir una fórmula existente, junto con su nombre, código, tipo y descripción.

El editor SHALL indicar de forma visible que la expresión es información confidencial y que su consulta queda registrada.

Si la expresión no puede recuperarse, el editor SHALL permitir editar el resto de los campos e indicar claramente que la expresión no está disponible.

#### Scenario: Se abre una fórmula existente

- **WHEN** el administrador abre una fórmula para editar
- **THEN** ve la expresión en texto plano en el editor
- **AND** ve el aviso de confidencialidad

#### Scenario: La expresión no puede recuperarse

- **WHEN** el servicio de descifrado no responde al abrir el editor
- **THEN** el editor indica que la expresión no está disponible en este momento
- **AND** el administrador puede editar nombre, código, descripción y asignaciones
- **AND** el editor impide guardar un cambio de expresión

### Requirement: Edición estructurada de variables y constantes

El editor SHALL gestionar las variables como una lista ordenada, mostrando explícitamente la posición de cada una y advirtiendo que la posición determina el orden de los argumentos en las hojas.

El editor SHALL gestionar las constantes como pares de nombre y valor numérico, validando el formato del nombre y que el valor sea un número finito.

El editor SHALL contrastar los símbolos usados por la expresión contra las variables y constantes declaradas, y señalar los símbolos no declarados y los declarados sin uso antes de permitir guardar.

#### Scenario: Se declara una variable que la expresión no usa

- **WHEN** la expresión es `y = x^2` y se declara la variable `z`
- **THEN** el editor señala que `z` no se usa
- **AND** permite guardar

#### Scenario: La expresión usa un símbolo no declarado

- **WHEN** la expresión es `y = x^2 + K` y `K` no está declarada
- **THEN** el editor señala el símbolo faltante
- **AND** impide guardar hasta resolverlo

#### Scenario: Se reordena una variable de una fórmula en uso

- **WHEN** el administrador cambia el orden de las variables de una fórmula usada por diseños
- **THEN** el editor advierte el impacto e informa cuántos diseños la usan
- **AND** exige una confirmación explícita antes de publicar

### Requirement: Probador de fórmulas antes de publicar

El editor SHALL ofrecer un probador que evalúe la fórmula con valores de prueba para cada variable, usando las constantes declaradas, y muestre el resultado o el error.

El probador SHALL funcionar tanto sobre una fórmula ya guardada como sobre una expresión en edición todavía no publicada.

El probador SHALL NOT modificar la fórmula almacenada ni afectar a ningún diseño.

#### Scenario: Prueba exitosa

- **WHEN** el administrador ingresa valores para todas las variables y ejecuta la prueba
- **THEN** se muestra el resultado numérico

#### Scenario: Prueba de una expresión no publicada

- **WHEN** el administrador modifica la expresión sin guardar y ejecuta la prueba
- **THEN** el resultado corresponde a la expresión en edición
- **AND** la fórmula almacenada no cambia

#### Scenario: Faltan valores de prueba

- **WHEN** el administrador ejecuta la prueba sin dar valor a alguna variable
- **THEN** el probador señala qué variables faltan y no ejecuta la evaluación

#### Scenario: La expresión produce un error

- **WHEN** la evaluación falla, por ejemplo por una división por cero
- **THEN** el probador muestra el mensaje de error del motor
- **AND** el editor sigue permitiendo corregir la expresión

### Requirement: Alta, edición y baja de fórmulas

El editor SHALL permitir crear una fórmula nueva, publicar una versión nueva de una existente y eliminar una fórmula de forma lógica.

Antes de eliminar, la interfaz SHALL mostrar cuántos subtipos y diseños se ven afectados y SHALL exigir confirmación.

Toda operación SHALL informar su resultado mediante una notificación, tanto en éxito como en error, siguiendo el patrón ya usado en la administración de reglas de código.

#### Scenario: Creación

- **WHEN** el administrador crea una fórmula válida
- **THEN** aparece en el listado con su versión 1
- **AND** se muestra una notificación de éxito

#### Scenario: Código duplicado al crear

- **WHEN** el administrador intenta crear una fórmula con un código que colisiona
- **THEN** el formulario muestra el error del servidor junto al campo de código
- **AND** no se crea la fórmula

#### Scenario: Eliminación con impacto

- **WHEN** el administrador elimina una fórmula asignada a dos subtipos y usada por doce diseños
- **THEN** el diálogo de confirmación muestra ambos números antes de proceder

### Requirement: Asignación de fórmulas a subtipos desde la interfaz

La sección SHALL permitir ver y modificar a qué subtipos de diseño está asignada cada fórmula.

La interfaz SHALL impedir una asignación que provoque colisión de códigos dentro del subtipo y SHALL explicar el motivo.

#### Scenario: Asignación desde el editor

- **WHEN** el administrador asigna la fórmula a un subtipo
- **THEN** el cambio se refleja en el listado y en el conteo de subtipos de esa fórmula

#### Scenario: Asignación que colisiona

- **WHEN** la asignación introduciría dos códigos que colisionan en el mismo subtipo
- **THEN** la interfaz rechaza la operación y nombra ambas fórmulas

### Requirement: Historial de versiones consultable

El editor SHALL mostrar el historial de versiones de la fórmula, con número de versión, fecha, autor y cuál es la vigente, y SHALL permitir consultar la expresión de una versión anterior.

La interfaz SHALL permitir restaurar una versión anterior publicándola como una versión nueva, nunca reescribiendo el historial.

#### Scenario: Consulta del historial

- **WHEN** el administrador abre el historial de una fórmula con tres versiones
- **THEN** ve las tres con su fecha, autor y la marca de cuál está vigente

#### Scenario: Restauración de una versión anterior

- **WHEN** el administrador restaura la versión 1 de una fórmula que va por la versión 3
- **THEN** se publica una versión 4 con el contenido de la versión 1
- **AND** las versiones 1, 2 y 3 se conservan intactas

### Requirement: Panel de diseños desactualizados

La sección SHALL mostrar qué diseños quedaron calculados con una versión que ya no es la vigente, y SHALL permitir lanzar su recálculo desde la propia interfaz.

La interfaz SHALL mostrar el progreso del recálculo y su resultado, distinguiendo los diseños recalculados de los que fallaron y por qué.

#### Scenario: Publicación que desactualiza diseños

- **WHEN** el administrador publica una versión nueva de una fórmula usada por doce sub-diseños
- **THEN** el panel muestra esos doce como desactualizados

#### Scenario: Recálculo desde el panel

- **WHEN** el administrador lanza el recálculo de los diseños desactualizados
- **THEN** la interfaz muestra el avance
- **AND** al terminar informa cuántos se recalcularon y cuántos fallaron

#### Scenario: Recálculo con fallos

- **WHEN** algunos diseños no pueden recalcularse
- **THEN** la interfaz los lista con el motivo
- **AND** esos diseños siguen marcados como desactualizados
