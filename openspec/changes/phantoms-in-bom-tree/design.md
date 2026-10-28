## Context

- El árbol de una estructura es `bill_of_materials_node`: cada nodo apunta a un semielaborado (`semi_finished_id`, obligatorio), tiene un tipo (Estándar, Crítico, Referencia) y un padre. `GET bill-of-materials/:id` lo devuelve anidado (`buildTree`) y eliminar un nodo da de baja su subárbol.
- Ese árbol lo leen cuatro sitios que solo entienden semielaborados: `buildBomSummaryCells` y `buildBomBaseSheet` en `@rymel/design-template` (usan `node.semiFinished.id` para las zonas y los accesorios), el cliente (`billOfMaterialsApi`) y «Diseños» en el admin.
- Los fantasmas se organizan en proceso → familia → fantasma (`phantom_process`, `phantom_family`, `phantom_item.family_id`). Las familias no se borran, solo se renombran; un proceso solo se da de baja si está vacío.
- El editor de la estructura (`BomEditorPage`) es árbol a la izquierda y panel lateral con las acciones del nodo seleccionado; los nodos se crean con `BomNodeFormModal`.

## Goals / Non-Goals

**Goals:** que el administrador cuelgue familias de fantasmas de los semielaborados del árbol, que declare los Tipos PT de la estructura, y que vea en el editor qué fantasmas ofrecerá cada familia.

**Non-Goals:** acotar tipos en la plantilla; elegir el fantasma concreto en el diseño; meter los componentes del fantasma en la lista de materiales; mover familias entre semielaborados arrastrando.

## Decisions

### 1. Las familias en una tabla propia, no como nodos del árbol

`bill_of_materials_node_phantom_family (id, node_id, phantom_family_id, position, created_at, deleted_at)`, con único `(node_id, phantom_family_id)` entre las no dadas de baja. El detalle añade a cada nodo `phantomFamilies: [{ id, family: { id, name }, process: { id, name }, offered }]`.

*Alternativa descartada:* hacer `semi_finished_id` opcional en `bill_of_materials_node` y añadir `phantom_family_id`. Es lo más directo en la tabla, pero cada consumidor del árbol recibiría nodos sin `semiFinished`: `buildBomBaseSheet` y `buildBomSummaryCells` fallarían en `node.semiFinished.id`, y habría que publicar otra versión del paquete y tocar el cliente solo para que los ignoren. Además permitiría familias raíz, familias con hijos y familias con tipo, que no significan nada y habría que prohibir a mano. Con la tabla aparte, el árbol de semielaborados queda igual byte a byte y las reglas («cuelga de un semielaborado», «es hoja») salen de la forma de los datos.

*Alternativa descartada:* colgar fantasmas concretos. Una familia tiene hasta 184 fantasmas y el cliente pidió que el concreto se elija después.

### 2. Tipos PT: tabla `bill_of_materials_product_type`, elegidos de los existentes

`(id, bill_of_materials_id, code)`, único `(bill_of_materials_id, code)`. Se fijan con `PUT bill-of-materials/:id/product-types { codes: string[] }` (reemplaza la lista). Las opciones salen de `GET phantom-items/product-types` (distintos `finished_product_type` con su cuenta).

El código se guarda como texto tal cual, sin normalizar: los 35 valores reales incluyen «3PRM/PM» y «3SEH-1,2», y cualquier normalización inventaría una regla que el negocio no ha dado. La coincidencia es exacta (sin distinguir mayúsculas ni espacios de los extremos, como `getOrCreateFamily`).

*Alternativa descartada:* catálogo propio de Tipos PT. Sería la opción limpia, pero el dato maestro hoy está en los fantasmas y duplicarlo exige mantenerlos a mano. Si aparece el catálogo, la tabla de la estructura pasa a apuntarle sin cambiar la UI.

*Alternativa descartada:* columna JSON en `bill_of_materials`. No se puede consultar ni filtrar con `EXISTS` como las demás relaciones del módulo.

### 3. Lo que ofrece una familia lo calcula el servidor

`offered` (cuántos fantasmas ofrece) va en el detalle, con un solo `GROUP BY family_id` filtrado por los tipos. La lista de esos fantasmas sale de `GET bill-of-materials/:id/phantom-families/:familyId/items` (código, referencia, Tipo PT, componentes) y solo se pide al seleccionar la familia. El siguiente cambio (elegir el fantasma en el diseño) reutiliza ese mismo endpoint, con la plantilla acotando más.

### 4. UI: el árbol de siempre, una acción más en el semielaborado

- **Panel del semielaborado seleccionado:** botón «Agregar fantasmas» debajo de «Agregar hijo».
- **Modal «Agregar fantasmas a ENSAMBLEFINAL»:** buscador y lista de familias agrupadas por proceso (en el orden de los procesos), cada una con casillas, su número de fantasmas ofrecidos y las ya agregadas deshabilitadas con «ya agregada». Agrega varias de una vez. Es selección múltiple porque un semielaborado suele llevar varias familias del mismo proceso (ARMADO Y CONEXIÓN tiene tres).
- **Nodo de familia en el árbol:** pastilla con borde discontinuo violeta y el icono de fantasma de Tabler, «F. Emblemas · EMBLEMADO» y «22 fantasmas»; en ámbar con aviso cuando ofrece cero. Va después de los hijos semielaborados, para que la jerarquía de semielaborados se siga leyendo igual.
- **Panel de la familia seleccionada:** nombre, proceso, tabla compacta de los fantasmas ofrecidos (código, referencia, Tipo PT, componentes) con scroll, enlace «Ver en Fantasmas» y «Quitar del árbol».
- **Cabecera:** fila «Tipos de equipo» con etiquetas y botón «Editar», que abre un selector múltiple con buscador y la cuenta de cada tipo; sin tipos, el aviso del spec. La leyenda suma «Familia de fantasmas».

*Alternativa descartada:* elegir semielaborado o familia en el mismo `BomNodeFormModal`. Mezcla dos cosas con reglas distintas (la familia no tiene tipo ni hijos), y el modal de semielaborado elige uno solo.

*Alternativa descartada:* arrastrar familias desde un panel de biblioteca al árbol. Es más vistoso, pero el árbol actual no tiene arrastre y con 11 familias una lista con casillas es más rápida y accesible.

### 5. Bajas en cascada y procesos en uso

`removeNode` da de baja también las familias de los nodos del subárbol. `PhantomProcessService.remove` rechaza dar de baja un proceso con familias en alguna estructura activa y nombra las estructuras.

## Risks / Trade-offs

- **[Riesgo] Los Tipos PT tienen variantes de escritura** («3SEH-1,2» y «SEH1.2»). → Se muestran tal cual, con su cuenta, para que el administrador vea las dos y elija; limpiarlos es tarea de datos en la sección «Fantasmas».
- **[Riesgo] Un fantasma cambia de familia o de Tipo PT.** → `offered` se calcula al leer, nunca se guarda; el árbol siempre refleja los fantasmas de ahora.
- **[Trade-off] Las familias no se reordenan dentro del semielaborado.** → `position` queda por orden de alta; reordenar se añade si se pide.
- **[Trade-off] El rol NORM también edita estructuras** y por tanto familias y tipos, igual que los nodos de hoy.

## Migration Plan

Una migración crea las dos tablas; no toca datos existentes. Retroceso: bajar la migración; el árbol de semielaborados no depende de ellas.

## Open Questions

- ¿El Tipo PT es el único filtro de la estructura, o también el Tipo PP? En la reunión solo se habló de los tipos de equipo; se deja solo Tipo PT.
