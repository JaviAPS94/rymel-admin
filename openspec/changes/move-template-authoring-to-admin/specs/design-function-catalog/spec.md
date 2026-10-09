## ADDED Requirements

### Requirement: Una fórmula puede invocar a otra fórmula

La expresión de una fórmula SHALL poder invocar otra fórmula activa del **mismo tipo** por su código, con cualquier expresión como argumento: `y = QUADRATIC(x + 1) * k`.

Al guardar una versión, el sistema SHALL obtener del motor cifrado los códigos que invoca la expresión, y SHALL rechazar la versión si:

- invoca un código que no corresponde a ninguna fórmula activa de su tipo;
- invoca una fórmula con un número de argumentos distinto del de sus variables;
- crea un ciclo, directo (`A` invoca `A`) o indirecto (`A → B → A`), contando las versiones vigentes de las demás;
- supera una profundidad de anidamiento de **5** niveles.

Cada rechazo SHALL nombrar la fórmula y el motivo, y en un ciclo SHALL mostrar la cadena completa.

#### Scenario: Composición válida

- **WHEN** un administrador guarda `DOBLE_CUADRADO` con `y = QUADRATIC(x) * 2`, y `QUADRATIC` es de tipo `DESIGN` con una variable
- **THEN** la versión se guarda con una dependencia hacia `QUADRATIC`

#### Scenario: Código inexistente

- **WHEN** la expresión invoca `QUADRATICA(x)` y no existe esa fórmula
- **THEN** la versión se rechaza indicando que `QUADRATICA` no es una fórmula activa de tipo `DESIGN`

#### Scenario: Aridad incorrecta

- **WHEN** la expresión invoca `QUADRATIC(x, y)` y `QUADRATIC` declara una variable
- **THEN** la versión se rechaza indicando cuántos argumentos espera

#### Scenario: Ciclo indirecto

- **WHEN** `B` invoca a `A`, y se guarda una versión de `A` que invoca a `B`
- **THEN** la versión se rechaza mostrando `A → B → A`

#### Scenario: Tipo distinto

- **WHEN** una fórmula de tipo `COST` invoca a `QUADRATIC`, de tipo `DESIGN`
- **THEN** la versión se rechaza

### Requirement: Dependencias registradas por versión

El sistema SHALL guardar, para cada versión de una fórmula, las fórmulas que invoca. La dependencia SHALL apuntar a la fórmula (su identidad) y no a una versión concreta: al evaluar se usa siempre la versión vigente de cada una, igual que con la fórmula invocada desde una hoja.

Las versiones guardadas antes de este cambio SHALL registrarse sin dependencias, después de comprobar con el motor que efectivamente no invocan ninguna fórmula.

#### Scenario: Nueva versión cambia sus dependencias

- **WHEN** la versión 2 de `A` deja de invocar a `B` y pasa a invocar a `C`
- **THEN** la versión 2 depende solo de `C`, y la versión 1 conserva su dependencia de `B`

#### Scenario: Versiones existentes

- **WHEN** se aplica la migración sobre las 5 fórmulas activas
- **THEN** ninguna queda con dependencias, y la comprobación contra el motor lo confirma

### Requirement: Baja bloqueada mientras otra fórmula la invoque

El sistema SHALL rechazar la baja de una fórmula mientras la versión vigente de otra fórmula activa la invoque, nombrando cuáles.

#### Scenario: Baja de una fórmula en uso

- **WHEN** se intenta dar de baja `QUADRATIC` y la versión vigente de `DOBLE_CUADRADO` la invoca
- **THEN** la baja se rechaza nombrando `DOBLE_CUADRADO`

## MODIFIED Requirements

### Requirement: Consulta de impacto de una fórmula

El sistema SHALL informar, para una fórmula dada, a qué subtipos está asignada, cuántos diseños y sub-diseños contienen celdas que la invocan, y cuántos de ellos están calculados con una versión que ya no es la vigente.

El sistema SHALL informar además qué fórmulas la invocan, directa o indirectamente, y SHALL contar como afectados también los diseños que usan esas fórmulas.

#### Scenario: Consulta antes de editar

- **WHEN** un administrador consulta el impacto de una fórmula
- **THEN** recibe el número de subtipos asignados, el de diseños afectados y el de diseños desactualizados

#### Scenario: Fórmula sin uso

- **WHEN** se consulta el impacto de una fórmula recién creada y sin asignar
- **THEN** todos los conteos son cero

#### Scenario: Fórmula invocada por otra

- **WHEN** se consulta el impacto de `QUADRATIC`, que no aparece en ninguna hoja pero es invocada por `DOBLE_CUADRADO`, usada en tres sub-diseños
- **THEN** la consulta lista `DOBLE_CUADRADO` como fórmula que la invoca, y cuenta los tres sub-diseños como afectados
