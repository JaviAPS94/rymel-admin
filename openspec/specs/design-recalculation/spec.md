# design-recalculation

## Purpose

El recálculo de los diseños cuando cambia la fórmula de la que dependen.

Un diseño calculado guarda con qué versión de cada fórmula se calculó. Al publicar una versión nueva, los diseños que la usaban quedan marcados como obsoletos y pueden recalcularse por lotes desde el servidor, dejando registro de qué valores cambiaron.

## Requirements

### Requirement: Estampado de versiones en los diseños calculados

Al guardar un sub-diseño, el sistema SHALL registrar con qué versión de cada fórmula se calcularon sus celdas.

El estampado SHALL almacenarse junto al sub-diseño y SHALL NOT alterar la estructura de las celdas ya guardadas ni sus valores.

Los sub-diseños existentes que no tengan estampado SHALL considerarse de versión desconocida y SHALL tratarse como desactualizados.

#### Scenario: Se guarda un diseño nuevo

- **WHEN** un usuario guarda un sub-diseño cuyas celdas invocan dos fórmulas
- **THEN** queda registrado el identificador de versión vigente de cada una de esas dos fórmulas

#### Scenario: Diseño guardado antes del cambio

- **WHEN** se consulta un sub-diseño anterior a esta funcionalidad
- **THEN** aparece como calculado con versión desconocida
- **AND** figura en la lista de desactualizados

#### Scenario: Diseño sin funciones personalizadas

- **WHEN** un sub-diseño no invoca ninguna fórmula de diseño
- **THEN** su estampado queda vacío
- **AND** nunca se marca como desactualizado por publicaciones de fórmulas

### Requirement: Marcado de obsolescencia al publicar una versión

Al publicarse una versión nueva de una fórmula, el sistema SHALL marcar como desactualizados los sub-diseños cuyo estampado indique una versión anterior de esa fórmula.

El marcado SHALL NOT modificar los valores calculados de esos diseños: un diseño desactualizado conserva sus números hasta que se recalcule.

El sistema SHALL evaluar siempre con la versión vigente. Un cálculo nuevo sobre un diseño desactualizado SHALL usar la versión vigente, no la del estampado.

#### Scenario: Publicación que afecta diseños

- **WHEN** se publica la versión 2 de una fórmula usada por doce sub-diseños en versión 1
- **THEN** los doce quedan marcados como desactualizados
- **AND** sus valores almacenados no cambian

#### Scenario: Un diseño ya estaba en la versión vigente

- **WHEN** un sub-diseño se calculó con la versión que sigue siendo la vigente
- **THEN** no se marca como desactualizado

#### Scenario: Se abre un diseño desactualizado

- **WHEN** un usuario abre un diseño marcado como desactualizado y una celda se recalcula
- **THEN** el cálculo usa la versión vigente de la fórmula

### Requirement: Recálculo por lotes desde el servidor

El sistema SHALL poder recalcular un conjunto de sub-diseños desde el servidor, sin intervención de un navegador, usando el motor de fórmulas compartido.

El recálculo SHALL reevaluar las celdas con fórmula respetando el orden de dependencias, SHALL conservar intactos los valores ingresados a mano, y SHALL actualizar el estampado de versiones al terminar.

El recálculo SHALL ser transaccional por sub-diseño: si falla la reevaluación de un sub-diseño, ese sub-diseño SHALL quedar exactamente como estaba y el lote SHALL continuar con los demás.

#### Scenario: Recálculo exitoso de un lote

- **WHEN** se recalculan doce sub-diseños desactualizados
- **THEN** sus celdas con fórmula quedan con los valores de la versión vigente
- **AND** sus celdas de entrada manual conservan su valor
- **AND** los doce dejan de estar marcados como desactualizados

#### Scenario: Un sub-diseño del lote falla

- **WHEN** uno de los sub-diseños contiene una fórmula que ya no puede resolverse
- **THEN** ese sub-diseño conserva íntegros sus valores anteriores y sigue marcado como desactualizado
- **AND** los demás del lote se recalculan normalmente
- **AND** el resultado del lote informa cuál falló y por qué

#### Scenario: El motor cifrado no está disponible

- **WHEN** el servicio de evaluación no responde durante un recálculo
- **THEN** el lote se detiene sin dejar sub-diseños parcialmente escritos
- **AND** se informa el motivo

#### Scenario: Recálculo sin cambios de valor

- **WHEN** se recalcula un sub-diseño y todos los resultados coinciden con los almacenados
- **THEN** el sub-diseño deja de estar marcado como desactualizado
- **AND** se informa que no hubo cambios de valor

### Requirement: Registro de los cambios producidos por un recálculo

El sistema SHALL registrar, por cada sub-diseño recalculado, qué celdas cambiaron de valor, con su valor anterior y el nuevo, y qué fórmulas motivaron el recálculo.

Ese registro SHALL conservarse para que la interfaz pueda mostrarle al usuario qué cambió y por qué.

#### Scenario: Recálculo con cambios

- **WHEN** un recálculo modifica cuatro celdas de un sub-diseño
- **THEN** queda registrado el valor anterior y el nuevo de cada una
- **AND** queda registrado qué fórmula y qué versión provocaron el cambio

#### Scenario: Consulta posterior

- **WHEN** se consulta el último recálculo de un sub-diseño
- **THEN** se obtiene la lista de celdas afectadas y las fórmulas responsables

### Requirement: Aviso en la hoja de que sus valores fueron recalculados

Cuando un usuario abra en project-front un diseño cuyos valores fueron modificados por un recálculo de fórmulas, la hoja SHALL mostrar un aviso visible indicando que ciertos valores se actualizaron por un cambio de fórmulas.

El aviso SHALL permitir ver qué celdas cambiaron y qué fórmulas lo motivaron.

El aviso SHALL poder descartarse, y SHALL NOT reaparecer para ese usuario y ese recálculo una vez descartado.

#### Scenario: El usuario abre un diseño recalculado

- **WHEN** un usuario abre un diseño cuyos valores cambiaron por el recálculo de una fórmula
- **THEN** la hoja muestra el aviso de que ciertos valores se actualizaron
- **AND** el aviso identifica las fórmulas responsables

#### Scenario: El usuario consulta el detalle

- **WHEN** el usuario abre el detalle del aviso
- **THEN** ve las celdas afectadas con su valor anterior y el actual

#### Scenario: El usuario descarta el aviso

- **WHEN** el usuario descarta el aviso y vuelve a abrir el mismo diseño
- **THEN** el aviso no reaparece para ese recálculo

#### Scenario: Un recálculo posterior

- **WHEN** el diseño se recalcula otra vez después de que el usuario descartó el aviso anterior
- **THEN** se muestra un aviso nuevo correspondiente al recálculo más reciente

#### Scenario: Diseño desactualizado pero aún no recalculado

- **WHEN** el usuario abre un diseño marcado como desactualizado que todavía no fue recalculado
- **THEN** la hoja indica que fue calculado con una versión anterior de las fórmulas
- **AND** sus valores mostrados siguen siendo los almacenados

### Requirement: Verificación en sombra antes de sustituir el evaluador

Antes de que project-front adopte el motor de fórmulas compartido en lugar de su evaluador actual, el sistema SHALL reevaluar con el motor nuevo la totalidad de los sub-diseños almacenados y comparar cada valor calculado contra el valor guardado.

Toda divergencia SHALL quedar documentada y explicada, atribuyéndola a un defecto del motor nuevo o a un valor previamente incorrecto, antes de habilitar el motor nuevo en project-front.

#### Scenario: Ejecución de la verificación

- **WHEN** se ejecuta la verificación sobre los sub-diseños almacenados
- **THEN** se produce un reporte con el total de celdas comparadas, las coincidentes y las divergentes
- **AND** cada divergencia identifica el sub-diseño, la celda, el valor guardado y el nuevo

#### Scenario: Divergencias sin explicar

- **WHEN** el reporte contiene divergencias que no han sido clasificadas
- **THEN** la sustitución del evaluador en project-front no se habilita

#### Scenario: Verificación sin divergencias

- **WHEN** el reporte no muestra divergencias, o todas están clasificadas como valores previamente incorrectos
- **THEN** se habilita la sustitución del evaluador
