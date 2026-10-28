## Context

- Desde `move-template-authoring-to-admin`, la plantilla ya declara todo lo que alimenta la lista: zonas de semielaborado, tablas de catálogo e ítems vinculados. Lo único que faltaba en el admin era la **lista misma**.
- Hoy la lista se genera en cada diseño desde cero (`buildBomSummaryCells`): busca la estructura por prefijo de la referencia del elemento, copia **valores** de las celdas vinculadas y de los catálogos, y añade accesorios. Nada de lo que decida el admin sobre la lista llega al cliente.
- Un diseño guarda su copia de las hojas de la plantilla en `sub_design.data` y no vuelve a leer la plantilla. El admin muestra el `computed` que guardó el cliente, porque las fórmulas de diseño se evalúan en el servidor.
- Las hojas de una plantilla se guardan en `sheet` (`cells`, `cellsStyles` en JSON), en el borrador y en las revisiones (el documento entero en JSON).
- Ninguna plantilla publicada tiene configuración de BOM (`audit-authoring-usage.ts`, 2026-09-29). Los únicos diseños con BOM son `sub_design` 90 y 91, de prueba.

## Goals / Non-Goals

**Goals:** que el admin genere y ajuste en la plantilla la lista base; que cada diseño parta de esa base, con sus propios valores y con los accesorios de su elemento; que el admin vea en «Diseños» la misma lista que el cliente.

**Non-Goals:** accesorios en el editor; migrar diseños existentes; que la base se actualice sola en diseños ya creados.

## Decisions

### 1. La base es una hoja más de la plantilla, marcada

`SheetStyles.billOfMaterials?: { structureId; structureCode; structureName }` marca la hoja. Al ser una hoja normal, se edita con el editor que ya existe (formato, filas, fórmulas, deshacer) y viaja por el mismo camino: borrador, publicación, revisiones y carga en el cliente. No hay tablas ni columnas nuevas.

*Alternativa descartada:* un campo propio en el documento (`TemplateDocument.billOfMaterials`). Habría que darle su propio editor, su propia persistencia en `template` y su propia carga en el cliente. Sería otro camino para algo que ya es una hoja.

### 2. Fórmulas, no valores copiados

`buildBomBaseSheet(estructura, hojas)` escribe la cantidad como `=Hoja!Ref` de la celda vinculada, y la descripción y la unidad como `=Tablas!Ref` de la fila del catálogo. Los textos fijos (títulos de sección, encabezados, semielaborados hijos con «1 · UND») van como valores.

*Por qué así:* la cantidad depende de cada diseño, y una base con números copiados mentiría en todos los diseños menos en el de la vista previa. Con referencias, el motor de cada lado (el del editor en el admin, el del diseñador en el cliente) calcula lo que corresponde. Un ítem «no encontrado» o de un catálogo borrado se escribe como texto con su aviso, igual que hoy.

### 3. Despliegue de hijos en la base: siempre desplegado

En la base, los semielaborados hijos se generan **desplegados** (su fila más sus ítems debajo). No se pliegan: plegar y desplegar rearmaba la hoja y perdía lo editado, y en una base editable eso no vale. El admin borra lo que no quiera ver.

### 4. El diseño se lleva su copia de la base, oculta

Al cargar la plantilla, el cliente incluye la hoja base entre las hojas del diseño, para que se calcule con ellas (sus fórmulas apuntan a ellas) y se guarde en `sub_design`. Pero no la muestra en las pestañas de hojas. La pestaña «LISTA DE MATERIALES» toma sus celdas calculadas y les suma los accesorios (`withAccessories`).

*Por qué así:* es como se comporta todo lo demás de la plantilla. Un diseño es una copia y no cambia si la plantilla cambia (restricción 1 de `add-design-template-management`). El admin, en «Diseños», lee el `computed` guardado sin evaluar nada.

### 5. Accesorios al mostrar, no dentro de la base

`withAccessories(celdas, elemento)` inserta, al final de cada sección, las filas de los accesorios de ese semielaborado (todos sus campos, con su Observación si falta algo) y desplaza lo que viene debajo. Se aplica al mostrar, no se guarda en la base: el elemento es dato del diseño, y la base es dato de la plantilla. La huella de los ajustes se calcula sobre el resultado (base calculada + accesorios), así que un cambio en cualquiera de las dos avisa.

### 6. Estructura: la que eligió el admin

Con base, el cliente usa la estructura de la base y no busca otra por la referencia del elemento. Sin base, el camino de siempre.

*Trade-off:* si la referencia del elemento corresponde a otra estructura, la base no lo sabe. La pestaña lo avisa cuando la búsqueda por prefijo da otra estructura que la de la base.

### 7. Todo en el paquete

`buildBomBaseSheet`, `withAccessories` y la validación de la base van en `@rymel/design-template`, junto a `buildBomSummaryCells`, que se queda para los diseños sin base. Así el admin y el cliente las usan iguales.

## Risks / Trade-offs

- **[Riesgo] El editor de hojas del cliente calcula la hoja oculta.** → Se calcula como cualquier otra hoja; solo se filtra de la barra de pestañas. Se comprueba con `check-template-load.ts` y una plantilla de prueba con base.
- **[Riesgo] Una plantilla con base y diseños viejos sin ella.** → Los diseños sin hoja base siguen por el camino de antes. Conviven.
- **[Trade-off] Regenerar descarta lo editado.** → Confirmación explícita. Fusionar ediciones con una base nueva exige decidir qué gana fila a fila; se deja para cuando haga falta.

## Migration Plan

1. `rymel-design-template`: marca, generación, accesorios, validación; tag nuevo.
2. `project-admin`: acción en el editor; «Diseños» lee la base.
3. `project-front`: carga oculta de la base y pestaña sobre ella.
4. Se publica una plantilla de prueba con base y se crea un diseño con ella para verlo de punta a punta.

Rollback: revertir el cliente deja la hoja base visible como una hoja más. Revertir el admin deja de ofrecer generarla. No hay datos.
