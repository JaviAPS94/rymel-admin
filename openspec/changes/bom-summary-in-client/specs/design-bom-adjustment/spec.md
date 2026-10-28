## ADDED Requirements

### Requirement: Guardar los ajustes con el diseño

En edición, el diseñador SHALL poder guardar la lista ajustada de un diseño ya guardado. Se SHALL guardar una sola versión ajustada por diseño: guardar otra vez la reemplaza. Lo guardado SHALL incluir la hoja tal como se ve (valores, fórmulas y formato), la estructura BOM con la que se generó, la huella de la lista generada sobre la que se hizo, y quién y cuándo la guardó.

#### Scenario: Guardar y volver a abrir

- **WHEN** el diseñador cambia la cantidad de `240 · Fibra de 2 mm` a 5 en el diseño 28, guarda los ajustes, cierra el diseño y lo vuelve a abrir
- **THEN** la pestaña muestra la lista con cantidad 5, en solo lectura, marcada como ajustada, con autor y fecha

#### Scenario: Diseño sin guardar

- **WHEN** el diseño todavía no se ha guardado nunca
- **THEN** «Guardar ajustes» no está disponible y se indica que primero hay que guardar el diseño

#### Scenario: Guardar el diseño no toca los ajustes

- **WHEN** el diseñador guarda el diseño (`PUT /design/:id`) después de haber guardado ajustes
- **THEN** los ajustes siguen ahí

### Requirement: Descartar y volver a la lista generada

El diseñador SHALL poder descartar los cambios sin guardar, que devuelve la hoja al último estado guardado o generado, y SHALL poder borrar los ajustes guardados, que devuelve la pestaña a la lista generada. Borrar los ajustes guardados SHALL pedir confirmación.

#### Scenario: Descartar sin guardar

- **WHEN** el diseñador edita y pulsa «Descartar»
- **THEN** la hoja vuelve a como estaba al entrar en edición y queda en solo lectura

#### Scenario: Volver a la generada

- **WHEN** el diseñador elige «Volver a la lista generada» y confirma
- **THEN** se borran los ajustes guardados y se muestra la lista recién generada

### Requirement: Avisar si la lista cambió desde el ajuste

Al abrir una lista ajustada, el cliente SHALL volver a generar la lista y compararla con la huella guardada. Si son distintas, SHALL avisar de que los ajustes se hicieron sobre una lista anterior, SHALL seguir mostrando la versión ajustada, y SHALL ofrecer volver a la generada. Los ajustes SHALL NOT descartarse solos.

#### Scenario: El admin cambia la estructura

- **WHEN** después de guardar ajustes del diseño 28 el admin añade un semielaborado a la estructura `1-25-220-120`
- **THEN** al abrir el diseño se ve la lista ajustada con el aviso de que la lista cambió, y nada se ha borrado

#### Scenario: Nada cambió

- **WHEN** se abre el diseño 28 y nada de lo que alimenta su lista ha cambiado desde el ajuste
- **THEN** no hay aviso

#### Scenario: La estructura ya no existe

- **WHEN** la estructura BOM con la que se hizo el ajuste ya no coincide con la referencia del elemento, o se borró
- **THEN** se ve la lista ajustada con un aviso que lo dice

### Requirement: Rutas de ajustes

`project-back` SHALL exponer `GET`, `PUT` y `DELETE` en `/design/:id/bom-adjustment` para los mismos roles que pueden guardar un diseño. `GET` sin ajustes SHALL responder 404. Borrar un diseño SHALL borrar sus ajustes.

#### Scenario: Sin ajustes

- **WHEN** se pide `GET /design/28/bom-adjustment` y nunca se guardaron ajustes
- **THEN** responde 404

#### Scenario: Diseño inexistente

- **WHEN** se hace `PUT /design/9999/bom-adjustment`
- **THEN** responde 404 y no se guarda nada
