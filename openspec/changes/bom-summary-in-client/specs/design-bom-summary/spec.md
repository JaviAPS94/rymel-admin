## MODIFIED Requirements

### Requirement: El cliente conserva la lista

`project-front` SHALL ofrecer la pestaña «LISTA DE MATERIALES», generada desde la base que define la plantilla, y SHALL mostrarla en solo lectura por omisión. El diseñador SHALL poder pasar a edición de forma explícita para ajustarla. La base de la lista (estructuras BOM y configuración de la plantilla) SHALL definirse solo en el admin, y nada de lo que se ajusta en el cliente la cambia. El cliente SHALL poder añadir filas (elementos adicionales) y cambiar las que hay.

#### Scenario: Pestaña en solo lectura

- **WHEN** un diseñador abre el diseño 28 y genera su lista
- **THEN** ve la lista con la estructura `1-25-220-120`, y escribir en una celda no la cambia

#### Scenario: Pasar a edición

- **WHEN** el diseñador pulsa «Editar» y cambia la cantidad de un ítem por `=3*4`
- **THEN** la celda muestra 12

#### Scenario: Desplegar solo en lectura

- **WHEN** la hoja está en edición
- **THEN** las celdas ▶/▼ de los semielaborados hijos no despliegan ni pliegan, y lo editado no se pierde

#### Scenario: Ajustar no cambia la estructura

- **WHEN** el diseñador ajusta y guarda la lista del diseño 28
- **THEN** la estructura BOM `1-25-220-120` y la plantilla quedan igual, y otro diseño con la misma plantilla sigue viendo la lista base

#### Scenario: Añadir una fila

- **WHEN** el diseñador, en edición, escribe un ítem adicional en una fila vacía de un semielaborado y guarda los ajustes
- **THEN** al volver a abrir el diseño la fila sigue ahí, y la lista base de la plantilla no cambia
