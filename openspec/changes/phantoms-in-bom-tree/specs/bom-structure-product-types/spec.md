## ADDED Requirements

### Requirement: Tipos PT que soporta la estructura
La estructura SHALL guardar los Tipos PT que soporta. El administrador SHALL elegirlos de los Tipos PT que existen en los fantasmas, y SHALL poder ver cuántos fantasmas tiene cada uno. Un tipo MUST NOT repetirse en la estructura.

#### Scenario: Elegir los tipos
- **WHEN** el administrador abre «Tipos de equipo» en la cabecera de la estructura y marca 1CA y 3CATC
- **THEN** la estructura queda con esos dos tipos y la cabecera los muestra como etiquetas

#### Scenario: La lista ofrece los tipos existentes
- **WHEN** el administrador abre el selector
- **THEN** ve los 35 Tipos PT de los fantasmas, tal como están escritos («3PRM/PM», «3SEH-1,2»), con su número de fantasmas, y puede buscar entre ellos

#### Scenario: Un tipo que ya no tiene fantasmas
- **WHEN** la estructura tiene un tipo que ningún fantasma tiene ya
- **THEN** el tipo se conserva y se ve marcado como «sin fantasmas»

### Requirement: Los tipos filtran lo que ofrece cada familia
Los fantasmas que la estructura ofrece de una familia SHALL ser los de esa familia, no dados de baja, cuyo Tipo PT coincide exactamente con uno de los tipos de la estructura. Una estructura sin tipos SHALL ofrecer todos los fantasmas de la familia y avisarlo en la cabecera.

#### Scenario: Filtro por tipos
- **WHEN** la estructura soporta 1CV y la familia «F. Acc Alis» tiene fantasmas 1CV, 3CV y 1AU
- **THEN** la familia ofrece solo los 1CV

#### Scenario: Estructura sin tipos
- **WHEN** la estructura no tiene tipos declarados
- **THEN** cada familia ofrece todos sus fantasmas y la cabecera dice «Sin tipos de equipo: se ofrecen todos los fantasmas»

#### Scenario: Cambiar los tipos actualiza el árbol
- **WHEN** el administrador quita 3CATC de la estructura
- **THEN** los contadores de las familias del árbol y el panel de la familia seleccionada se actualizan sin recargar la página
