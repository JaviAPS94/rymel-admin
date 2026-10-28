## ADDED Requirements

### Requirement: Reglas de armado de la lista

La lista SHALL armarse en el cliente con estas reglas: estructura BOM cuyo código es prefijo de la referencia ERP del elemento; semielaborados recorridos de hojas a raíz; por cada uno, los ítems de las celdas con vínculo dentro de sus zonas —con la cantidad de la celda y la descripción y unidad de su tabla de catálogo— y los accesorios del elemento asignados a ese semielaborado; y los semielaborados hijos como filas que se despliegan para mostrar sus ítems.

#### Scenario: Línea base

- **WHEN** se arma la lista de los `sub_design` 90 y 91 con la estructura de prueba
- **THEN** el resultado es, celda a celda, el de `scripts/fixtures/bom-cases.json`

#### Scenario: Ítem huérfano

- **WHEN** una celda apunta a un ítem que ya no está en su tabla, o a una tabla borrada
- **THEN** la fila lo dice («item no encontrado», «catálogo borrado»)

#### Scenario: Desplegar un hijo

- **WHEN** el diseñador pulsa la celda ▶ de un semielaborado hijo
- **THEN** se muestran debajo sus ítems, y al pulsar ▼ se ocultan

### Requirement: Los fallos se explican

Si el elemento no tiene referencia ERP, si ninguna estructura coincide, o si los datos del diseño no permiten armar la lista, la pestaña SHALL decirlo con un mensaje que nombre la causa.

#### Scenario: Sin estructura

- **WHEN** se genera la lista de un diseño cuya referencia ERP no empieza por el código de ninguna estructura BOM
- **THEN** se informa que no hay estructura BOM para esa referencia

### Requirement: El cliente conserva la lista

`project-front` SHALL seguir ofreciendo la pestaña «LISTA DE MATERIALES», con su consulta de estructuras BOM y su videotutorial, tal como estaban antes de este change. Se planteó retirarla; el 2026-10-27 se pidió traerla de vuelta.

#### Scenario: Pestañas del diseñador

- **WHEN** un diseñador abre un diseño con elemento
- **THEN** aparece la pestaña de lista de materiales y la genera como antes

### Requirement: Listado de diseños sin país obligatorio

`POST /design/by-filters-paginated` SHALL aplicar el filtro de país solo si se envía.

#### Scenario: Sin país

- **WHEN** el admin pide el listado sin país
- **THEN** recibe todos los diseños activos, paginados

#### Scenario: Con país

- **WHEN** el cliente pide el listado con su país
- **THEN** el resultado es el mismo que antes del cambio
