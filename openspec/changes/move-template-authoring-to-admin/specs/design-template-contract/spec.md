## ADDED Requirements

### Requirement: Unicidad de la etiqueta de material

Una plantilla SHALL tener como mucho una celda con `materialTag: "MO"` y como mucho una con `materialTag: "MD"`, contando todas sus hojas. La validación SHALL reportar un diagnóstico `duplicate-material-tag` en cada celda sobrante, nombrando la otra. El diagnóstico bloquea la publicación, como todos.

La exclusividad se impone en el contrato, y no solo en la interfaz, porque el código de diseño toma la primera celda etiquetada que encuentra: con dos, el código depende del orden de recorrido de las hojas.

#### Scenario: Dos celdas MO en hojas distintas

- **WHEN** `Resumen!D3` y `Tablas!B5` llevan ambas `materialTag: "MO"`
- **THEN** la validación reporta `duplicate-material-tag` en las dos, y cada mensaje nombra a la otra celda

#### Scenario: Una MO y una MD

- **WHEN** `D3` es MO y `D4` es MD
- **THEN** no hay diagnóstico

#### Scenario: Plantillas existentes

- **WHEN** se validan las plantillas publicadas a la fecha del cambio
- **THEN** ninguna produce `duplicate-material-tag`, porque ninguna lleva etiquetas

### Requirement: El ítem enlazado existe en su tabla de catálogo

Si una celda lleva `itemLink` y la tabla de destino existe, el identificador del ítem SHALL coincidir con el contenido de la columna de identificador de alguna fila de datos de esa tabla (sin las filas de encabezado). Si no coincide, la validación SHALL reportar `missing-catalog-item`.

Si la celda de identificador de alguna fila es una fórmula, la comprobación SHALL omitirse para esa tabla: el análisis es estático y no evalúa.

#### Scenario: Ítem inexistente

- **WHEN** `B7` apunta a la tabla `tbl-al` con el ítem `AL-999`, y ninguna fila de datos de `tbl-al` tiene `AL-999` como identificador
- **THEN** la validación reporta `missing-catalog-item` en `B7`, con la tabla y el identificador

#### Scenario: Identificador en una fila de encabezado

- **WHEN** el único lugar donde aparece `ID` es la fila de encabezado de la tabla y la celda apunta al ítem `ID`
- **THEN** la validación reporta `missing-catalog-item`

#### Scenario: Tabla con identificadores calculados

- **WHEN** la columna de identificador de la tabla contiene fórmulas
- **THEN** no se reporta `missing-catalog-item` para las celdas que apuntan a esa tabla

#### Scenario: Ítem sin identificador

- **WHEN** una celda tiene `itemLink` con tabla pero con `itemId` vacío
- **THEN** la validación reporta `missing-catalog-item`, porque un vínculo sin ítem no aporta nada al BOM

### Requirement: Zonas de solo lectura

`SheetStyles` SHALL incluir `readOnlyZones`: una lista de regiones `{ id, startCell, endCell }` cuyas celdas el diseñador no puede modificar. La deserialización SHALL aceptar documentos sin el campo, tratándolo como lista vacía, y la serialización SHALL conservarlo.

El paquete SHALL exponer `isReadOnly(sheet, ref)`, la única regla con la que el editor, el diseñador y el servidor deciden si una celda está protegida. Una celda combinada SHALL considerarse protegida si su celda de origen lo está.

La validación SHALL reportar:

- `region-out-of-sheet` para una zona fuera de las dimensiones de la hoja, como con las demás regiones;
- `read-only-input` para una celda con lista desplegable (`options`) dentro de una zona, porque ofrece una elección que el diseñador no podrá hacer.

Las zonas SHALL poder solaparse: proteger dos veces una celda no es ambiguo.

#### Scenario: Documento anterior al campo

- **WHEN** se lee una plantilla guardada sin `readOnlyZones`
- **THEN** el documento tiene `readOnlyZones: []` y es válido

#### Scenario: Ida y vuelta

- **WHEN** se serializa y se vuelve a leer una hoja con dos zonas de solo lectura
- **THEN** las dos zonas se conservan idénticas

#### Scenario: Desplegable protegido

- **WHEN** `I23` tiene `options: ["Aluminio", "Cobre"]` y está dentro de una zona de solo lectura
- **THEN** la validación reporta `read-only-input` en `I23`

#### Scenario: Celda combinada

- **WHEN** `B2:D2` está combinada y la zona cubre solo `B2`
- **THEN** `isReadOnly` es verdadero para `B2`, `C2` y `D2`
