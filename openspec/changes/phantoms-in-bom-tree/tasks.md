## 1. Servidor (project-back)

- [ ] 1.1 Migración: `bill_of_materials_node_phantom_family` y `bill_of_materials_product_type`, con sus únicos entre filas activas; entidades
- [ ] 1.2 Detalle de la estructura: `phantomFamilies` en cada nodo (familia, proceso, `offered`) y `productTypes` en la estructura, sin cambiar los campos actuales del nodo
- [ ] 1.3 `POST bill-of-materials/nodes/:nodeId/phantom-families { familyIds }` (rechaza familia inexistente y repetida) y `DELETE bill-of-materials/node-phantom-families/:id`
- [ ] 1.4 `PUT bill-of-materials/:id/product-types { codes }` y `GET phantom-items/product-types` (tipos distintos con su cuenta)
- [ ] 1.5 `GET bill-of-materials/:id/phantom-families/:familyId/items`: fantasmas ofrecidos con código, referencia, Tipo PT y componentes
- [ ] 1.6 `removeNode` da de baja las familias del subárbol; dar de baja un proceso con familias en una estructura se rechaza nombrándola
- [ ] 1.7 Pruebas del servicio y `check-bom-phantoms.ts` contra la base: agregar, repetir, filtrar por tipos (F. Emblemas con 1CA y 3CATC ofrece 22), sin tipos ofrece todos, cascada, proceso en uso, y que el árbol sin `phantomFamilies` es el mismo que antes

## 2. Admin (project-admin)

- [ ] 2.1 Tipos y servicio: `phantomFamilies`, `productTypes`, llamadas nuevas y hooks con invalidación del detalle
- [ ] 2.2 Cabecera: «Tipos de equipo» con etiquetas, selector múltiple con buscador y cuentas, aviso sin tipos; leyenda
- [ ] 2.3 `BomTree`: nodo de familia (estilo propio, proceso, contador, aviso con cero) después de los hijos semielaborados
- [ ] 2.4 Panel: «Agregar fantasmas» en el semielaborado; modal de familias por proceso, multiselección, ya agregadas deshabilitadas
- [ ] 2.5 Panel de la familia: fantasmas ofrecidos, «Ver en Fantasmas», «Quitar del árbol» con confirmación; la confirmación de eliminar un semielaborado dice cuántas familias se van
- [ ] 2.6 Pruebas: `BomEditorPage.spec.tsx` (agregar, ya agregada, misma familia en dos procesos, cero ofrecidos, quitar, cambiar tipos actualiza contadores)

## 3. Sin efecto en el resto

- [ ] 3.1 `@rymel/design-template`: `buildBomSummaryCells` y `buildBomBaseSheet` con un árbol con `phantomFamilies` dan lo mismo que sin ellas (prueba en el paquete, sin cambiar su código)
- [ ] 3.2 project-front: `check-bom-cases.ts` y `check-bom-base.ts` en verde contra una estructura con familias

## 4. Cierre

- [ ] 4.1 A mano en el navegador: tipos de una estructura, agregar familias de dos procesos, ver sus fantasmas, quitar una, eliminar el semielaborado
- [ ] 4.2 `copilot-rules.md` y `docs/03_Especificacion_Funcional_Modulos.md` (módulo 15): familias en el árbol y tipos de la estructura
