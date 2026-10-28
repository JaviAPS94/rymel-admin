## ADDED Requirements

### Requirement: Invocar otras fórmulas desde el editor de expresión

«Funciones disponibles» SHALL incluir, en un grupo propio, las fórmulas activas del mismo tipo que la que se edita, excluyendo a ella misma, cada una con su código, su nombre y sus variables en orden. Insertar una SHALL escribir el código con sus variables como marcadores (`QUADRATIC(x)`), igual que en el editor de plantillas.

El aviso de símbolos sin declarar SHALL reconocer como válidos los códigos de esas fórmulas. Los errores de composición que devuelva el servidor (código inexistente, aridad, ciclo, profundidad) SHALL mostrarse junto a la expresión.

#### Scenario: Insertar una fórmula

- **WHEN** el administrador edita `DOBLE_CUADRADO` y elige `QUADRATIC` en «Funciones disponibles»
- **THEN** se inserta `QUADRATIC(x)` en el cursor

#### Scenario: La propia fórmula no se ofrece

- **WHEN** el administrador edita `QUADRATIC`
- **THEN** `QUADRATIC` no aparece en el grupo de fórmulas

#### Scenario: Ciclo al guardar

- **WHEN** el servidor rechaza la versión por un ciclo
- **THEN** el editor muestra la cadena del ciclo junto a la expresión, sin perder lo escrito

### Requirement: Probador y detalle con fórmulas anidadas

El probador SHALL evaluar una expresión que invoca otras fórmulas, resolviéndolas con sus versiones vigentes. El detalle de una fórmula SHALL mostrar qué fórmulas invoca y cuáles la invocan.

#### Scenario: Probar una composición

- **WHEN** el administrador prueba `y = QUADRATIC(x) * 2` con `x = 3`, y `QUADRATIC(3)` da 16
- **THEN** el probador muestra 32

#### Scenario: Detalle con dependencias

- **WHEN** el administrador abre `QUADRATIC`, invocada por `DOBLE_CUADRADO`
- **THEN** el detalle lista `DOBLE_CUADRADO` entre las fórmulas que la invocan, y enlaza a ella
