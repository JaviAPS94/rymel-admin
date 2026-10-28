## ADDED Requirements

### Requirement: Los accesorios entran con todos sus campos

La lista SHALL armarse con dos fuentes. La primera es lo que define la **plantilla**: los ítems de las celdas con vínculo dentro de las zonas de semielaborado, con la cantidad de la celda y la descripción y unidad de su tabla de catálogo. La segunda es lo que define la **norma** del elemento: sus accesorios asignados a ese semielaborado. La estructura BOM SHALL seguir siendo la cuyo código es prefijo de la referencia ERP del elemento del diseño.

Las columnas SHALL ser, en este orden, ID, Ítem, Descripción, Cantidad, U.M., Referencia, Costo promedio, Último costo y Observación; las cinco primeras SHALL quedar donde estaban (A–E). Un accesorio SHALL llevar todos sus campos: `id`, `reference`, `description`, `value` como cantidad, la unidad (`unitOfMeasurement` o, si falta, `unitMeasurement`), `averageCost` y `lastCost`. Un ítem de la plantilla SHALL dejar vacías Referencia y los costos. Si a un accesorio le falta la cantidad, la unidad o algún costo, la columna Observación SHALL decirlo y la celda SHALL NOT rellenarse con un valor por omisión.

#### Scenario: Accesorio completo

- **WHEN** un elemento tiene un accesorio con referencia `06010504`, unidad `UND`, cantidad 2 y costos
- **THEN** su fila lleva la referencia, la descripción, 2, `UND` y los dos costos

#### Scenario: Accesorio sin cantidad

- **WHEN** un accesorio de la norma no tiene `value`
- **THEN** su fila deja la cantidad vacía y la Observación dice «sin cantidad en la norma»

#### Scenario: Unidad con el otro nombre

- **WHEN** un accesorio trae su unidad en `unitMeasurement`
- **THEN** la fila la muestra en U.M.

#### Scenario: Línea base

- **WHEN** se ejecuta `scripts/check-bom-cases.ts` y `scripts/check-design-bom.ts` en project-front
- **THEN** la lista coincide celda a celda con sus líneas base

### Requirement: La norma asigna cada accesorio a su semielaborado

Al añadir accesorios a un elemento en la norma, todos los accesorios elegidos en una misma acción SHALL llevar el semielaborado elegido, y SHALL añadirse a todos los elementos seleccionados de la norma. Si no se ha elegido semielaborado, SHALL NOT añadirse ninguno a ningún elemento. Los campos del accesorio (referencia, descripción, unidad y costos) SHALL ser los que devuelve `GET /accesory`.

#### Scenario: Varios accesorios a la vez

- **WHEN** el usuario elige tres accesorios y el semielaborado `BOBINA` para dos elementos de la norma
- **THEN** los dos elementos llevan los tres accesorios, los tres con `semiFinished` `BOBINA`, y los tres aparecen en la lista de materiales bajo `BOBINA`

#### Scenario: Sin semielaborado

- **WHEN** el usuario elige accesorios sin elegir semielaborado
- **THEN** se le pide elegirlo y ningún elemento cambia
