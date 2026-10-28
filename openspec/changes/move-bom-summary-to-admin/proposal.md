> **Estado (2026-10-27): descartado en lo esencial.** Este change llevó la lista de materiales a una sección del admin por diseño, con búsqueda por código, y la retiró del cliente. Las dos cosas se revirtieron: la lista volvió al cliente (`bom-summary-in-client`) y la sección del admin se retiró (`bom-accessory-fields`, tarea 4). La lista la define la plantilla y la ve el cliente en su diseño; el admin no la consulta diseño por diseño. Solo queda vigente el filtro de país opcional de `POST /design/by-filters-paginated`, que sirve para listar diseños en el admin (`admin-design-browser`). Lo que sigue es el texto original, como registro.

## Why

La pestaña «LISTA DE MATERIALES» del diseñador (`project-front`, `BomSummaryTab`) es lo último de la lista de materiales que sigue en el cliente. El change `move-template-authoring-to-admin` llevó al admin toda la **configuración** del BOM —tablas de catálogo, zonas de semielaborado, condiciones e ítem vinculado—, pero dejó en el cliente el **resultado**: el desglose de materiales de cada diseño. El responsable del producto pidió, el 2026-10-08, que también se administre desde el admin y se retire del cliente. El 2026-10-27 se pidió traer la pestaña de vuelta al cliente: la lista queda en los dos lados.

Lo que hace hoy la pestaña, leído del código:

- Busca la estructura BOM del ERP por la referencia del elemento del diseño (`GET /bill-of-materials/search?code=`, que encuentra el BOM cuyo código es **prefijo** de la referencia).
- Recorre el árbol de semielaborados de hojas a raíz y, para cada uno, lista los ítems de las celdas vinculadas dentro de sus zonas —con la cantidad que tiene la celda— y los accesorios del elemento asignados a ese semielaborado.
- Lo pinta como una hoja editable, pero **lo editado no se guarda**: se pierde al salir.

Medido en la base `project` el 2026-10-08:

- Hay **21** diseños, y los 21 tienen elemento con referencia ERP.
- Solo hay **2** estructuras BOM activas, y solo una (`1-25-220-120`) es prefijo de alguna referencia. Corresponde a **2** diseños, el 28 y el 29, que son justamente los `sub_design` 90 y 91 con configuración de BOM. Los otros 19 hoy responden «no se encontró estructura».

## What Changes

**Admin: sección nueva «Lista de materiales»**

- Listado de los diseños guardados, con búsqueda por código y su elemento y referencia ERP a la vista.
- Al elegir un diseño se genera su lista **en el navegador, con las mismas reglas que hoy aplica el cliente**: misma búsqueda por prefijo, mismo recorrido del árbol y mismas fuentes (ítems vinculados en zonas y accesorios del elemento). Los semielaborados hijos se despliegan y se pliegan como hoy.
- **Una hoja que se edita como Excel**, igual que en el cliente: valores, fórmulas, formato y deshacer. Como en el cliente, lo editado no se guarda con el diseño, y desplegar un semielaborado rearma la hoja. Se exporta a CSV con lo editado. (Primero se planteó de solo lectura; el responsable del producto pidió el 2026-10-08 mantener el comportamiento del cliente.)
- Los casos que hoy fallan dicen por qué: elemento sin referencia ERP, ninguna estructura que coincida, o datos del diseño que no permiten armarla.

**Cliente: la pestaña se queda**

- Primero se retiraron la pestaña, `BomSummaryTab`, `buildBomSummary`, la API `billOfMaterialsApi` y el videotutorial de BOM. El 2026-10-27 se pidió traerlos de vuelta, y se restauraron tal como estaban.
- El diseñador sigue viendo en su hoja las marcas de la configuración (zonas, ítems vinculados), que vienen de la plantilla.
- Consecuencia: `buildBomSummary` vive en dos sitios. Las dos copias se fijan contra la misma línea base.

**Servidor: listado de diseños sin país obligatorio**

- `POST /design/by-filters-paginated` filtraba siempre por país, y sin país no devolvía nada. El filtro pasa a aplicarse solo si llega, para que el admin pueda listar todos los diseños. El cliente siempre lo envía, así que para él nada cambia.

**Fuera de alcance**

- Guardar la lista editada.
- Armar la lista en el servidor: se decidió mantenerla en la pantalla, tal como funciona hoy en el cliente (ver `design.md`, decisión 1).
- Corregir que 19 de 21 diseños no tengan estructura BOM: es un dato que falta en el ERP, no un defecto.

## Capabilities

### New Capabilities

- `design-bom-summary`: la lista de materiales de un diseño, consultada y exportada desde el admin, con las reglas de armado que aplica el cliente, que la conserva.

### Modified Capabilities

_Ninguna._ La pestaña del cliente no estaba especificada.

## Impact

- **`project-admin`**: página `DesignBomPage` con ruta `/design-bom` (solo ADMIN) y entrada en el menú; servicio de diseños; búsqueda de BOM por código en `bomService`; `buildBomSummary` portado con su prueba de paridad contra la salida del cliente; exportación CSV.
- **`project-front`**: la pestaña, su código, la API de BOM, el videotutorial y los scripts que usaban `buildBomSummary` se retiraron y se restauraron (revertido el commit `1c43522`). Sin cambio neto.
- **`project-back`**: el filtro de país del listado de diseños pasa a ser opcional.
- **Datos**: ninguno.
