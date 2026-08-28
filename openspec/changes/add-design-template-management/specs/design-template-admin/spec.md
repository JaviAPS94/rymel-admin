## ADDED Requirements

### Requirement: Sección de plantillas restringida a administradores

`project-admin` SHALL ofrecer una sección "Plantillas" accesible solo para usuarios con rol de administrador, enlazada desde el menú de administración.

Un usuario sin ese rol SHALL NOT ver la entrada de menú ni poder alcanzar la ruta directamente.

#### Scenario: Administrador entra a la sección

- **WHEN** un usuario con rol de administrador abre el menú de administración
- **THEN** ve la entrada "Plantillas" y accede al listado

#### Scenario: Usuario sin permiso intenta entrar por URL

- **WHEN** un usuario con rol de diseño navega directamente a la ruta de plantillas
- **THEN** es redirigido y no ve ningún dato de plantillas

### Requirement: Listado de plantillas

El listado SHALL mostrar las plantillas paginadas con su nombre, código, tipo, subtipo, estado, versión, número de hojas y número de celdas.

El listado SHALL permitir buscar por nombre y código, y filtrar por subtipo, tipo y estado.

El listado SHALL señalar las plantillas sin hojas, para que una plantilla vacía se distinga de una completa sin abrirla.

El listado SHALL ofrecer crear, duplicar, editar, publicar y dar de baja.

#### Scenario: Búsqueda por código

- **WHEN** el administrador escribe `TEMPLATE_3F` en la búsqueda
- **THEN** el listado muestra solo las plantillas cuyo nombre o código coincide

#### Scenario: Plantilla vacía señalada

- **WHEN** el listado incluye una plantilla sin hojas
- **THEN** aparece marcada como vacía y la marca explica que no tiene contenido que cargar

#### Scenario: Sin resultados

- **WHEN** ninguna plantilla coincide con los filtros
- **THEN** se muestra un estado vacío que lo indica y permite limpiar los filtros

#### Scenario: Duplicar una plantilla

- **WHEN** el administrador duplica una plantilla
- **THEN** se crea una copia en borrador con código nuevo y el editor la abre

### Requirement: Editor de hojas

El editor SHALL permitir crear, renombrar, reordenar, duplicar y eliminar hojas dentro de una plantilla.

El editor SHALL impedir dos hojas con el mismo nombre y SHALL explicar por qué, dado que las referencias entre hojas se resuelven por nombre.

Al renombrar una hoja, el editor SHALL advertir cuántas fórmulas la referencian por su nombre anterior.

#### Scenario: Nombre de hoja repetido

- **WHEN** el administrador renombra una hoja con el nombre de otra existente
- **THEN** el editor rechaza el cambio y explica que los nombres de hoja deben ser únicos

#### Scenario: Renombrar una hoja referenciada

- **WHEN** el administrador renombra una hoja a la que apuntan 8 fórmulas de otra hoja
- **THEN** el editor advierte cuántas fórmulas quedarían afectadas antes de confirmar

#### Scenario: Eliminar una hoja

- **WHEN** el administrador elimina una hoja
- **THEN** el editor pide confirmación y las hojas restantes quedan renumeradas de forma consecutiva

### Requirement: Edición de celdas con recálculo en toda la plantilla

El editor SHALL permitir escribir en una celda un valor literal o una fórmula, mediante edición en la propia celda y mediante una barra de fórmulas.

El editor SHALL recalcular, tras cada edición, la celda modificada y todas las que dependan de ella, **aunque estén en otra hoja de la misma plantilla**.

El editor SHALL señalar las celdas que forman parte de una referencia circular.

El editor SHALL ofrecer deshacer y rehacer sobre las ediciones de celdas.

#### Scenario: Edición que afecta a otra hoja

- **WHEN** el administrador cambia `Tablas!J14` y una fórmula de `Resumen` la consulta con `VLOOKUP`
- **THEN** la celda de `Resumen` se recalcula sin cambiar de hoja ni volver a cargar

#### Scenario: Referencia circular

- **WHEN** el administrador escribe una fórmula que crea un ciclo
- **THEN** las celdas del ciclo quedan marcadas como circulares y el editor lo indica

#### Scenario: Referencia a una hoja inexistente

- **WHEN** el administrador escribe `='Tablas2'!A1` y la plantilla no tiene esa hoja
- **THEN** la celda queda en error y el editor explica que la hoja no existe

#### Scenario: Deshacer

- **WHEN** el administrador deshace la última edición
- **THEN** la celda vuelve a su contenido anterior y los valores dependientes se recalculan

### Requirement: Edición de presentación y estructura de la hoja

El editor SHALL permitir aplicar a una celda o a una selección: negrita, color de texto, color de fondo, bordes por lado, número de decimales, formato condicional por rango de valores, nota y lista de opciones desplegables.

El editor SHALL permitir ajustar anchos de columna y altos de fila, ocultar y mostrar filas y columnas, inmovilizar filas y columnas, y combinar y separar celdas.

Las filas y columnas que el administrador oculte SHALL persistirse como ocultas de la plantilla, de modo que el diseñador que la cargue tampoco las vea.

#### Scenario: Ocultamiento persistente

- **WHEN** el administrador oculta las filas de cálculo intermedio y publica
- **THEN** el diseñador que carga la plantilla no ve esas filas

#### Scenario: Formato aplicado a una selección

- **WHEN** el administrador selecciona un rango y aplica borde y negrita
- **THEN** todas las celdas de la selección quedan con ese formato

#### Scenario: Combinar celdas

- **WHEN** el administrador combina un rango
- **THEN** el rango queda como una sola celda visible y su contenido es el de la celda superior izquierda

### Requirement: Editores de región

El editor SHALL permitir declarar y modificar, sobre un rango seleccionado:

- **rangos con nombre**, con su nombre y sus etiquetas de condición;
- **zonas de semielaborado**, eligiendo el semielaborado del catálogo que `project-admin` ya administra;
- **tablas de catálogo de ítems**, con sus filas de encabezado y los desplazamientos de columna de identificador, descripción y unidad de medida.

El editor SHALL permitir configurar en una celda su navegación `goTo` con sus celdas de condición, y su enlace a un ítem de una tabla de catálogo.

El editor SHALL mostrar las regiones sobre la rejilla, cada zona de semielaborado con el color que le corresponde por su código.

El editor SHALL impedir declarar una región inválida y SHALL explicar el motivo.

#### Scenario: Zona de semielaborado sobre el catálogo real

- **WHEN** el administrador declara una zona de semielaborado
- **THEN** elige el semielaborado de la lista de los existentes, no lo escribe a mano

#### Scenario: Zonas solapadas

- **WHEN** el administrador declara una zona que invade otra ya existente
- **THEN** el editor la rechaza y señala la zona en conflicto

#### Scenario: Tabla de catálogo con desplazamiento fuera de rango

- **WHEN** el administrador declara una tabla cuyo desplazamiento de descripción cae fuera del rango
- **THEN** el editor lo rechaza indicando el límite del rango

#### Scenario: Enlace de celda a ítem

- **WHEN** el administrador enlaza una celda a una fila de una tabla de catálogo
- **THEN** la celda queda marcada como enlazada y muestra a qué tabla e ítem apunta

### Requirement: Declaración de celdas enlazadas al elemento

El editor SHALL permitir marcar una celda como enlazada a un dato del elemento mediante su clave, y SHALL señalar visualmente todas las celdas enlazadas.

El editor SHALL advertir que el contenido de esas celdas es provisional: al cargar la plantilla, `project-front` lo sustituye por el valor del elemento.

#### Scenario: Celda enlazada señalada

- **WHEN** el administrador marca una celda con la clave de un dato del elemento
- **THEN** la celda queda señalada y el editor indica que su valor será reemplazado al cargarse

#### Scenario: Clave vacía

- **WHEN** el administrador intenta enlazar una celda sin indicar la clave
- **THEN** el editor lo rechaza

### Requirement: Vista previa calculada

El editor SHALL ofrecer una vista previa que recalcule la plantilla completa resolviendo las funciones de diseño contra el servicio de evaluación, agrupadas por nivel de dependencia.

La vista previa SHALL permitir cargar valores de prueba para las celdas enlazadas al elemento, de modo que el resultado se parezca al que verá el diseñador.

La vista previa SHALL informar cuántos lotes de evaluación se realizaron y SHALL indicar con claridad las celdas cuyo cálculo falló.

Si la resolución de funciones falla, el error SHALL quedar acotado a las celdas afectadas y el resto de la plantilla SHALL conservar sus valores.

#### Scenario: Vista previa con funciones de diseño

- **WHEN** el administrador ejecuta la vista previa de una plantilla con 40 celdas independientes que invocan la misma función
- **THEN** se realiza una sola llamada de evaluación para ese nivel y se informa el número de lotes

#### Scenario: Valores de prueba del elemento

- **WHEN** el administrador carga valores de prueba para las claves del elemento
- **THEN** la vista previa calcula con esos valores en las celdas enlazadas

#### Scenario: Fallo del servicio de evaluación

- **WHEN** el servicio de evaluación no responde
- **THEN** las celdas que dependían de él quedan marcadas en error y las demás conservan su valor

### Requirement: Validación visible y publicación bloqueada

El editor SHALL validar la plantilla de forma continua, sin llamadas de red, y SHALL mostrar los diagnósticos agrupados por hoja, con navegación directa a la celda o región afectada.

El editor SHALL impedir publicar mientras haya diagnósticos bloqueantes, y SHALL explicar cuáles son.

Cuando el servidor rechace una publicación, el editor SHALL mostrar los diagnósticos que devolvió el servidor.

#### Scenario: Diagnóstico navegable

- **WHEN** el editor reporta una función no asignada al subtipo
- **THEN** el administrador puede pulsar el diagnóstico y el editor lo lleva a la celda que la invoca

#### Scenario: Publicación bloqueada

- **WHEN** el administrador intenta publicar una plantilla con una referencia circular
- **THEN** el editor no publica y muestra el diagnóstico correspondiente

#### Scenario: Rechazo del servidor

- **WHEN** el servidor rechaza una publicación que el editor consideraba válida
- **THEN** el editor muestra los diagnósticos del servidor sin perder los cambios del borrador

### Requirement: Guardado explícito con protección contra pérdida

El editor SHALL indicar en todo momento si hay cambios sin guardar, y SHALL guardar únicamente las hojas modificadas.

El editor SHALL advertir antes de abandonar la página con cambios sin guardar.

Cuando el servidor informe que la plantilla fue modificada por otra sesión, el editor SHALL avisarlo y SHALL NOT sobrescribir en silencio.

#### Scenario: Guardado de las hojas modificadas

- **WHEN** el administrador edita una hoja de una plantilla de tres y guarda
- **THEN** solo se envía esa hoja

#### Scenario: Salida con cambios pendientes

- **WHEN** el administrador intenta salir del editor con cambios sin guardar
- **THEN** se le pide confirmación

#### Scenario: Conflicto de edición

- **WHEN** el servidor informa que la plantilla cambió desde que se cargó
- **THEN** el editor lo advierte y ofrece recargar en vez de sobrescribir

### Requirement: Rendimiento del editor con plantillas reales

El editor SHALL renderizar la rejilla mediante una ventana virtual, mostrando solo las celdas visibles y un margen.

El editor SHALL mantener las mismas dimensiones de rejilla que el diseñador de `project-front`, para que toda plantilla escrita aquí quepa allá.

La edición de una celda SHALL NOT bloquear la escritura en plantillas del tamaño de las existentes.

#### Scenario: Plantilla grande

- **WHEN** el administrador abre una hoja con 1902 celdas que llega a la fila 232
- **THEN** la hoja se muestra y se puede escribir sin bloqueos perceptibles

#### Scenario: Límite de la rejilla

- **WHEN** el administrador intenta escribir fuera de las dimensiones admitidas
- **THEN** el editor lo impide e indica el límite
