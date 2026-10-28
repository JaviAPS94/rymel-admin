## ADDED Requirements

### Requirement: Familias de fantasmas bajo un semielaborado
El administrador SHALL poder agregar una o varias familias de fantasmas bajo cualquier nodo de semielaborado del árbol de una estructura, eligiéndolas por proceso. Una familia MUST NOT repetirse bajo el mismo semielaborado, pero SHALL poder aparecer bajo otro. Una familia MUST NOT ser raíz del árbol ni colgar de otra familia.

#### Scenario: Agregar familias desde el semielaborado seleccionado
- **WHEN** el administrador selecciona el nodo ENSAMBLEFINAL, pulsa «Agregar fantasmas» y marca «F. Emblemas» (EMBLEMADO) y «F. Acc Alis» (ALISTAMIENTO Y ENCUBE)
- **THEN** las dos familias quedan como hojas bajo ENSAMBLEFINAL, en el orden en que se agregaron

#### Scenario: Familia ya agregada
- **WHEN** el administrador abre «Agregar fantasmas» en un semielaborado que ya tiene «F. Emblemas»
- **THEN** «F. Emblemas» aparece marcada como ya agregada y no se puede volver a elegir

#### Scenario: Agregarla dos veces por la API
- **WHEN** se pide agregar al mismo nodo una familia que ya tiene
- **THEN** el servidor responde con un error de conflicto y no crea nada

#### Scenario: Familia inexistente o de otro proceso dado de baja
- **WHEN** se pide agregar una familia que no existe o está dada de baja
- **THEN** el servidor responde con un error de validación

### Requirement: El proceso siempre acompaña a la familia
El árbol, el modal y el panel SHALL mostrar el proceso junto al nombre de cada familia, porque dos procesos pueden tener una familia con el mismo nombre.

#### Scenario: Mismo nombre en dos procesos
- **WHEN** el administrador busca «Acc Ar» en el modal
- **THEN** ve dos resultados, «F- Acc Ar · ALISTAMIENTO Y ENCUBE» y «F- Acc Ar · ARMADO Y CONEXIÓN», y cada uno agrega su propia familia

### Requirement: La familia en el árbol
Cada familia SHALL verse en el árbol con un estilo propio, distinto de los tipos de nodo de semielaborado, con su nombre, su proceso y cuántos de sus fantasmas ofrece la estructura. Una familia que no ofrece ningún fantasma SHALL marcarse como tal. Las familias MUST NOT tener tipo de nodo ni hijos.

#### Scenario: Familia con fantasmas para la estructura
- **WHEN** la estructura soporta 1CA y 3CATC y la familia «F. Emblemas» tiene 16 fantasmas 1CA y 6 3CATC
- **THEN** el nodo muestra «F. Emblemas · EMBLEMADO» y «22 fantasmas»

#### Scenario: Familia sin fantasmas para la estructura
- **WHEN** ningún fantasma de la familia tiene un Tipo PT de la estructura
- **THEN** el nodo se ve con aviso y el texto «sin fantasmas para los tipos de la estructura»

#### Scenario: Familia sin fantasmas en absoluto
- **WHEN** se agrega «F. Prueba» (METALMECANICA), que no tiene fantasmas
- **THEN** se agrega igual y el nodo se ve con el mismo aviso

### Requirement: Panel de la familia seleccionada
Al seleccionar una familia en el árbol, el panel lateral SHALL mostrar los fantasmas que la estructura ofrece de ella, con código, referencia, Tipo PT y número de componentes, y SHALL permitir quitarla del árbol. Las acciones de semielaborado (agregar hijo, editar, tipo) MUST NOT mostrarse para una familia.

#### Scenario: Ver los fantasmas que ofrece
- **WHEN** el administrador selecciona «F. Emblemas»
- **THEN** el panel lista los fantasmas de la familia con un Tipo PT de la estructura, con su código, referencia, Tipo PT y componentes, y un enlace a la familia en la sección «Fantasmas»

#### Scenario: Quitar la familia
- **WHEN** el administrador pulsa «Quitar del árbol» y confirma
- **THEN** la familia desaparece de ese semielaborado; los fantasmas no se tocan

### Requirement: Las familias siguen a su semielaborado
Al eliminar un nodo de semielaborado SHALL quitarse también las familias que colgaban de él y de sus descendientes. Un proceso cuyas familias estén en alguna estructura MUST NOT poder darse de baja.

#### Scenario: Eliminar el semielaborado
- **WHEN** el administrador elimina ENSAMBLEFINAL, que tiene dos familias
- **THEN** el nodo, sus hijos y sus familias desaparecen del árbol, y la confirmación avisa cuántas familias se quitan

#### Scenario: Dar de baja un proceso en uso
- **WHEN** se intenta dar de baja un proceso con una familia en la estructura «1-25-220-120»
- **THEN** el servidor lo rechaza y nombra la estructura

### Requirement: El contrato del árbol no cambia para quien no conoce las familias
El detalle de la estructura SHALL seguir devolviendo cada nodo con `semiFinished`, `type`, `parentId` y `children` como hoy, y añadir `phantomFamilies` aparte. La lista de materiales del cliente, la hoja base de la plantilla y «Diseños» MUST dar el mismo resultado con y sin familias en el árbol.

#### Scenario: Estructura con familias en el cliente
- **WHEN** el cliente arma la lista de un diseño con una estructura que tiene familias
- **THEN** la lista es idéntica a la de la misma estructura sin familias
