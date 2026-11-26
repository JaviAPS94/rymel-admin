# semi-finished-catalog Specification

## Purpose
Catálogo de semielaborados (los nodos del árbol de las estructuras, las zonas de la plantilla y el destino de los accesorios de la norma): alta, edición, consulta y baja lógica desde el admin, con código único entre los activos y sin poder retirar los que usa una estructura activa.
## Requirements
### Requirement: Listar semielaborados activos
El sistema SHALL devolver en `GET /semi-finished` solo los semielaborados sin `deleted_at`, con `id`, `code` y `name`, ordenados por código, para los roles `ADMIN`, `DESIGN` y `NORM`.

#### Scenario: Los eliminados no aparecen
- **WHEN** existe un semielaborado con `deleted_at` informado
- **THEN** `GET /semi-finished` no lo incluye

#### Scenario: Forma compatible con los consumidores actuales
- **WHEN** el cliente o el admin piden `GET /semi-finished`
- **THEN** reciben un arreglo de objetos con `id`, `code` y `name`

### Requirement: Listado de administración con uso
El sistema SHALL ofrecer a `ADMIN` un listado de semielaborados activos que incluya, por cada uno, cuántas estructuras activas lo tienen en su árbol (`bomCount`).

#### Scenario: Semielaborado usado en dos estructuras
- **WHEN** un semielaborado aparece en nodos activos de dos estructuras activas distintas
- **THEN** su `bomCount` es 2

#### Scenario: Semielaborado sin uso
- **WHEN** ningún nodo activo de una estructura activa lo referencia
- **THEN** su `bomCount` es 0

### Requirement: Crear semielaborado
El sistema SHALL permitir a `ADMIN` crear un semielaborado con `code` y `name` obligatorios (recortados, no vacíos, hasta 255 caracteres).

#### Scenario: Alta válida
- **WHEN** un `ADMIN` envía `POST /semi-finished` con código y nombre válidos
- **THEN** el sistema lo guarda y responde `201` con el semielaborado creado

#### Scenario: Campos vacíos
- **WHEN** el código o el nombre llegan vacíos o solo con espacios
- **THEN** el sistema responde `400` y no guarda nada

#### Scenario: Rol sin permiso
- **WHEN** un usuario sin rol `ADMIN` intenta crear
- **THEN** el sistema responde `403`

### Requirement: Código único entre activos
El sistema SHALL rechazar con `409` crear o editar un semielaborado cuyo código, sin distinguir mayúsculas ni espacios al inicio o fin, ya pertenezca a otro semielaborado activo. Un código de un semielaborado eliminado SHALL poder reutilizarse.

#### Scenario: Código repetido al crear
- **WHEN** existe el activo `SE-01` y se crea otro con `se-01 `
- **THEN** el sistema responde `409` con un mensaje que nombra el código

#### Scenario: Editar conservando su propio código
- **WHEN** se edita el nombre de `SE-01` sin cambiar su código
- **THEN** el sistema acepta el cambio

#### Scenario: Reutilizar código de un eliminado
- **WHEN** `SE-01` fue eliminado y se crea uno nuevo con `SE-01`
- **THEN** el sistema lo crea

### Requirement: Editar semielaborado
El sistema SHALL permitir a `ADMIN` cambiar el código y/o el nombre de un semielaborado activo con `PATCH /semi-finished/:id`, con las mismas validaciones que el alta.

#### Scenario: Edición válida
- **WHEN** un `ADMIN` cambia el nombre de un semielaborado activo
- **THEN** el sistema guarda el cambio y lo devuelve actualizado

#### Scenario: Semielaborado inexistente o eliminado
- **WHEN** se edita un id que no existe o está eliminado
- **THEN** el sistema responde `404`

### Requirement: Eliminar semielaborado sin uso
El sistema SHALL permitir a `ADMIN` eliminar lógicamente (`deleted_at`) un semielaborado que no esté en el árbol de ninguna estructura activa, y SHALL rechazar con `409` la eliminación de uno que sí lo esté, indicando los códigos de esas estructuras.

#### Scenario: Eliminar uno sin uso
- **WHEN** un `ADMIN` elimina un semielaborado con `bomCount` 0
- **THEN** el sistema marca `deleted_at`, responde `204` y deja de listarlo

#### Scenario: Eliminar uno en uso
- **WHEN** un `ADMIN` elimina un semielaborado presente en la estructura `PT: 1FCV`
- **THEN** el sistema responde `409` con un mensaje que incluye `PT: 1FCV` y no lo elimina

### Requirement: Sección Semielaborados en el admin
El admin SHALL ofrecer a `ADMIN` la página `/semi-finished`, enlazada desde «Catálogos», con la tabla de semielaborados (código, nombre, estructuras que lo usan, acciones), búsqueda por código o nombre y paginación de 10 filas.

#### Scenario: Acceso de un administrador
- **WHEN** un `ADMIN` abre «Catálogos → Semielaborados»
- **THEN** ve la tabla con el total de registros

#### Scenario: Acceso sin rol
- **WHEN** un usuario sin rol `ADMIN` abre `/semi-finished`
- **THEN** no ve la página y el menú no muestra el enlace

#### Scenario: Búsqueda
- **WHEN** el usuario escribe `bob` en la búsqueda
- **THEN** la tabla muestra solo los semielaborados cuyo código o nombre contiene `bob`, sin distinguir mayúsculas ni tildes, y vuelve a la página 1

### Requirement: Formulario de alta y edición en el admin
El admin SHALL abrir un modal con código y nombre para crear o editar, validar que ambos estén llenos antes de enviar y mostrar en el campo de código el error de código repetido que devuelve el servidor.

#### Scenario: Crear desde el admin
- **WHEN** el usuario completa el modal y pulsa «Crear»
- **THEN** el modal se cierra, aparece un aviso de éxito y la fila nueva está en la tabla

#### Scenario: Código repetido
- **WHEN** el servidor responde `409` al guardar
- **THEN** el modal sigue abierto y el campo código muestra el mensaje del servidor

### Requirement: Eliminación con confirmación en el admin
El admin SHALL pedir confirmación antes de eliminar, advertir en la confirmación cuando el semielaborado se usa en estructuras y mostrar el mensaje del servidor si la eliminación es rechazada.

#### Scenario: Confirmar eliminación
- **WHEN** el usuario confirma eliminar un semielaborado sin uso
- **THEN** la fila desaparece y aparece un aviso de éxito

#### Scenario: Eliminación rechazada
- **WHEN** el servidor responde `409`
- **THEN** el admin muestra el mensaje con las estructuras que lo usan y la fila sigue en la tabla

### Requirement: Selectores al día
El admin SHALL invalidar las consultas de semielaborados que usan el editor de estructuras y las zonas de la plantilla después de crear, editar o eliminar.

#### Scenario: Nuevo semielaborado disponible en el árbol
- **WHEN** se crea un semielaborado y luego se abre el editor de una estructura
- **THEN** el nuevo semielaborado aparece en el selector de nodos sin recargar la página

