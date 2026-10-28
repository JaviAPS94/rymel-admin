## Why

Los fantasmas ya viven en el sistema (533 fantasmas y 5.122 líneas en 5 procesos y 11 familias, más el proceso «General»), pero no se pueden usar en la lista de materiales: el árbol de la estructura solo admite semielaborados. En la reunión de fantasmas el cliente mostró la estructura con nodos como «F. Emblemas» o «F. Acc Alis» colgando de un semielaborado, y explicó que cada estructura «soporta» unos tipos de equipo (Tipo PT: 1CA, 3CATC, 1CV…) que acotan qué fantasmas le sirven. Sin eso, el paso siguiente —que la plantilla acote los tipos y el diseño elija el fantasma concreto— no tiene dónde apoyarse.

Lo que muestran los datos (base local, 2026-10-28):

- **La familia es la unidad del árbol, no el fantasma.** La columna «Fantasma» del libro es la familia y coincide con los nodos azules del diagrama de la reunión. Una familia agrupa de 8 a 184 fantasmas (F. Acc Sol: 184, F. Emblemas: 106); poner fantasmas uno a uno haría árboles de cientos de nodos.
- **El nombre de una familia no la identifica sola.** «F- Acc Ar» existe en ALISTAMIENTO Y ENCUBE (17 fantasmas) y en ARMADO Y CONEXIÓN (13). El árbol tiene que mostrar siempre el proceso junto a la familia.
- **Hay 35 Tipos PT distintos** en los fantasmas, con formas irregulares («3PRM/PM», «3SEH-1,2», «SEH1.2»). Los tipos que soporta la estructura tienen que elegirse de esa lista, no escribirse a mano.
- **Las columnas «Estructura LM» y «Plantillas Diseño» del libro son ejemplos, no datos**: valores «Estructura 1», «Estructura 2», «Estructura n» en solo 2 hojas. La relación se define en la estructura, no se importa.
- Las estructuras actuales son de prueba: 3 estructuras, 16 nodos, ninguna con fantasmas.

## What Changes

**Familias de fantasmas en el árbol**

- Bajo cualquier nodo de semielaborado del árbol se pueden agregar una o varias **familias de fantasmas**, elegidas por proceso. Se ven en el árbol con su propio estilo, el proceso y cuántos fantasmas de la familia sirven a la estructura.
- Al seleccionar una familia en el árbol, el panel lateral muestra los fantasmas que la estructura ofrecerá (código, referencia, Tipo PT y número de componentes) y permite quitarla.
- Una familia no se repite bajo el mismo semielaborado; sí puede aparecer bajo otro.
- Las familias son hojas: no tienen hijos ni tipo de nodo (Estándar, Crítico, Referencia).
- Al eliminar un semielaborado se quitan también las familias que colgaban de él.

**Tipos de equipo de la estructura**

- La estructura declara qué **Tipos PT** soporta, eligiéndolos de los que existen en los fantasmas.
- Los fantasmas que ofrece cada familia del árbol son los de esa familia cuyo Tipo PT está entre los de la estructura. Sin tipos declarados, la estructura ofrece todos y lo avisa.
- Si una familia no tiene ningún fantasma para los tipos de la estructura, el árbol lo marca.

**Fuera de alcance**

- Que la plantilla de diseño acote los tipos de la estructura y que el diseño elija el fantasma concreto con sus componentes en la lista de materiales. Es el siguiente cambio y se apoya en este.
- La lista de materiales del cliente y la hoja base de la plantilla no cambian: siguen leyendo solo los semielaborados del árbol.

## Capabilities

### New Capabilities

- `bom-tree-phantom-families`: familias de fantasmas como hojas del árbol de la estructura, bajo un semielaborado, y lo que la estructura ofrece de cada una.
- `bom-structure-product-types`: Tipos PT que soporta la estructura y cómo filtran los fantasmas que ofrece.

### Modified Capabilities

Ninguna. Las estructuras BOM y los fantasmas no tienen spec publicada en `openspec/specs/`; el contrato actual del árbol (`nodes` con `semiFinished`) no cambia, solo se amplía.

## Impact

- **project-back**: tablas `bill_of_materials_node_phantom_family` (nodo de semielaborado ↔ familia) y `bill_of_materials_product_type` (estructura ↔ Tipo PT); el detalle de la estructura añade `phantomFamilies` a cada nodo y `productTypes` a la estructura; endpoints para agregar y quitar familias, fijar los tipos, listar los Tipos PT existentes y listar los fantasmas que ofrece una familia en una estructura. Dar de baja un proceso cuyas familias están en una estructura se rechaza.
- **project-admin**: editor de la estructura (`BomEditorPage`, `BomTree`): acción «Agregar fantasmas» en el semielaborado seleccionado, modal de familias por proceso, nodo de familia en el árbol, panel de la familia con sus fantasmas, editor de Tipos PT en la cabecera y leyenda.
- **Sin efecto** en `@rymel/design-template`, project-front ni en la hoja base: leen `semiFinished` y `children`, que quedan iguales. Se comprueba en las tareas.
