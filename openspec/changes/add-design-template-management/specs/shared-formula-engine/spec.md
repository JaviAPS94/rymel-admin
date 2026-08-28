## ADDED Requirements

### Requirement: Separador de argumentos regional

El motor SHALL aceptar `;` además de `,` como separador de argumentos de función, porque es la convención con la que Excel produce las fórmulas en la configuración regional del negocio y con la que están escritas las plantillas existentes.

Ambos separadores SHALL producir el mismo resultado para la misma fórmula.

El motor SHALL NOT interpretar un `;` dentro de un literal de texto como separador.

#### Scenario: Función con separador de punto y coma

- **WHEN** se evalúa `=BUSCARV(G13;B3:C10;2;VERDADERO)`
- **THEN** el resultado es el mismo que el de la fórmula equivalente escrita con comas

#### Scenario: Punto y coma dentro de un texto

- **WHEN** se evalúa `=CONCATENAR("a;b"; "c")`
- **THEN** el primer argumento conserva el `;` de su contenido

### Requirement: Rangos calificados por hoja en ambos extremos

El motor SHALL admitir un rango cuya hoja se califica en los dos extremos (`Tablas!B45:Tablas!C156`), además de la forma con prefijo único (`Tablas!B45:C156`).

Ambas formas SHALL producir el mismo conjunto de celdas y el mismo resultado.

Los precedentes de un rango calificado SHALL ser **todas** las celdas del rango, no solo sus extremos, de modo que un cambio en cualquier celda interior dispare el recálculo de quien lo consulta.

Un rango cuyos dos extremos califiquen hojas distintas SHALL ser un error de fórmula.

#### Scenario: Rango calificado en ambos extremos

- **WHEN** se evalúa `=SUMA(Tablas!B2:Tablas!B9)`
- **THEN** el resultado es el mismo que el de `=SUMA(Tablas!B2:B9)`

#### Scenario: Precedentes completos de un rango calificado

- **WHEN** se extraen los precedentes de `=BUSCARV(A1;Tablas!B45:Tablas!C156;2;VERDADERO)`
- **THEN** aparecen todas las celdas entre `Tablas!B45` y `Tablas!C156`, no solo esos dos extremos

#### Scenario: Recálculo por un cambio interior al rango

- **WHEN** cambia `Tablas!C100` y otra hoja consulta `Tablas!B45:Tablas!C156`
- **THEN** la celda que lo consulta entra en el recálculo

#### Scenario: Extremos de hojas distintas

- **WHEN** se evalúa una fórmula con el rango `Tablas!B2:Resumen!B9`
- **THEN** la celda da error de fórmula

### Requirement: Las celdas de gráfico no se evalúan

Una celda cuyo contenido es una directiva de gráfico —el texto empieza por `DRAW:`, con o sin el `=` inicial— SHALL reconocerse como tal y SHALL NOT evaluarse como fórmula.

El motor SHALL conservar el contenido de esa celda íntegro como su valor, sin el `=` inicial si lo tuviera, que es la forma que el renderizador espera.

El motor SHALL NOT registrar precedentes para una celda de gráfico: las referencias que la directiva menciona son argumentos del dibujo, no dependencias de cálculo, y leerlas como rangos genera aristas falsas en el grafo.

#### Scenario: Directiva con signo igual

- **WHEN** se evalúa una celda cuyo contenido es `=DRAW:BOBINADO:D56:D59,D60,D61,D62`
- **THEN** su valor es `DRAW:BOBINADO:D56:D59,D60,D61,D62` y no es un error

#### Scenario: Directiva sin signo igual

- **WHEN** se evalúa una celda cuyo contenido es `DRAW:FRONTAL:NUCLEO:H53,H54`
- **THEN** su valor es ese mismo texto

#### Scenario: Sin precedentes inventados

- **WHEN** se construye el grafo de una hoja con una celda `=DRAW:BOBINADO:D56:D59,D60`
- **THEN** esa celda no aporta ningún precedente al grafo

### Requirement: Análisis estático de un libro sin evaluación

El motor SHALL ofrecer un análisis estático que examine un libro completo y devuelva diagnósticos por celda **sin evaluar ninguna fórmula y sin invocar el puerto de funciones personalizadas**.

El análisis SHALL reportar, como mínimo:

- fórmulas con sintaxis inválida;
- referencias a hojas que no existen en el libro;
- referencias de celda y rangos mal formados;
- invocaciones a funciones que no son incorporadas ni pertenecen al catálogo de funciones personalizadas que se le entregue;
- invocaciones a funciones personalizadas con una cantidad de argumentos distinta de la declarada;
- celdas que forman parte de una referencia circular.

Cada diagnóstico SHALL identificar la celda por su referencia canónica e incluir un motivo legible.

El análisis SHALL NOT realizar ninguna operación asíncrona.

#### Scenario: Función desconocida

- **WHEN** se analiza un libro con `=CUBIC(A1)` y `CUBIC` no está en el catálogo entregado
- **THEN** se devuelve un diagnóstico para esa celda indicando que el código no existe

#### Scenario: Hoja inexistente

- **WHEN** una celda de `Hoja2` referencia `'Hoja9'!A1` y el libro no tiene `Hoja9`
- **THEN** se devuelve un diagnóstico para esa celda indicando la hoja no encontrada

#### Scenario: Cantidad de argumentos incorrecta

- **WHEN** una celda invoca una función personalizada de dos variables con un solo argumento
- **THEN** se devuelve un diagnóstico para esa celda indicando la discrepancia

#### Scenario: Ciclo detectado sin evaluar

- **WHEN** el libro contiene un ciclo entre celdas de dos hojas distintas
- **THEN** todas las celdas del ciclo aparecen en los diagnósticos como circulares

#### Scenario: Sin llamadas al puerto

- **WHEN** se analiza un libro que invoca funciones personalizadas
- **THEN** el puerto de resolución no se invoca ninguna vez

#### Scenario: Libro válido

- **WHEN** se analiza un libro sin problemas
- **THEN** se devuelve una lista vacía de diagnósticos

#### Scenario: La plantilla real no produce falsos positivos

- **WHEN** se analiza el libro de la plantilla `TEMPLATE_1F_0001`, con sus fórmulas escritas con `;`, sus rangos calificados en ambos extremos y su celda de gráfico
- **THEN** no se devuelve ningún diagnóstico
