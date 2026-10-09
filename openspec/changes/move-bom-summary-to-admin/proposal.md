## Why

La pestaña «LISTA DE MATERIALES» del diseñador (`project-front`, `BomSummaryTab`) es lo último de la lista de materiales que sigue en el cliente. El change `move-template-authoring-to-admin` llevó al admin toda la **configuración** del BOM —tablas de catálogo, zonas de semielaborado, condiciones e ítem vinculado—, pero dejó en el cliente el **resultado**: el desglose de materiales de cada diseño. El responsable del producto pidió, el 2026-10-08, que también se administre desde el admin y se retire del cliente.

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

**Cliente: se retira la pestaña**

- Se quitan la pestaña, `BomSummaryTab`, `buildBomSummary`, la API `billOfMaterialsApi` —que solo usaba la pestaña— y el videotutorial de BOM, que enseñaba a generar la lista desde la pestaña.
- El diseñador sigue viendo en su hoja las marcas de la configuración (zonas, ítems vinculados), que vienen de la plantilla.

**Servidor: listado de diseños sin país obligatorio**

- `POST /design/by-filters-paginated` filtraba siempre por país, y sin país no devolvía nada. El filtro pasa a aplicarse solo si llega, para que el admin pueda listar todos los diseños. El cliente siempre lo envía, así que para él nada cambia.

**Fuera de alcance**

- Guardar la lista editada.
- Armar la lista en el servidor: se decidió mantenerla en la pantalla, tal como funciona hoy en el cliente (ver `design.md`, decisión 1).
- Corregir que 19 de 21 diseños no tengan estructura BOM: es un dato que falta en el ERP, no un defecto.

## Capabilities

### New Capabilities

- `design-bom-summary`: la lista de materiales de un diseño, consultada y exportada desde el admin, con las reglas de armado que hoy aplica el cliente, y su retirada del cliente.

### Modified Capabilities

_Ninguna._ La pestaña del cliente no estaba especificada.

## Impact

- **`project-admin`**: página `DesignBomPage` con ruta `/design-bom` (solo ADMIN) y entrada en el menú; servicio de diseños; búsqueda de BOM por código en `bomService`; `buildBomSummary` portado con su prueba de paridad contra la salida del cliente; exportación CSV.
- **`project-front`**: se retiran la pestaña y su código, la API de BOM y el videotutorial. Los scripts que usaban `buildBomSummary` dejan de hacerlo.
- **`project-back`**: el filtro de país del listado de diseños pasa a ser opcional.
- **Datos**: ninguno.
