## ADDED Requirements

### Requirement: Evaluación con fórmulas dependientes

`evaluate-function` SHALL aceptar un campo opcional `dependencies`: un mapa de código a `{ encryptedFunction, variables, constants }`. El motor SHALL descifrar cada dependencia y ponerla a disposición de la expresión como una función de `mathjs` con ese nombre, cuyos argumentos se asignan a sus variables en el orden declarado.

El texto plano de la expresión y de sus dependencias SHALL NOT salir del motor, y SHALL NOT registrarse en el log.

El motor SHALL rechazar la evaluación, sin evaluar, si detecta un ciclo entre las dependencias o si el anidamiento supera 5 niveles. Una dependencia invocada con un número de argumentos distinto del de sus variables SHALL producir un error que nombre la dependencia.

Sin `dependencies`, el comportamiento SHALL ser idéntico al actual.

#### Scenario: Evaluación anidada

- **WHEN** se evalúa `y = QUADRATIC(x) * 2` con `x = 3` y `dependencies` contiene `QUADRATIC` con `y = x^2 + 2*x + 1`
- **THEN** el resultado es 32

#### Scenario: Dependencia que a su vez depende de otra

- **WHEN** `A` invoca a `B` y `B` invoca a `C`, y las tres llegan en la petición
- **THEN** el motor resuelve `C` dentro de `B` y `B` dentro de `A`

#### Scenario: Dependencia ausente

- **WHEN** la expresión invoca `QUADRATIC` y `dependencies` no la incluye
- **THEN** el motor responde con el error «Undefined function» actual, nombrando `QUADRATIC`

#### Scenario: Petición sin dependencias

- **WHEN** una versión de `project-back` sin actualizar llama sin `dependencies`
- **THEN** la respuesta es la misma que antes del cambio

### Requirement: La validación informa de las fórmulas invocadas

`validate` SHALL devolver, además del resultado actual, la lista de símbolos que la expresión invoca como función y que no son funciones de `mathjs` (`formulas`), y cada una de esas invocaciones con cuántos argumentos recibe (`formulaCalls`). Es lo que `project-back` usa para registrar dependencias y comprobar la aridad, sin tener que leer el texto plano.

El motor SHALL ofrecer además el mismo análisis sobre una expresión **cifrada** (`POST /function-engine/invoked-formulas`), protegido por el secreto servicio-a-servicio, sin devolver su texto. Lo usan la restauración de una versión, que copia la expresión cifrada, y la comprobación previa de las versiones ya guardadas.

#### Scenario: Símbolos invocados

- **WHEN** se valida `y = QUADRATIC(x) + sqrt(CUBIC(x))`
- **THEN** la respuesta incluye `["QUADRATIC", "CUBIC"]` y no incluye `sqrt`

#### Scenario: Sin invocaciones

- **WHEN** se valida `y = x^2 + 1`
- **THEN** la lista de símbolos invocados está vacía

#### Scenario: Aridad de cada invocación

- **WHEN** se valida `y = RESTA(x, 1) + QUADRATIC(x)`
- **THEN** `formulaCalls` es `[{ name: "RESTA", argCount: 2 }, { name: "QUADRATIC", argCount: 1 }]`

#### Scenario: Expresión cifrada

- **WHEN** `project-back` pide las fórmulas invocadas de una versión guardada
- **THEN** el motor las devuelve con su aridad y la respuesta no contiene ninguna parte del texto de la expresión
