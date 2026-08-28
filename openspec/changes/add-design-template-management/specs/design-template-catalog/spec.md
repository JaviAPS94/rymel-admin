## ADDED Requirements

### Requirement: Estado de publicación de una plantilla

Una plantilla SHALL tener un estado, `DRAFT` o `PUBLISHED`, y un número de versión que se incrementa en cada publicación.

Una plantilla recién creada SHALL quedar en `DRAFT`.

`GET /design/templates/:subTypeId` SHALL devolver únicamente plantillas publicadas y no dadas de baja. Una plantilla en `DRAFT` SHALL NOT ser visible para el diseñador.

La publicación SHALL rechazarse si el documento no supera la validación del servidor.

#### Scenario: Plantilla en borrador no llega a la biblioteca

- **WHEN** un diseñador consulta las plantillas de su subtipo
- **THEN** las plantillas en `DRAFT` no aparecen en la respuesta

#### Scenario: Publicación de una plantilla válida

- **WHEN** un administrador publica una plantilla que supera la validación
- **THEN** la plantilla pasa a `PUBLISHED`, su versión se incrementa y queda visible en la biblioteca

#### Scenario: Publicación de una plantilla inválida

- **WHEN** un administrador publica una plantilla con una referencia circular
- **THEN** la publicación se rechaza, se devuelven los diagnósticos y la plantilla sigue en `DRAFT`

#### Scenario: Subtipo sin plantillas publicadas

- **WHEN** un diseñador consulta un subtipo cuyas plantillas están todas en `DRAFT`
- **THEN** recibe una lista vacía, sin error

### Requirement: Instantánea de la versión anterior al publicar

Al publicar, el sistema SHALL guardar una instantánea del documento que estaba publicado antes, con su número de versión, su autor y su fecha.

El sistema SHALL permitir consultar las instantáneas de una plantilla y restaurar una de ellas como borrador de trabajo.

Restaurar una instantánea SHALL NOT alterar la plantilla publicada hasta que se publique de nuevo.

#### Scenario: Instantánea al publicar

- **WHEN** se publica la versión 3 de una plantilla que estaba en versión 2
- **THEN** queda registrada una instantánea con el contenido de la versión 2

#### Scenario: Restauración de una versión anterior

- **WHEN** un administrador restaura la instantánea de la versión 2
- **THEN** el borrador pasa a contener ese documento y la versión publicada no cambia

#### Scenario: Primera publicación

- **WHEN** se publica por primera vez una plantilla que nunca estuvo publicada
- **THEN** no se crea ninguna instantánea y la versión queda en 1

### Requirement: Unicidad del código de plantilla y orden de hojas

El código de una plantilla SHALL ser único entre las plantillas no dadas de baja.

Las hojas de una plantilla SHALL tener posiciones distintas y consecutivas desde 0, y el sistema SHALL devolverlas siempre en ese orden.

El sistema SHALL ofrecer una operación de reordenamiento de hojas que reasigne las posiciones en una sola transacción.

#### Scenario: Código duplicado

- **WHEN** se intenta crear una plantilla con un código que ya usa otra plantilla activa
- **THEN** la operación se rechaza indicando el conflicto

#### Scenario: Alta de una hoja nueva

- **WHEN** se añade una hoja a una plantilla que ya tiene dos
- **THEN** la hoja nueva recibe la posición 2

#### Scenario: Reordenamiento

- **WHEN** un administrador mueve la tercera hoja al primer lugar
- **THEN** las tres hojas quedan con posiciones 0, 1 y 2 en el orden nuevo, en una sola operación

### Requirement: API de administración de plantillas

`project-back` SHALL exponer, restringidas al rol de administrador:

- listado paginado de plantillas con búsqueda por nombre y código, y filtros por subtipo, tipo (`DESIGN`/`COST`) y estado;
- detalle de una plantilla con todas sus hojas;
- creación de una plantilla con sus metadatos;
- actualización de metadatos;
- creación, actualización, borrado y reordenamiento de hojas;
- duplicación de una plantilla completa;
- publicación;
- baja lógica.

El listado SHALL informar, por plantilla, cuántas hojas tiene y cuántas celdas, para que una plantilla vacía se distinga a simple vista de una completa.

La lectura por subtipo (`GET /design/templates/:subTypeId`) SHALL seguir disponible para los roles de administración y de diseño.

#### Scenario: Listado con filtro por estado

- **WHEN** un administrador filtra el listado por estado `DRAFT`
- **THEN** recibe solo las plantillas en borrador, con su número de hojas y de celdas

#### Scenario: Plantilla sin hojas visible en el listado

- **WHEN** el listado incluye una plantilla sin hojas
- **THEN** aparece con 0 hojas y 0 celdas

#### Scenario: Duplicación

- **WHEN** un administrador duplica una plantilla
- **THEN** se crea una copia en `DRAFT`, con código nuevo, con todas sus hojas y su orden, sin instantáneas heredadas

#### Scenario: Acceso sin rol de administrador

- **WHEN** un usuario con rol de diseño intenta crear o publicar una plantilla
- **THEN** la petición se rechaza por falta de permisos

#### Scenario: Baja lógica

- **WHEN** un administrador da de baja una plantilla publicada
- **THEN** deja de aparecer en la biblioteca y en el listado por omisión, y su código queda libre

### Requirement: Guardado por hoja

El sistema SHALL permitir guardar una hoja de forma independiente, sin reenviar el resto del documento.

El guardado de una hoja SHALL aceptar únicamente plantillas en `DRAFT`. Una plantilla publicada SHALL pasar a tener un borrador antes de admitir modificaciones, y su versión publicada SHALL permanecer intacta mientras el borrador se edita.

El sistema SHALL rechazar el guardado de una hoja cuya plantilla haya sido modificada por otra sesión desde que el editor la cargó, informando el conflicto en vez de sobrescribir.

#### Scenario: Guardado de una sola hoja

- **WHEN** el editor guarda la hoja `Tablas` de una plantilla de dos hojas
- **THEN** solo se escribe esa hoja y la otra no se toca

#### Scenario: Edición de una plantilla publicada

- **WHEN** un administrador modifica una plantilla publicada
- **THEN** los cambios se guardan en su borrador y los diseñadores siguen viendo la versión publicada

#### Scenario: Escritura concurrente

- **WHEN** dos sesiones cargan la misma plantilla y la segunda guarda después de la primera
- **THEN** la segunda recibe un conflicto y no sobrescribe los cambios de la primera

### Requirement: Validación en el servidor con el mismo contrato que el editor

El servidor SHALL validar todo documento de plantilla que reciba, con el paquete de contrato compartido, antes de escribirlo.

El servidor SHALL rechazar una plantilla con hojas de nombre repetido, referencias mal formadas, regiones inválidas o invocaciones a funciones no asignadas al subtipo, con independencia de lo que haya validado el cliente.

El servidor SHALL registrar, en cada publicación, la versión del paquete de contrato con la que validó.

#### Scenario: Documento inválido enviado directamente a la API

- **WHEN** llega una petición de guardado con una zona de semielaborado fuera de la hoja
- **THEN** el servidor la rechaza con los diagnósticos correspondientes

#### Scenario: Registro de la versión del contrato

- **WHEN** se publica una plantilla
- **THEN** queda registrada la versión del paquete de contrato usada para validarla

### Requirement: Saneamiento de las plantillas existentes

La migración SHALL dejar las plantillas actuales en un estado coherente con este contrato:

- las plantillas sin hojas SHALL quedar en `DRAFT`;
- las hojas de una misma plantilla SHALL recibir posiciones distintas y consecutivas, respetando el orden actual de creación;
- los estilos de hoja SHALL normalizarse al contrato canónico, conservando los nombres obsoletos de los campos de ocultamiento;
- las celdas sin contenido SHALL eliminarse;
- los valores calculados SHALL dejar de persistirse.

Antes de modificar nada, la migración SHALL guardar una instantánea del contenido literal de cada plantilla afectada, y SHALL ser reversible desde esas instantáneas.

La migración SHALL poder ejecutarse en modo simulación, informando cuántas celdas descartaría por hoja, sin escribir.

#### Scenario: Plantilla vacía degradada a borrador

- **WHEN** se aplica la migración sobre una plantilla sin hojas
- **THEN** queda en `DRAFT` y deja de ofrecerse a los diseñadores

#### Scenario: Hojas con la misma posición

- **WHEN** se aplica la migración sobre una plantilla cuyas dos hojas tienen posición 0
- **THEN** quedan con posiciones 0 y 1 respetando su orden de creación

#### Scenario: Simulación previa

- **WHEN** se ejecuta la migración en modo simulación
- **THEN** informa las celdas que descartaría por hoja y no modifica ninguna fila

#### Scenario: Reversión

- **WHEN** se revierte la migración
- **THEN** cada plantilla afectada vuelve a su contenido literal previo desde su instantánea
