## ADDED Requirements

### Requirement: La norma asigna cada accesorio a su semielaborado

Al añadir accesorios a un elemento en la norma, todos los accesorios elegidos en una misma acción SHALL llevar el semielaborado elegido, y SHALL añadirse a todos los elementos seleccionados de la norma. Si no se ha elegido semielaborado, SHALL NOT añadirse ninguno a ningún elemento. Los campos del accesorio (referencia, descripción, unidad y costos) SHALL ser los que devuelve `GET /accesory`.

#### Scenario: Varios accesorios a la vez

- **WHEN** el usuario elige tres accesorios y el semielaborado `BOBINA` para dos elementos de la norma
- **THEN** los dos elementos llevan los tres accesorios, los tres con `semiFinished` `BOBINA`, y los tres aparecen en la lista de materiales bajo `BOBINA`

#### Scenario: Sin semielaborado

- **WHEN** el usuario elige accesorios sin elegir semielaborado
- **THEN** se le pide elegirlo y ningún elemento cambia

## MODIFIED Requirements

### Requirement: Lista de materiales por diseño en el admin

El admin SHALL ofrecer, solo a administradores, una sección «Lista de materiales» con los diseños guardados del cliente en un listado con filtros (ver `design-bom-review`), sin búsqueda por código. Elegir un diseño sin ajuste SHALL generar su lista. Elegir un diseño con ajuste SHALL abrir la comparación de la lista ajustada con la generada.

#### Scenario: Elegir un diseño con estructura BOM

- **WHEN** el administrador elige el diseño 28, sin ajuste, cuyo elemento tiene la referencia `1-25-220-120-CV-CT-NTCA-CO-ST`
- **THEN** se genera su lista con la estructura `1-25-220-120`

#### Scenario: Diseño con varios elementos

- **WHEN** el administrador elige un diseño con dos elementos de referencias distintas
- **THEN** la lista se arma con el primero, como en el cliente, se indica con cuál, y se puede elegir el otro

#### Scenario: Acceso

- **WHEN** un usuario sin rol de administrador intenta abrir la sección
- **THEN** no puede

### Requirement: Las reglas de armado son las del cliente

La lista SHALL armarse con las mismas reglas en el cliente y en el admin, a partir de dos fuentes: lo que define la **plantilla** (ítems de las celdas con vínculo dentro de las zonas de semielaborado, con la cantidad de la celda y la descripción y unidad de su tabla de catálogo) y lo que define la **norma** del elemento (sus accesorios asignados a ese semielaborado). La estructura BOM SHALL ser aquella cuyo código es prefijo de la referencia ERP del elemento; los semielaborados SHALL recorrerse de hojas a raíz, y los semielaborados hijos SHALL aparecer como filas que se despliegan para mostrar sus ítems.

Las columnas SHALL ser, en este orden, ID, Ítem, Descripción, Cantidad, U.M., Referencia, Costo promedio, Último costo y Observación. Las cinco primeras SHALL quedar donde estaban (A–E). Un accesorio SHALL llevar todos sus campos: `id`, `reference`, `description`, `value` como cantidad, la unidad (`unitOfMeasurement` o, si falta, `unitMeasurement`), `averageCost` y `lastCost`. Un ítem de la plantilla SHALL dejar vacías Referencia y los costos. Si a un accesorio le falta la cantidad, la unidad o algún costo, la columna Observación SHALL decirlo y la celda SHALL NOT rellenarse con un valor por omisión.

#### Scenario: Paridad entre cliente y admin

- **WHEN** se arma la lista de los `sub_design` 90 y 91 con la estructura de prueba en el cliente y en el admin
- **THEN** el resultado es el mismo celda a celda, contra la misma línea base

#### Scenario: Accesorio completo

- **WHEN** un elemento tiene un accesorio con referencia `06010504`, unidad `UND`, cantidad 2 y costos
- **THEN** su fila lleva la referencia, la descripción, 2, `UND` y los dos costos

#### Scenario: Accesorio sin cantidad

- **WHEN** un accesorio de la norma no tiene `value`
- **THEN** su fila deja la cantidad vacía y la Observación dice «sin cantidad en la norma»

#### Scenario: Unidad con el otro nombre

- **WHEN** un accesorio trae su unidad en `unitMeasurement`
- **THEN** la fila la muestra en U.M.

#### Scenario: Ítem huérfano

- **WHEN** una celda apunta a un ítem que ya no está en su tabla, o a una tabla borrada
- **THEN** la fila lo dice («item no encontrado», «catálogo borrado»)

#### Scenario: Desplegar un hijo

- **WHEN** el administrador pulsa la celda ▶ de un semielaborado hijo
- **THEN** se muestran debajo sus ítems, y al pulsar ▼ se ocultan
