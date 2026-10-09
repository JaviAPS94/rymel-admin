## ADDED Requirements

### Requirement: Lista de materiales por diseño en el admin

El admin SHALL ofrecer, solo a administradores, una sección «Lista de materiales» con los diseños guardados, buscables por código, mostrando de cada uno su elemento y su referencia ERP. Elegir un diseño SHALL generar su lista de materiales.

#### Scenario: Elegir un diseño con estructura BOM

- **WHEN** el administrador elige el diseño 28, cuyo elemento tiene la referencia `1-25-220-120-CV-CT-NTCA-CO-ST`
- **THEN** se genera su lista con la estructura `1-25-220-120`

#### Scenario: Diseño con varios elementos

- **WHEN** el administrador elige un diseño con dos elementos de referencias distintas
- **THEN** la lista se arma con el primero, como en el cliente, se indica con cuál, y se puede elegir el otro

#### Scenario: Acceso

- **WHEN** un usuario sin rol de administrador intenta abrir la sección
- **THEN** no puede

### Requirement: Las reglas de armado son las del cliente

La lista SHALL armarse con las mismas reglas que aplicaba el cliente: estructura BOM cuyo código es prefijo de la referencia ERP del elemento; semielaborados recorridos de hojas a raíz; por cada uno, los ítems de las celdas con vínculo dentro de sus zonas —con la cantidad de la celda y la descripción y unidad de su tabla de catálogo— y los accesorios del elemento asignados a ese semielaborado; y los semielaborados hijos como filas que se despliegan para mostrar sus ítems.

#### Scenario: Paridad con el cliente

- **WHEN** se arma la lista de los `sub_design` 90 y 91 con la estructura de prueba
- **THEN** el resultado es, celda a celda, el que producía el cliente

#### Scenario: Ítem huérfano

- **WHEN** una celda apunta a un ítem que ya no está en su tabla, o a una tabla borrada
- **THEN** la fila lo dice («item no encontrado», «catálogo borrado»), como en el cliente

#### Scenario: Desplegar un hijo

- **WHEN** el administrador pulsa la celda ▶ de un semielaborado hijo
- **THEN** se muestran debajo sus ítems, y al pulsar ▼ se ocultan

### Requirement: Hoja editable, como en el cliente, y exportable

La lista SHALL mostrarse como una hoja de cálculo que se edita como en el cliente: valores, fórmulas, formato, deshacer y navegación con teclado. Lo editado SHALL NOT guardarse con el diseño, y desplegar o plegar un semielaborado hijo SHALL rearmar la hoja desde la estructura, como en el cliente. La lista SHALL poder exportarse a CSV con separador `;` y codificación UTF-8 con BOM, con los valores tal como se ven, ediciones incluidas.

#### Scenario: Editar con una fórmula

- **WHEN** el administrador cambia la cantidad de un ítem por `=3*4`
- **THEN** la celda muestra 12, y la exportación lleva 12

#### Scenario: Desplegar rearma la hoja

- **WHEN** el administrador edita una celda y después despliega un semielaborado hijo
- **THEN** la hoja se vuelve a armar desde la estructura y la edición se pierde, como en el cliente

#### Scenario: Exportar

- **WHEN** el administrador exporta la lista del diseño 28
- **THEN** descarga un CSV con las columnas ID, Ítem, Descripción, Cantidad y U.M., que Excel abre con acentos correctos

### Requirement: Los fallos se explican

Si el elemento no tiene referencia ERP, si ninguna estructura coincide, o si los datos del diseño no permiten armar la lista, la sección SHALL decirlo con un mensaje que nombre la causa.

#### Scenario: Sin estructura

- **WHEN** se elige un diseño cuya referencia ERP no empieza por el código de ninguna estructura BOM
- **THEN** se informa que no hay estructura BOM para esa referencia

### Requirement: El cliente ya no genera la lista

`project-front` SHALL dejar de ofrecer la pestaña «LISTA DE MATERIALES» y su código, la consulta de estructuras BOM y el videotutorial que enseñaba a generarla.

#### Scenario: Pestañas del diseñador

- **WHEN** un diseñador abre un diseño
- **THEN** no aparece la pestaña de lista de materiales

### Requirement: Listado de diseños sin país obligatorio

`POST /design/by-filters-paginated` SHALL aplicar el filtro de país solo si se envía.

#### Scenario: Sin país

- **WHEN** el admin pide el listado sin país
- **THEN** recibe todos los diseños activos, paginados

#### Scenario: Con país

- **WHEN** el cliente pide el listado con su país
- **THEN** el resultado es el mismo que antes del cambio
