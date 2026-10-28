## ADDED Requirements

### Requirement: Listado de diseños para revisar su lista

El admin SHALL ofrecer, solo a administradores, un listado paginado de todos los diseños activos del cliente, sin campo de búsqueda por código. Cada fila SHALL mostrar el código del diseño, la norma, los elementos con su referencia ERP, el estado de su lista de materiales y, si está ajustada, quién la ajustó y cuándo. El listado SHALL filtrarse por norma, por referencia ERP del elemento, por estado de la lista y por fecha de creación del diseño o de ajuste de la lista.

Los estados SHALL ser: *sin referencia ERP* (ningún elemento la tiene), *sin estructura BOM* (ninguna estructura activa es prefijo de la referencia), *generable* y *ajustada por el cliente*. Una lista ajustada SHALL contar como ajustada aunque su estructura ya no coincida.

#### Scenario: Ver los ajustados

- **WHEN** el administrador filtra por estado «ajustada por el cliente»
- **THEN** ve solo los diseños con ajuste guardado, con autor y fecha del ajuste

#### Scenario: Filtrar por estado sin estructura

- **WHEN** el administrador filtra por «sin estructura BOM» con los datos del 2026-10-27
- **THEN** ve los 19 diseños cuya referencia no empieza por ninguna estructura activa

#### Scenario: Filtrar por norma y referencia

- **WHEN** el administrador elige una norma y escribe parte de una referencia ERP
- **THEN** ve solo los diseños con algún elemento de esa norma cuya referencia contiene el texto

#### Scenario: Sin búsqueda por código

- **WHEN** el administrador abre la sección
- **THEN** no hay campo de búsqueda por código de diseño

### Requirement: Comparar la lista ajustada con la generada

Al abrir un diseño con ajuste guardado, el admin SHALL mostrar en solo lectura la lista ajustada por el cliente y la lista generada ahora desde la estructura, con los mismos semielaborados desplegados que el ajuste. Las diferencias SHALL marcarse por fila: añadida, quitada o con celdas cambiadas, y en las cambiadas se SHALL marcar qué celdas. Si la huella de la lista generada no coincide con la del ajuste, o la estructura ya no corresponde, SHALL mostrarse el mismo aviso que ve el cliente. El admin SHALL NOT poder modificar ni borrar el ajuste.

#### Scenario: Cantidad cambiada

- **WHEN** el cliente cambió a 5 la cantidad de `240 · Fibra de 2 mm` en el diseño 28 y el admin lo abre
- **THEN** la fila de `240` aparece como cambiada, con la celda de cantidad marcada: 5 en la ajustada frente a la cantidad generada

#### Scenario: Fila añadida y fila quitada

- **WHEN** el cliente añadió una fila con un ítem nuevo y vació la fila de un accesorio
- **THEN** la nueva aparece como añadida y la del accesorio como quitada

#### Scenario: Lista generada cambiada

- **WHEN** el admin cambió la estructura después del ajuste
- **THEN** la comparación muestra el aviso de que la lista cambió desde el ajuste

#### Scenario: Solo lectura

- **WHEN** el administrador intenta escribir en cualquiera de las dos listas
- **THEN** no cambia nada, y no hay acción para guardar ni borrar el ajuste

### Requirement: Exportar las dos listas

Desde la comparación, el admin SHALL poder exportar a CSV la lista ajustada y la generada, cada una por separado, con el mismo formato que la exportación actual (`;`, UTF-8 con BOM) y las columnas de la lista.

#### Scenario: Exportar la ajustada

- **WHEN** el administrador exporta la lista ajustada del diseño 28
- **THEN** descarga un CSV con los valores ajustados por el cliente, cuyo nombre indica que es la ajustada

### Requirement: Listado ligero en el servidor

`project-back` SHALL exponer `POST /design/bom-review`, solo para ADMIN, que pagina los diseños activos con los filtros del listado y devuelve por diseño sus datos de cabecera, sus elementos con referencia ERP, el estado de su lista y el autor y la fecha del ajuste, si lo hay. SHALL NOT devolver el contenido de las hojas. El estado *sin estructura BOM* / *generable* SHALL calcularse con la misma regla de prefijo que la búsqueda de estructuras.

#### Scenario: Mismo estado que el cliente

- **WHEN** se pide el listado y el diseño 28 tiene la referencia `1-25-220-120-CV-CT-NTCA-CO-ST`
- **THEN** su estado es *generable*, porque `1-25-220-120` es prefijo, igual que en `GET /bill-of-materials/search`

#### Scenario: Diseñador

- **WHEN** un usuario con rol DESIGN llama a `POST /design/bom-review`
- **THEN** recibe 403
