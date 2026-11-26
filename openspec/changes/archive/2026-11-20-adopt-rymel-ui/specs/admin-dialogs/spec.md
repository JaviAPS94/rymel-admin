## ADDED Requirements

### Requirement: Diálogo accesible con nombre
Todo modal del admin SHALL exponerse como `dialog` modal con nombre accesible igual a su título, y SHALL ofrecer un botón «Cerrar».

#### Scenario: Buscar el modal por su título
- **WHEN** se abre el modal «Importar libro»
- **THEN** existe un elemento con rol `dialog` y nombre «Importar libro»

#### Scenario: Cerrar con el botón
- **WHEN** el usuario pulsa «Cerrar»
- **THEN** se llama a `onClose`

### Requirement: Esc cierra solo el modal de arriba
Con varios modales abiertos, Esc SHALL cerrar solo el último abierto.

#### Scenario: Dos modales apilados
- **WHEN** hay un modal abierto y se abre otro encima, y el usuario pulsa Esc
- **THEN** se cierra solo el de encima y el de abajo sigue abierto

### Requirement: Esc ya usado dentro no cierra el modal
Si un control dentro del modal ya atendió la tecla Esc (`event.defaultPrevented`), el modal MUST NOT cerrarse.

#### Scenario: Autocompletado abierto en el editor de fórmulas
- **WHEN** dentro del modal un autocompletado consume Esc para cerrarse
- **THEN** el modal sigue abierto y no se pierde lo escrito

### Requirement: Modales más altos que la pantalla
Un modal más alto que la pantalla SHALL desplazarse junto con su fondo, con la cabecera (título y «Cerrar») fija arriba; el cuerpo MUST NOT tener desplazamiento propio, para no recortar los desplegables que contiene.

#### Scenario: Vista previa larga de importación
- **WHEN** el contenido del modal supera el alto de la pantalla
- **THEN** el fondo (`[data-modal-overlay]`) se desplaza y la cabecera del modal sigue a la vista

### Requirement: Modal cerrado no hace nada
Un modal cerrado MUST NOT renderizar contenido ni reaccionar al teclado.

#### Scenario: Esc con el modal cerrado
- **WHEN** el modal está cerrado y el usuario pulsa Esc
- **THEN** no se llama a `onClose`
