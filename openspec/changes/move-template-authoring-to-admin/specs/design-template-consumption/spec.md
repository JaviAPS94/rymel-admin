## ADDED Requirements

### Requirement: El diseñador no configura la plantilla

El menú contextual de `project-front` SHALL dejar de ofrecer las acciones que cambian la configuración de la plantilla:

- de celda: combinar y separar celdas; inmovilizar y movilizar paneles; añadir, editar y quitar nota; etiquetar y desetiquetar MO/MD; configurar, editar y quitar `goTo`; etiquetar rango como tabla y ver tablas etiquetadas; asignar, editar y quitar zona de semielaborado; marcar, editar y quitar tabla de catálogo; vincular, cambiar y quitar ítem de catálogo; configurar vínculo al catálogo;
- de fila y de columna: inmovilizar y movilizar.

Estas acciones SHALL existir solo en el editor de plantillas de `project-admin`.

#### Scenario: Menú de celda en el diseñador

- **WHEN** un diseñador hace clic derecho sobre una celda sin `goTo`
- **THEN** el menú ofrece solo «Ocultar celda» (o «Mostrar celda», si está oculta)

#### Scenario: Menú de cabecera de fila

- **WHEN** un diseñador hace clic derecho sobre la cabecera de la fila 7
- **THEN** el menú ofrece «Ocultar fila 7» y, si hay filas ocultas por él, «Mostrar todas las filas», y no ofrece inmovilizar

#### Scenario: Sin acceso por otro camino

- **WHEN** se revisa `project-front` tras el cambio
- **THEN** no queda ningún modal, atajo ni botón que escriba `materialTag`, `goTo`, `itemLink`, `catalogConditionCells`, `note`, `namedRanges`, `semiFinishedZones`, `itemCatalogTables`, `readOnlyZones`, `mergedCells`, `freezeRow` o `freezeColumn` en las hojas del diseño

### Requirement: El diseñador conserva lo que es suyo y lo que es navegación

El menú contextual de `project-front` SHALL seguir ofreciendo:

- ocultar y mostrar celda; ocultar fila o columna y mostrar todas: estado de la sesión del diseñador, que no viaja a la plantilla;
- «Ir a tabla» en una celda con `goTo`: seguir un enlace ya configurado.

#### Scenario: Navegar con un goTo configurado en la plantilla

- **WHEN** un diseñador hace clic derecho sobre una celda cuyo `goTo` declaró la plantilla
- **THEN** el menú ofrece «Ir a tabla», que lleva al rango con nombre cuyas etiquetas coinciden con los valores de las condiciones, y no ofrece editarlo ni quitarlo

### Requirement: Lo que declara la plantilla se sigue mostrando y usando

Retirar las acciones de configuración SHALL dejar intacto todo lo que el diseñador ve y calcula a partir de ellas: las marcas de MO/MD, de ítem vinculado y de condiciones de catálogo; las notas como información de la celda; las zonas de semielaborado y las tablas de catálogo; las celdas combinadas y los paneles inmovilizados; el resumen BOM, y el código de diseño formado con los valores de las celdas MO y MD.

#### Scenario: Plantilla con BOM configurado

- **WHEN** un diseñador carga una plantilla con zonas, una tabla de catálogo, una celda con `itemLink` y celdas MO y MD
- **THEN** ve las marcas en la rejilla, el resumen BOM incluye el ítem vinculado, y el código de diseño usa los valores de MO y MD

#### Scenario: Diseños guardados con configuración propia

- **WHEN** se abren los `sub_design` 90 y 91, que llevan configuración de BOM hecha a mano
- **THEN** se abren, calculan y generan su resumen BOM igual que antes del cambio, sin poder modificar esa configuración

### Requirement: La ayuda no enseña lo que el diseñador ya no puede hacer

Los tutoriales y las instrucciones de `project-front` SHALL dejar de describir las acciones retiradas. Donde el flujo lo necesite, SHALL indicar que esa configuración viene de la plantilla, que la administra `project-admin`.

#### Scenario: Tutorial de BOM

- **WHEN** un diseñador abre la ayuda del BOM
- **THEN** no encuentra pasos de «clic derecho → Marcar como tabla de catálogo», «Asignar zona», «Configurar vínculo» ni «Vincular a item», y sí la explicación de qué ve en el resumen BOM y de dónde sale

### Requirement: El diseñador no modifica las celdas protegidas

En `project-front`, una celda para la que `isReadOnly` es verdadero SHALL NOT aceptar edición en celda, edición desde la barra de fórmulas, borrado, pegado, relleno ni corte. SHALL poder seleccionarse, copiarse y referenciarse desde el modo fórmula. Las celdas protegidas SHALL señalarse, y un intento de modificarlas SHALL explicar por qué no se puede.

La protección SHALL NOT impedir lo que no es edición del diseñador: el recálculo de fórmulas y el relleno de celdas enlazadas al elemento al cargar.

Una operación sobre un rango que incluya celdas protegidas y no protegidas SHALL aplicarse solo a las no protegidas, avisando de cuántas se omitieron.

#### Scenario: Escribir en una celda protegida

- **WHEN** un diseñador intenta escribir en `Resumen!G17`, que está en una zona de solo lectura
- **THEN** la celda no entra en edición y se muestra que está protegida por la plantilla

#### Scenario: Pegar sobre un rango mixto

- **WHEN** un diseñador pega un bloque de 3×3 cuyo destino incluye dos celdas protegidas
- **THEN** se pegan las siete no protegidas y se avisa de que se omitieron dos

#### Scenario: Referenciar una celda protegida

- **WHEN** un diseñador en modo fórmula hace clic en una celda protegida
- **THEN** la referencia se inserta en la fórmula

#### Scenario: Recálculo dentro de la zona

- **WHEN** cambia un precedente de una fórmula protegida
- **THEN** la fórmula protegida se recalcula

### Requirement: La protección viaja con el diseño y el servidor la comprueba

Las zonas de solo lectura SHALL copiarse con las hojas al guardar un diseño, de modo que un diseño reabierto siga protegido.

Al actualizar un `sub_design`, `project-back` SHALL rechazar el cambio si modifica el contenido de alguna celda protegida según la copia guardada, o si quita o reduce una zona de solo lectura. Las hojas se emparejan por el `id` de hoja que lleva la copia, y solo se comparan las que están en los dos lados. SHALL NOT comparar valores calculados, que cambian legítimamente al recalcular.

#### Scenario: Reabrir un diseño

- **WHEN** un diseñador reabre un diseño creado desde una plantilla con zonas de solo lectura
- **THEN** las mismas celdas siguen protegidas

#### Scenario: Petición que salta la interfaz

- **WHEN** llega una actualización de `sub_design` que cambia la fórmula de una celda protegida en su copia guardada
- **THEN** el servidor la rechaza nombrando la hoja y la celda

#### Scenario: Hoja reemplazada al cargar otra plantilla

- **WHEN** un diseñador carga otra plantilla sobre un diseño guardado, y las hojas protegidas se reemplazan por otras con otro `id`
- **THEN** el servidor acepta la actualización: la hoja protegida se descartó, no se modificó

#### Scenario: Recálculo legítimo

- **WHEN** llega una actualización en la que solo cambió el valor calculado de una celda protegida
- **THEN** el servidor la acepta
