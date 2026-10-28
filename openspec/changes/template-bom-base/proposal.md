## Why

La lista de materiales la define el admin **en la plantilla**. Así lo pidió el responsable del producto el 2026-10-27, al ver el editor de plantillas:

> «aquí deberíamos tener la opción de generar el listado de materiales con lo que está colocando en la plantilla y complementar con la info de accesorios de normas que se obtiene usando la plantilla como base para crear el diseño»

Respuestas de ese mismo día:
- En el editor, la lista se genera **solo con la plantilla, sin accesorios**: el admin elige la estructura BOM, y los accesorios llegan cuando el cliente crea el diseño con un elemento.
- La lista generada **se guarda con la plantilla como base**: el admin la puede ajustar (añadir o cambiar filas) y se publica con la plantilla.

Hoy no es así. El editor no tiene ninguna opción de lista de materiales. El cliente la arma desde cero en cada diseño: busca la estructura por la referencia del elemento y recorre las zonas y los ítems vinculados de las hojas del diseño. Por tanto, nada de lo que decida el admin sobre la lista (filas fijas, orden, textos) llega al cliente.

## What Changes

**Editor de plantillas (admin)**

- Una acción **«Lista de materiales»**: el admin elige una estructura BOM (de las que administra en `/bom`) y se genera una **hoja nueva de la plantilla**, «Lista de materiales», marcada como tal.
  - La hoja lleva las secciones de los semielaborados de la estructura (de hojas a raíz, con los hijos), y en cada una los ítems que la plantilla vincula dentro de sus zonas.
  - La cantidad, la descripción y la unidad de cada ítem **no se copian como números**: son fórmulas que apuntan a la celda vinculada y a su fila del catálogo (`=Hoja1!B3`, `=Tablas!I2`). Así, en cada diseño valen lo que valgan sus datos.
- La hoja **se edita como cualquier otra**: el admin añade filas fijas, cambia textos y da formato. Se guarda, se publica y entra en las revisiones igual que el resto de hojas.
- **«Regenerar»** vuelve a armarla desde la estructura y la configuración actuales, con confirmación porque descarta lo editado a mano.
- La validación avisa si la hoja apunta a celdas o filas de catálogo que ya no existen.

**Cliente (diseñador)**

- La hoja de lista de materiales **viaja con el diseño** como las demás hojas: se calcula con ellas y se guarda en su `sub_design`, pero **oculta** entre las hojas de cálculo. Es la base de la pestaña «LISTA DE MATERIALES». Como el resto de hojas, un cambio posterior en la plantilla no altera los diseños ya creados.
- En esa pestaña la lista es esa base, **con los valores del diseño**, más los **accesorios de la norma** del elemento, añadidos al final de la sección de su semielaborado.
- Después, todo sigue como ya funciona: solo lectura, «Editar» para añadir o cambiar filas y ajustes guardados con el diseño, con aviso si la lista cambió.
- Una plantilla **sin** hoja de lista de materiales sigue funcionando como hoy (estructura buscada por la referencia del elemento). Ninguna plantilla publicada tiene hoy configuración de BOM (`audit-authoring-usage.ts`, 2026-09-29).

**Admin, sección «Diseños»**

- La lista que muestra y exporta un diseño es la misma que la del cliente: la hoja base guardada en el diseño (ya calculada) más los accesorios de su elemento, o la ajustada si el cliente la ajustó.

**Fuera de alcance**

- Elegir un elemento de muestra en el editor para ver los accesorios. Se descartó: los accesorios llegan al crear el diseño.
- Migrar los `sub_design` 90 y 91, que no tienen plantilla con base. Siguen por el camino de hoy.

## Capabilities

### New Capabilities

- `template-bom-base`: la lista de materiales como hoja base de la plantilla, generada desde una estructura y la configuración de la plantilla, editable y publicada con ella; y su uso en el diseño junto con los accesorios de la norma.

### Modified Capabilities

_Ninguna como delta aparte_: el cambio en el cliente (la lista parte de la base cuando la hay) está escrito en `template-bom-base`, requisito «El diseño parte de la base de la plantilla».

## Impact

- **`rymel-design-template`**:
  - En los estilos de la hoja, la marca `billOfMaterials` (estructura de origen).
  - `buildBomBaseSheet(estructura, hojas)`, que genera la hoja con fórmulas, y `withAccessories(celdas, elemento)`, que suma los accesorios.
  - Validación de referencias rotas en la hoja base. Versión menor nueva; el contrato no rompe (campo opcional).
- **`project-admin`**: acción y diálogo «Lista de materiales» en el editor (elegir estructura, generar y regenerar); la sección «Diseños» usa la base.
- **`project-front`**: la hoja base se carga y se calcula con las demás, pero no sale en las pestañas de hojas; `BomSummaryTab` la toma como base y añade los accesorios.
- **`project-back`**: nada en el esquema. La marca viaja en `sheet.cellsStyles` y en el documento de borradores y revisiones; la validación del servidor es la del paquete.
- **Datos**: ninguno se migra.
