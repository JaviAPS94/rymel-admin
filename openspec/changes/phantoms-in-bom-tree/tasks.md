## 1. Servidor (project-back)

- [x] 1.1 Migración: `bill_of_materials_node_phantom_family` y `bill_of_materials_product_type`, con sus únicos entre filas activas; entidades
- [x] 1.2 Detalle de la estructura: `phantomFamilies` en cada nodo (familia, proceso, `offered`) y `productTypes` en la estructura, sin cambiar los campos actuales del nodo
- [x] 1.3 `POST bill-of-materials/nodes/:nodeId/phantom-families { familyIds }` (rechaza familia inexistente y repetida) y `DELETE bill-of-materials/node-phantom-families/:id`
- [x] 1.4 `PUT bill-of-materials/:id/product-types { codes }` y `GET phantom-items/product-types` (tipos distintos con su cuenta)
- [x] 1.5 `GET bill-of-materials/:id/phantom-families/:familyId/items`: fantasmas ofrecidos con código, referencia, Tipo PT y componentes
- [x] 1.6 `removeNode` da de baja las familias del subárbol; dar de baja un proceso con familias en una estructura se rechaza nombrándola
- [x] 1.7 Pruebas del servicio y `check-bom-phantoms.ts` contra la base: agregar, repetir, filtrar por tipos (F. Emblemas con 1CA y 3CATC ofrece 22), sin tipos ofrece todos, cascada, proceso en uso, y que el árbol sin `phantomFamilies` es el mismo que antes. `check-bom-phantoms.ts`: 22/22 contra la base, que queda como estaba. Y la prueba de `PhantomProcessService` para el proceso en uso (jest, 147/147)

## 2. Admin (project-admin)

- [x] 2.1 Tipos y servicio: `phantomFamilies`, `productTypes`, llamadas nuevas y hooks con invalidación del detalle
- [x] 2.2 Cabecera: «Tipos de equipo» con etiquetas, selector múltiple con buscador y cuentas, aviso sin tipos; leyenda
- [x] 2.3 `BomTree`: nodo de familia (estilo propio, proceso, contador, aviso con cero) después de los hijos semielaborados
- [x] 2.4 Panel: «Agregar fantasmas» en el semielaborado; modal de familias por proceso, multiselección, ya agregadas deshabilitadas
- [x] 2.5 Panel de la familia: fantasmas ofrecidos, «Ver en Fantasmas», «Quitar del árbol» con confirmación; la confirmación de eliminar un semielaborado dice cuántas familias se van
- [x] 2.6 Pruebas: `BomEditorPage.spec.tsx` (agregar, ya agregada, misma familia en dos procesos, cero ofrecidos, quitar, cambiar tipos actualiza contadores). 10 pruebas; suite 235/235

## 3. Sin efecto en el resto

- [x] 3.1 `@rymel/design-template`: sin familias, la hoja base queda igual que antes (sustituido por 4.1: con familias, ahora sí cambia)
- [x] 3.2 project-front: `check-bom-cases.ts` y `check-bom-base.ts` en verde. Las familias no entran en lo que leen: la equivalencia con y sin familias se prueba en 3.1

## 4. Las familias en la lista de materiales (añadido tras la revisión)

- [x] 4.1 Paquete v2.6.0: `bomPhantomFamilyRows`; la fila de cada familia en `buildBomBaseSheet` y `buildBomSummaryCells`, tras los hijos y antes de los ítems; la base calculada sigue igual a la generada; los accesorios siguen al final. 149/149, `06769d9`, tag publicado
- [x] 4.2 Admin y cliente en v2.6.0. Admin: `BomBasePanel.spec.tsx` con una familia (236/236). Cliente: `check-bom-base.ts` con la familia antes del ítem y el accesorio al final (12/12); `check-bom-cases.ts` y `check-template-load.ts` en verde

## 5. Cierre

- [ ] 5.1 A mano en el navegador: tipos de una estructura, agregar familias de dos procesos, ver sus fantasmas, quitar una, eliminar el semielaborado; regenerar la base de una plantilla y ver la familia en el cliente y en «Diseños»
- [x] 5.2 `copilot-rules.md` y `docs/03_Especificacion_Funcional_Modulos.md` (módulo 15): familias en el árbol y tipos de la estructura. El repo `docs` queda sin commitear, está en `main`
