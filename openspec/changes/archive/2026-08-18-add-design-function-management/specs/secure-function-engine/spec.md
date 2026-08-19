## ADDED Requirements

### Requirement: Descifrado de expresiones bajo autenticación servicio-a-servicio

El motor cifrado SHALL exponer una operación de descifrado que reciba una expresión cifrada y devuelva su texto plano, para habilitar la edición de fórmulas existentes.

La operación SHALL exigir un secreto compartido servicio-a-servicio en cada petición y SHALL rechazar con 401 toda petición sin él o con un valor incorrecto. La comparación del secreto SHALL hacerse en tiempo constante.

El motor SHALL NOT exponer esta operación a través de ningún camino alcanzable por un cliente de navegador: únicamente project-back la invoca, en nombre de un usuario con rol de administrador.

#### Scenario: Petición autenticada de project-back

- **WHEN** project-back solicita el descifrado de una expresión con el secreto correcto
- **THEN** el motor devuelve la expresión en texto plano

#### Scenario: Petición sin secreto

- **WHEN** llega una petición de descifrado sin el encabezado del secreto compartido
- **THEN** el motor responde 401
- **AND** no revela ninguna parte de la expresión

#### Scenario: Petición con secreto incorrecto

- **WHEN** llega una petición de descifrado con un secreto que no coincide
- **THEN** el motor responde 401
- **AND** el tiempo de respuesta no depende de cuántos caracteres del secreto eran correctos

#### Scenario: Texto cifrado corrupto o ajeno

- **WHEN** se solicita descifrar un valor que no fue producido por este motor
- **THEN** el motor responde con un error de petición inválida
- **AND** el mensaje de error no incluye detalles internos de la criptografía

### Requirement: Validación de expresiones sin cifrar ni persistir

El motor SHALL exponer una operación de validación que reciba una expresión en texto plano y devuelva si es válida, el detalle del error cuando no lo sea, y los símbolos que la expresión realmente usa.

La operación SHALL NOT cifrar, almacenar ni registrar la expresión recibida.

#### Scenario: Expresión válida

- **WHEN** se valida `y = x^2 + CONST_1`
- **THEN** la respuesta indica que es válida
- **AND** enumera `x` y `CONST_1` como símbolos usados

#### Scenario: Expresión con sintaxis inválida

- **WHEN** se valida `y = x^^2`
- **THEN** la respuesta indica que no es válida
- **AND** incluye un mensaje de error que señala el problema de sintaxis

#### Scenario: Expresión sin la forma requerida

- **WHEN** se valida `V = I * R`
- **THEN** la respuesta indica que no es válida
- **AND** el mensaje explica que el lado izquierdo debe ser `y`

### Requirement: Sustitución de constantes por símbolo, no por texto

Al evaluar una expresión, el motor SHALL sustituir las constantes reconociéndolas como símbolos dentro de la expresión analizada. El motor SHALL NOT sustituir constantes mediante reemplazo de subcadenas sobre el texto de la expresión.

#### Scenario: Constantes cuyo nombre es prefijo de otra

- **WHEN** una expresión usa `CONST_1` y `CONST_10`, con valores 4 y 9
- **THEN** cada una se sustituye por su propio valor
- **AND** `CONST_10` no se convierte en el valor de `CONST_1` seguido de un `0`

#### Scenario: Constante cuyo nombre aparece dentro del nombre de una función

- **WHEN** una expresión es `y = cos(x) + c` y se define la constante `c` con valor 2
- **THEN** `cos` permanece intacta como función
- **AND** solo la `c` independiente se sustituye por 2

#### Scenario: Constante declarada pero ausente en la expresión

- **WHEN** se evalúa con una constante que la expresión no usa
- **THEN** la evaluación procede normalmente
- **AND** el resultado no se ve afectado

#### Scenario: Constante con valor no numérico

- **WHEN** se evalúa con una constante cuyo valor no es un número finito
- **THEN** el motor responde con un error de petición inválida indicando cuál constante es

### Requirement: Verificación de la clave de cifrado al arranque

El motor SHALL verificar al iniciar que la clave de cifrado esté definida y tenga la longitud exacta que exige el algoritmo. Si la verificación falla, el motor SHALL abortar el arranque con un mensaje explícito.

El motor SHALL NOT arrancar en un estado en el que la primera petición de cifrado sea la que descubra el problema.

#### Scenario: Clave ausente

- **WHEN** el servicio arranca sin la variable de entorno de la clave de cifrado
- **THEN** el proceso termina con un error que nombra la variable faltante

#### Scenario: Clave de longitud incorrecta

- **WHEN** el servicio arranca con una clave que no mide 32 bytes
- **THEN** el proceso termina con un error que indica la longitud esperada y la recibida

#### Scenario: Clave correcta

- **WHEN** el servicio arranca con una clave válida
- **THEN** el servicio queda disponible y atiende peticiones de cifrado

### Requirement: Auditoría de accesos al texto plano

El motor SHALL registrar cada operación de descifrado atendida, con marca de tiempo, resultado y el identificador de correlación que envíe el servicio llamante. El registro SHALL NOT incluir la expresión en texto plano ni la clave de cifrado.

El motor SHALL NOT registrar el contenido de las expresiones en las operaciones de cifrado, validación ni evaluación.

#### Scenario: Descifrado exitoso

- **WHEN** se atiende una petición de descifrado válida
- **THEN** queda una entrada de auditoría con la marca de tiempo y el identificador de correlación
- **AND** la expresión descifrada no aparece en ningún registro

#### Scenario: Intento rechazado

- **WHEN** se rechaza una petición de descifrado por secreto inválido
- **THEN** queda una entrada de auditoría del intento fallido

#### Scenario: Evaluación normal

- **WHEN** se evalúa una fórmula
- **THEN** los registros del servicio no contienen la expresión ni sus valores intermedios

### Requirement: Compatibilidad del contrato de cifrado y evaluación existente

El motor SHALL conservar el formato de la expresión cifrada ya almacenado en producción, de modo que las fórmulas cifradas con la versión anterior sigan siendo evaluables sin re-cifrado.

Las operaciones de cifrado y evaluación SHALL conservar su ruta y su contrato de entrada y salida actuales.

#### Scenario: Fórmula cifrada antes del cambio

- **WHEN** se evalúa una expresión cifrada existente en la base de datos
- **THEN** el motor la descifra y la evalúa correctamente
- **AND** no se requiere ninguna migración del valor almacenado

#### Scenario: project-back sin actualizar

- **WHEN** una versión anterior de project-back invoca cifrado o evaluación
- **THEN** el motor responde con el mismo contrato que antes del cambio
