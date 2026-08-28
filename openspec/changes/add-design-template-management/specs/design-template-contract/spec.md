## ADDED Requirements

### Requirement: Paquete de contrato compartido y portable

El contrato de la plantilla de diseño SHALL vivir en un paquete propio, `@rymel/design-template`, consumido por `project-admin`, `project-back` y `project-front`.

El paquete SHALL NOT depender de React, de módulos de Node ni de APIs de navegador. Su única dependencia de runtime permitida es `@rymel/formula-engine`.

El paquete SHALL distribuirse como dependencia de git con tag inmutable, igual que el motor de fórmulas, y cada consumidor SHALL fijar su versión explícitamente.

El paquete SHALL declarar la versión del contrato con la que se serializó un documento, de modo que un consumidor pueda detectar que recibió una plantilla escrita con una versión posterior a la suya.

#### Scenario: Verificación de portabilidad en el build

- **WHEN** se construye el paquete
- **THEN** falla si alguna importación resuelve a React, a un módulo de Node o a una API de navegador

#### Scenario: Consumo desde el servidor

- **WHEN** `project-back` valida un documento de plantilla
- **THEN** usa el mismo código de validación que el editor, sin navegador

### Requirement: Modelo canónico de la plantilla

El paquete SHALL definir el documento de plantilla como sus metadatos (nombre, código, descripción, tipo, subtipo, estado y versión) más una lista **ordenada** de hojas.

Cada hoja SHALL tener nombre, posición explícita, un mapa de celdas y sus estilos de hoja.

Una celda SHALL poder declarar: su contenido (`formula`, sea fórmula o literal), sus estilos de presentación (negrita, color de texto, color de fondo, bordes por lado, decimales, formato condicional), su nota, sus opciones de lista desplegable, su enlace a un dato del elemento (`elementKey`), su configuración de navegación (`goTo`), su enlace a un ítem de catálogo (`itemLink`), sus celdas de condición de catálogo, su marca de material (`materialTag`) y su nodo de BOM asociado.

Los estilos de hoja SHALL incluir anchos de columna, altos de fila, filas y columnas ocultas, filas y columnas inmovilizadas, celdas combinadas, rangos con nombre, zonas de semielaborado y tablas de catálogo de ítems.

Los nombres de hoja SHALL ser únicos dentro de una plantilla, porque las referencias entre hojas se resuelven por nombre.

#### Scenario: Nombres de hoja duplicados

- **WHEN** un documento declara dos hojas con el mismo nombre
- **THEN** la validación lo rechaza indicando cuál es el nombre repetido

#### Scenario: Posición de hoja explícita

- **WHEN** un documento se serializa
- **THEN** cada hoja lleva una posición distinta y consecutiva desde 0

### Requirement: Serialización entre forma persistida y forma runtime

El paquete SHALL ser el único lugar del sistema que traduce entre la forma persistida de una plantilla y la forma que consume un editor o un visor.

La traducción SHALL preservar íntegramente los conjuntos de filas y columnas ocultas: una plantilla que se serializa y se vuelve a leer SHALL producir un documento equivalente al original.

El nombre canónico de los campos de ocultamiento SHALL ser `hiddenRows` y `hiddenColumns`. Durante la ventana de compatibilidad, el serializador SHALL escribir además `templateHiddenRows` y `templateHiddenColumns` con el mismo contenido, marcados como obsoletos, para que un consumidor que aún lea los nombres antiguos siga funcionando.

Al leer, el paquete SHALL aceptar cualquiera de los dos nombres y SHALL preferir el canónico cuando ambos estén presentes y difieran.

#### Scenario: Ida y vuelta sin pérdida

- **WHEN** se serializa un documento con filas ocultas y se vuelve a leer
- **THEN** las filas ocultas siguen ocultas y el documento resultante es equivalente al original

#### Scenario: Lectura de una plantilla escrita con los nombres antiguos

- **WHEN** se lee una plantilla cuyos estilos solo traen `templateHiddenRows`
- **THEN** esas filas quedan como ocultas en el documento leído

#### Scenario: Escritura compatible

- **WHEN** se serializa una hoja con columnas ocultas
- **THEN** el resultado contiene tanto `hiddenColumns` como `templateHiddenColumns` con el mismo contenido

### Requirement: Los campos espejo son una ventana con condición de cierre

El serializador SHALL escribir en espejo los campos que un consumidor todavía no migrado necesita leer: `templateHiddenRows`, `templateHiddenColumns`, `value` y `catalogSheetId`.

Cada campo espejo SHALL estar marcado como obsoleto en el propio contrato, junto con el consumidor que lo mantiene vivo.

El espejo SHALL retirarse cuando ningún consumidor lo lea, y esa retirada SHALL ser un cambio de versión mayor del contrato.

#### Scenario: Contenido espejado en `value`

- **WHEN** se serializa una celda
- **THEN** `value` lleva el mismo contenido que `formula`

#### Scenario: Trazabilidad del espejo

- **WHEN** se consulta la declaración de un campo espejo
- **THEN** consta que es obsoleto y qué consumidor lo sigue leyendo

### Requirement: La celda de gráfico es una clase de celda propia

El contrato SHALL distinguir tres clases de celda por su contenido: literal, fórmula y **directiva de gráfico**.

Una celda cuyo contenido empieza por `DRAW:` SHALL ser una directiva de gráfico. Al serializar, el contrato SHALL retirar el `=` inicial si lo tuviera, porque el renderizador espera la directiva sin él y no debe depender de un valor calculado persistido para encontrarla.

La validación SHALL comprobar la sintaxis de la directiva —vista reconocida, componentes reconocidos y referencias de celda bien formadas en sus argumentos— y SHALL reportar un diagnóstico cuando no se cumpla.

Una directiva de gráfico SHALL NOT validarse como fórmula ni aportar dependencias de cálculo.

#### Scenario: Retirada del signo igual

- **WHEN** se serializa una celda cuyo contenido es `=DRAW:BOBINADO:D56:D59,D60`
- **THEN** el resultado persistido es `DRAW:BOBINADO:D56:D59,D60`

#### Scenario: Vista no reconocida

- **WHEN** una celda declara `DRAW:LATERAL:NUCLEO:H53`
- **THEN** la validación devuelve un diagnóstico indicando que la vista no existe

#### Scenario: Referencia mal formada en la directiva

- **WHEN** una celda declara `DRAW:FRONTAL:NUCLEO:H5X,H54`
- **THEN** la validación devuelve un diagnóstico señalando la referencia inválida

#### Scenario: Directiva válida

- **WHEN** se valida la celda `DRAW:BOBINADO:D56:D59,D60,D61,D62:M59,M60,M61,M62:H59,H60,H61,H62:Q59,Q60,Q61,Q62:E56:G56:H56:I56` de la plantilla real
- **THEN** no se devuelve ningún diagnóstico

### Requirement: Normalización al guardar

Al serializar, el paquete SHALL descartar toda celda sin contenido: sin fórmula, sin estilos, sin nota, sin opciones y sin enlaces.

El paquete SHALL NOT persistir el valor calculado de una celda con fórmula. El valor SHALL recalcularse al cargar.

El contenido de una celda SHALL persistirse en un solo campo. El paquete SHALL aceptar documentos antiguos que dupliquen el contenido en `value` y `formula`, tomando `formula` como fuente de verdad.

#### Scenario: Celda vacía descartada

- **WHEN** se serializa una hoja que contiene una celda solo con un valor calculado, sin contenido ni estilos
- **THEN** esa celda no aparece en el resultado

#### Scenario: Valor calculado no persistido

- **WHEN** se serializa una celda cuya fórmula es `=SUMA(A1:A5)` y cuyo valor calculado es 30
- **THEN** el resultado conserva la fórmula y no contiene el 30

#### Scenario: Documento antiguo con contenido duplicado

- **WHEN** se lee una celda con `value` y `formula` distintos
- **THEN** se toma `formula` como contenido de la celda

### Requirement: Invariantes estructurales de una plantilla

El paquete SHALL exponer una validación que verifique, sobre un documento completo:

- que toda referencia de celda y todo rango estén bien formados;
- que los rangos con nombre, las zonas de semielaborado y las tablas de catálogo caigan dentro de la hoja que los declara;
- que dos zonas de semielaborado no se solapen, porque una celda pertenece como máximo a una zona;
- que los desplazamientos de columna de una tabla de catálogo (identificador, descripción, unidad de medida) caigan dentro del rango de la tabla;
- que todo `itemLink` apunte a una hoja y a una tabla de catálogo existentes;
- que toda celda de condición declarada en un `goTo` o en `catalogConditionCells` exista como referencia válida;
- que todo nombre de rango y toda etiqueta de condición sea no vacío.

Cada incumplimiento SHALL reportarse como un diagnóstico con su hoja, su celda o región, y un mensaje que explique qué está mal.

#### Scenario: Zona de semielaborado fuera de la hoja

- **WHEN** una zona declara `startCell` en una columna que la hoja no alcanza
- **THEN** la validación devuelve un diagnóstico que señala la zona y el límite excedido

#### Scenario: Zonas de semielaborado solapadas

- **WHEN** dos zonas comparten al menos una celda
- **THEN** la validación devuelve un diagnóstico que nombra ambas zonas y la celda en conflicto

#### Scenario: Enlace a una tabla de catálogo inexistente

- **WHEN** una celda declara un `itemLink` cuyo `catalogTableId` no existe en la hoja indicada
- **THEN** la validación devuelve un diagnóstico con la celda y el identificador no encontrado

#### Scenario: Documento válido

- **WHEN** se valida un documento sin incumplimientos
- **THEN** la validación devuelve una lista vacía de diagnósticos

### Requirement: Validación de fórmulas contra el catálogo de funciones del subtipo

La validación SHALL recibir el conjunto de funciones de diseño asignadas al subtipo de la plantilla y SHALL reportar toda invocación a un código que no pertenezca a ese conjunto.

La validación SHALL reportar las referencias a hojas inexistentes, los rangos mal formados y las referencias circulares, apoyándose en el análisis estático de `@rymel/formula-engine` y sin evaluar ninguna función personalizada.

#### Scenario: Función no asignada al subtipo

- **WHEN** una celda invoca `=CUBIC(A1)` y `CUBIC` no está asignada al subtipo de la plantilla
- **THEN** la validación devuelve un diagnóstico con la celda y el código no disponible

#### Scenario: Referencia a una hoja inexistente

- **WHEN** una celda de `Resumen` referencia `'Tablas2'!A1` y la plantilla no tiene esa hoja
- **THEN** la validación devuelve un diagnóstico con la celda y el nombre de hoja no encontrado

#### Scenario: Validación sin red

- **WHEN** se valida una plantilla que invoca funciones de diseño
- **THEN** no se realiza ninguna llamada externa para resolverlas
