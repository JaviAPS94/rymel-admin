## MODIFIED Requirements

### Requirement: Estampado de versiones en los diseños calculados

Al guardar un sub-diseño, el sistema SHALL registrar con qué versión de cada fórmula se calcularon sus celdas.

El estampado SHALL incluir, además de las fórmulas invocadas desde las celdas, todas las que esas fórmulas invocan directa o indirectamente, con la versión vigente de cada una en el momento del cálculo.

El estampado SHALL almacenarse junto al sub-diseño y SHALL NOT alterar la estructura de las celdas ya guardadas ni sus valores.

Los sub-diseños existentes que no tengan estampado SHALL considerarse de versión desconocida y SHALL tratarse como desactualizados.

#### Scenario: Se guarda un diseño nuevo

- **WHEN** un usuario guarda un sub-diseño cuyas celdas invocan dos fórmulas
- **THEN** queda registrado el identificador de versión vigente de cada una de esas dos fórmulas

#### Scenario: Fórmula que invoca a otra

- **WHEN** un usuario guarda un sub-diseño cuyas celdas invocan `DOBLE_CUADRADO`, que invoca `QUADRATIC`
- **THEN** quedan registradas las versiones vigentes de `DOBLE_CUADRADO` y de `QUADRATIC`

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

Como el estampado incluye las fórmulas invocadas indirectamente, publicar una versión de una fórmula SHALL marcar también los sub-diseños que la usan solo a través de otra.

El marcado SHALL NOT modificar los valores calculados de esos diseños: un diseño desactualizado conserva sus números hasta que se recalcule.

El sistema SHALL evaluar siempre con la versión vigente. Un cálculo nuevo sobre un diseño desactualizado SHALL usar la versión vigente, no la del estampado.

#### Scenario: Publicación que afecta diseños

- **WHEN** se publica la versión 2 de una fórmula usada por doce sub-diseños en versión 1
- **THEN** los doce quedan marcados como desactualizados
- **AND** sus valores almacenados no cambian

#### Scenario: Publicación de una fórmula invocada

- **WHEN** se publica una versión nueva de `QUADRATIC`, que ninguna hoja invoca directamente pero sí `DOBLE_CUADRADO`, usada en tres sub-diseños
- **THEN** los tres sub-diseños quedan marcados como desactualizados

#### Scenario: Un diseño ya estaba en la versión vigente

- **WHEN** un sub-diseño se calculó con la versión que sigue siendo la vigente
- **THEN** no se marca como desactualizado

#### Scenario: Se abre un diseño desactualizado

- **WHEN** un usuario abre un diseño marcado como desactualizado y una celda se recalcula
- **THEN** el cálculo usa la versión vigente de la fórmula
