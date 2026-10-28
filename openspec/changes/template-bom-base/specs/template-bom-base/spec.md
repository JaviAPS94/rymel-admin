## ADDED Requirements

### Requirement: Generar la lista de materiales en la plantilla

El editor de plantillas SHALL ofrecer la acción «Lista de materiales». Al elegir una estructura BOM, SHALL crear en la plantilla una hoja «Lista de materiales» marcada como hoja de lista de materiales, con la estructura de origen registrada.

La hoja SHALL tener, por cada semielaborado de la estructura (de hojas a raíz), su título, su encabezado de columnas (ID, Ítem, Descripción, Cantidad, U.M., Referencia, Costo promedio, Último costo, Observación), sus semielaborados hijos y los ítems que la plantilla vincula dentro de las zonas de ese semielaborado. La cantidad, la descripción y la unidad de cada ítem SHALL ser fórmulas que apuntan a la celda vinculada y a su fila del catálogo, no valores copiados. Una plantilla SHALL tener como mucho una hoja de lista de materiales.

#### Scenario: Generar

- **WHEN** el admin elige la estructura `1-25-220-120` en una plantilla que vincula `Hoja1!B3` al ítem `240` de la tabla de catálogo de `Tablas`, dentro de la zona del semielaborado `BOBINA`
- **THEN** la plantilla gana la hoja «Lista de materiales». En la sección `BOBINA`, la fila del ítem `240` lleva la cantidad `=Hoja1!B3`, y la descripción y la unidad son fórmulas a su fila de `Tablas`

#### Scenario: Una sola hoja

- **WHEN** la plantilla ya tiene hoja de lista de materiales
- **THEN** la acción ofrece regenerarla, no crear otra

### Requirement: La base se edita y se publica con la plantilla

La hoja de lista de materiales SHALL editarse como cualquier hoja de la plantilla (valores, fórmulas, formato, filas añadidas). SHALL guardarse en el borrador, publicarse y entrar en las revisiones igual que las demás hojas. Regenerarla SHALL pedir confirmación, porque descarta lo editado a mano.

#### Scenario: Fila fija

- **WHEN** el admin añade en la sección `BOBINA` una fila «Barniz · 2 · L» y publica
- **THEN** cualquier diseño nuevo con esa plantilla tiene esa fila en su lista

#### Scenario: Regenerar

- **WHEN** el admin pulsa «Regenerar» después de editar la hoja
- **THEN** se le advierte que se pierde lo editado y, si confirma, la hoja se vuelve a armar desde la estructura y la configuración actuales

### Requirement: Validación de la hoja base

La validación de la plantilla SHALL reportar un diagnóstico, con el bloqueo de publicación que tienen todos los diagnósticos, cuando una fórmula de la hoja de lista de materiales apunte a una hoja que no existe, o cuando la plantilla tenga más de una hoja de lista de materiales.

#### Scenario: Hoja borrada

- **WHEN** el admin borra la hoja `Tablas` y la lista de materiales apunta a ella
- **THEN** la validación lo reporta en las celdas afectadas y no deja publicar

### Requirement: El diseño parte de la base de la plantilla

Cuando un diseño se crea con una plantilla que tiene hoja de lista de materiales, esa hoja SHALL viajar con el diseño como las demás: se calcula junto con ellas y se guarda en su `sub_design`, oculta entre las hojas de cálculo. Un cambio posterior en la plantilla SHALL NOT alterar los diseños ya creados, igual que con el resto de hojas.

La pestaña «LISTA DE MATERIALES» SHALL mostrar esa hoja, con los valores del diseño, y SHALL añadir los accesorios de la norma del elemento al final de la sección de su semielaborado, con todos sus campos. Los ajustes del diseñador SHALL funcionar como ya funcionan sobre esa lista. Un diseño sin hoja de lista de materiales SHALL seguir generando la lista como antes.

#### Scenario: Cantidades del diseño

- **WHEN** en un diseño con esa plantilla `Hoja1!B3` vale 7
- **THEN** la fila del ítem `240` muestra 7

#### Scenario: Accesorios

- **WHEN** el elemento del diseño tiene un accesorio `06010504` asignado a `BOBINA`
- **THEN** aparece en la sección `BOBINA`, después de las filas de la base, con su referencia, cantidad, unidad y costos

#### Scenario: La plantilla cambia después

- **WHEN** el admin publica otra versión de la base después de crear el diseño
- **THEN** el diseño sigue mostrando la base con la que se creó

#### Scenario: Plantilla sin base

- **WHEN** el diseño usa una plantilla sin hoja de lista de materiales
- **THEN** la lista se genera desde la estructura de la referencia del elemento, como antes

#### Scenario: Pestañas de hojas

- **WHEN** el diseñador abre un diseño con esa plantilla
- **THEN** la hoja de lista de materiales no aparece entre las hojas de cálculo del diseño

### Requirement: El admin ve la misma lista que el cliente

En la sección «Diseños» del admin, la lista de materiales de un diseño SHALL ser la del cliente. Si el cliente la ajustó, la ajustada. Si no, la hoja base guardada en el diseño, con los valores que calculó el cliente, más los accesorios de su elemento. Para diseños sin hoja base, la generada como antes.

#### Scenario: Diseño con base

- **WHEN** el admin abre un diseño creado con una plantilla con base y sin ajuste
- **THEN** ve la base con los valores del diseño y los accesorios del elemento, y la exportación lleva lo mismo
