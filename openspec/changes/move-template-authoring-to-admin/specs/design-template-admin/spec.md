## ADDED Requirements

### Requirement: Menú contextual de la rejilla

El editor SHALL ofrecer un menú contextual al hacer clic derecho sobre una celda, una cabecera de fila o una cabecera de columna. El menú SHALL reunir todas las acciones de configuración que el diseñador tenía en `project-front`, y SHALL operar sobre la selección vigente.

Menú de celda:

- combinar celdas, si la selección abarca más de una; separar, si la celda forma parte de una combinación;
- inmovilizar paneles en la celda; movilizarlos, si hay paneles inmovilizados;
- añadir o editar nota; quitarla, si la celda tiene una;
- etiquetar la celda como Material del Núcleo (MO) o como Material de Devanado (MD); quitar la etiqueta, si la tiene;
- configurar o editar `goTo`; quitarlo, si lo tiene;
- etiquetar la selección como rango con nombre;
- asignar la selección a una zona de semielaborado, o editar y quitar la zona que contiene la celda;
- marcar la selección como tabla de catálogo, o editar y quitar la tabla que contiene la celda;
- vincular la celda a un ítem de catálogo, cambiar el ítem vinculado o quitar el vínculo;
- configurar las celdas de condición del vínculo al catálogo.

Menú de fila y de columna: ocultar, mostrar las ocultas e inmovilizar hasta esa fila o columna, o movilizar.

Cada acción del menú SHALL producir el mismo efecto sobre el documento que su equivalente en la barra de formato o en los paneles laterales, y SHALL entrar en el historial de deshacer.

#### Scenario: Clic derecho sobre una celda fuera de la selección

- **WHEN** el autor tiene seleccionado `B2:C4` y hace clic derecho sobre `F10`
- **THEN** la selección pasa a ser `F10` y el menú opera sobre ella, como en una hoja de cálculo

#### Scenario: Clic derecho dentro de la selección

- **WHEN** el autor tiene seleccionado `B2:C4` y hace clic derecho sobre `C3`
- **THEN** la selección se conserva, y «Etiquetar rango como tabla» propone `B2:C4`

#### Scenario: Acciones según el estado de la celda

- **WHEN** el autor abre el menú sobre una celda que ya tiene nota y `goTo`
- **THEN** el menú ofrece «Editar nota», «Quitar nota», «Editar Ir a…» y «Quitar Ir a», y no «Agregar nota» ni «Configurar Ir a…»

#### Scenario: Región que contiene la celda

- **WHEN** el autor abre el menú sobre una celda que está dentro de una zona de semielaborado
- **THEN** el menú ofrece editar esa zona, mostrando su código, y quitarla

#### Scenario: Deshacer una acción del menú

- **WHEN** el autor combina celdas desde el menú y pulsa deshacer
- **THEN** la combinación desaparece y el documento vuelve exactamente al estado anterior

#### Scenario: El menú no sale de la pantalla

- **WHEN** el autor abre el menú cerca del borde inferior o derecho de la ventana
- **THEN** el menú se recoloca para quedar entero dentro de la ventana

### Requirement: Etiqueta de material exclusiva en toda la plantilla

El editor SHALL permitir etiquetar una celda como MO o como MD. Cada etiqueta SHALL existir en una sola celda de toda la plantilla: al asignarla, se SHALL quitar de la celda que la tuviera, en cualquier hoja, en un solo paso de historial. La rejilla SHALL señalar las celdas etiquetadas.

#### Scenario: Reasignar una etiqueta entre hojas

- **WHEN** `Resumen!D3` es MO y el autor etiqueta `Tablas!B5` como MO
- **THEN** `Tablas!B5` queda como MO, `Resumen!D3` queda sin etiqueta, y deshacer restaura las dos celdas a la vez

#### Scenario: Las dos etiquetas conviven

- **WHEN** `D3` es MO y el autor etiqueta `D4` como MD
- **THEN** `D3` sigue siendo MO y `D4` pasa a ser MD

#### Scenario: Señalización

- **WHEN** una celda lleva etiqueta MO o MD
- **THEN** la rejilla la marca con la etiqueta, distinguiendo MO de MD

### Requirement: Configuración del vínculo al catálogo

El editor SHALL permitir declarar en una celda sus celdas de condición de catálogo (`catalogConditionCells`): las celdas cuyos valores se comparan con las etiquetas de las tablas de catálogo para decidir a cuál se enruta. SHALL aceptar referencias separadas por coma, normalizarlas a mayúsculas y rechazar las que no sean referencias válidas. La rejilla SHALL señalar las celdas que tienen condiciones.

#### Scenario: Declarar condiciones

- **WHEN** el autor configura en `B7` las condiciones `b5, c5`
- **THEN** la celda guarda `["B5", "C5"]` y se marca como enrutada al catálogo

#### Scenario: Referencia inválida

- **WHEN** el autor escribe `B5, XX`
- **THEN** el editor rechaza `XX` señalándolo, y no guarda una lista a medias

#### Scenario: Quitar condiciones

- **WHEN** el autor deja la lista vacía
- **THEN** la celda deja de tener `catalogConditionCells`

### Requirement: Selector de ítem de catálogo

Vincular una celda a un ítem SHALL hacerse eligiendo una fila de una tabla de catálogo, y no escribiendo su identificador. El selector SHALL mostrar las filas de datos de las tablas de catálogo de la plantilla —identificador, descripción y unidad de medida, leídos con los desplazamientos de cada tabla y sin sus filas de encabezado—, y SHALL permitir buscar por identificador y por descripción.

Si la celda tiene condiciones de catálogo, el selector SHALL ofrecer por omisión solo las tablas cuyas etiquetas contienen **todos** los valores de las condiciones —comparados sin distinguir mayúsculas y usando el valor calculado de la vista previa—, y SHALL permitir ver todas las tablas. Si ninguna tabla coincide, SHALL decirlo y ofrecer verlas todas.

#### Scenario: Enrutado por condiciones

- **WHEN** `B7` tiene como condición `B5`, `B5` vale `Aluminio`, y hay dos tablas etiquetadas `aluminio, rectangular` y `cobre`
- **THEN** el selector abre mostrando solo la tabla de aluminio, con un control para ver todas

#### Scenario: Elegir un ítem

- **WHEN** el autor elige la fila con identificador `AL-003`
- **THEN** la celda guarda un `itemLink` con la hoja, la tabla y el identificador `AL-003`, y la rejilla muestra a qué ítem apunta

#### Scenario: Plantilla sin tablas de catálogo

- **WHEN** el autor abre el selector y la plantilla no declara ninguna tabla de catálogo
- **THEN** el selector explica que primero hay que marcar una tabla de catálogo, y cómo hacerlo desde el menú contextual

#### Scenario: Condición con valor de elemento

- **WHEN** una condición depende de una celda enlazada a un dato del elemento
- **THEN** el selector usa el valor de prueba de la vista previa para esa clave, y avisa de que el enrutado real dependerá del elemento

### Requirement: Rastreo de precedentes y dependientes

Al seleccionar una celda, el editor SHALL resaltar en la rejilla sus precedentes directos (celdas y rangos que su fórmula referencia) y sus dependientes directos (celdas cuya fórmula la referencia), con dos colores distintos y distinguibles de la selección. Un panel de rastreo SHALL listar precedentes y dependientes, incluidos los de otras hojas, y SHALL llevar a cada uno con un clic.

El autor SHALL poder pedir la cadena completa de precedentes: todos los transitivos, hasta llegar a literales, celdas enlazadas al elemento o celdas vacías, señalando cada tipo de origen.

El rastreo SHALL usar el grafo de dependencias que el editor ya mantiene para recalcular. SHALL NOT construir otro, para no poder discrepar del cálculo.

Una invocación a una fórmula de diseño SHALL mostrarse como tal —código y celdas de sus argumentos—, y SHALL NOT mostrar su expresión.

Esta herramienta SHALL existir solo en el editor de plantillas.

#### Scenario: Precedentes en la misma hoja

- **WHEN** el autor selecciona `G17`, cuya fórmula es `=G14*(BUSCARV(G13;Tablas!B3:Tablas!C10;2;FALSO))`
- **THEN** `G14` y `G13` se resaltan como precedentes, y el panel lista `Tablas!B3:C10` como precedente en otra hoja, con un enlace que lleva a él

#### Scenario: Dependientes

- **WHEN** el autor selecciona `Tablas!J14`, que es referenciada por dos celdas de `Resumen`
- **THEN** el panel lista esas dos celdas como dependientes y, al ir a `Resumen`, aparecen resaltadas

#### Scenario: Cadena completa

- **WHEN** el autor pide la cadena completa de una celda que depende de `A5`, que depende de `B2` (literal) y de `C3` (enlazada a `power`)
- **THEN** el panel muestra los tres niveles e identifica `B2` como literal y `C3` como dato del elemento `power`

#### Scenario: Celda circular

- **WHEN** la celda seleccionada forma parte de un ciclo
- **THEN** el rastreo termina sin bucle infinito y marca las celdas del ciclo

#### Scenario: Celda sin fórmula

- **WHEN** el autor selecciona un literal referenciado por otras celdas
- **THEN** no se resaltan precedentes y sí sus dependientes

### Requirement: Declaración de zonas de solo lectura

El editor SHALL permitir declarar la selección como zona de solo lectura desde el menú contextual («Proteger como solo lectura») y desde el panel de regiones, y quitarla desde los mismos lugares. La rejilla SHALL señalar las celdas protegidas. Las zonas SHALL entrar en el historial de deshacer.

La zona SHALL restringir al diseñador, no al autor: en el editor de plantillas, las celdas protegidas se siguen editando con normalidad.

#### Scenario: Proteger una tabla de referencia

- **WHEN** el autor selecciona `Tablas!B3:C10` y elige «Proteger como solo lectura»
- **THEN** la hoja `Tablas` gana una zona de solo lectura `B3:C10`, señalada en la rejilla

#### Scenario: El autor edita dentro de una zona

- **WHEN** el autor escribe en una celda protegida
- **THEN** la edición se acepta

#### Scenario: Quitar una zona

- **WHEN** el autor abre el menú sobre una celda protegida
- **THEN** el menú ofrece «Quitar solo lectura» de la zona que la contiene
