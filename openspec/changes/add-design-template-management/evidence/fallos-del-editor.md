# Dos fallos del editor, y por qué las pruebas no los vieron

Reportados al usar el editor:

1. En una plantilla nueva, añadir hojas y publicar respondía **«Una plantilla
   sin hojas no se puede publicar»**.
2. En una plantilla existente, con cambios sin guardar a la vista, publicar
   respondía **«no hay cambios que publicar»**.

## 1. La causa, que es una sola

**El editor edita en local y el servidor solo se enteraba del contenido, nunca
de la estructura.**

- `addSheet`, `removeSheet`, `renameSheet` y `reorderSheets` cambian el
  documento en memoria y no llaman a la API.
- El guardado recorría `dirtySheets` y llamaba a `saveSheet`, que **exigía que
  la hoja ya existiera en el servidor** y devolvía 404 si no.
- Resultado: en una plantilla nueva ninguna hoja llegaba nunca, el borrador
  seguía vacío y publicar decía la verdad — no había hojas.

El segundo fallo es la otra cara: el borrador del servidor solo se crea al
guardar, y el botón de publicar no guardaba antes. Con cambios pendientes en
memoria, el servidor no tenía nada que publicar.

## 2. Por qué las comprobaciones no lo detectaron

`check-template-admin.ts` llamaba a `createSheet` del servidor antes de guardar
cada hoja. **El editor no hace eso.**

Es decir: las comprobaciones probaban el servicio, no la secuencia que produce
la interfaz. Ambas pasaban con el servicio roto para el uso real.

De ahí el guion nuevo, `check-editor-sequence.ts`, que imita exactamente lo que
hace la interfaz. La lección está en su nombre.

## 3. Qué se cambió

**Servidor**

- `saveSheet` **crea la hoja si no existe**. El editor las añade en memoria y
  las trae al guardar; pedirle que las creara antes era pedirle un paso que no
  da.
- `reorderSheets` pasa a ser `setSheets`, y el `PUT` va sobre la colección
  (`/:id/sheets`): fija **qué hojas hay y en qué orden**. Lo que no está en la
  lista se va, lo que falta se crea vacío. Antes exigía que la lista nombrase
  exactamente las hojas que ya había, que es justo lo que el editor no puede
  garantizar.
- El mensaje de publicar sin cambios dice ahora «lo guardado ya es lo que está
  publicado», que no se lee como «tus cambios no cuentan».

**Editor**

- El guardado manda **primero la estructura** —si cambió— y después el
  contenido de las hojas sucias. Eliminar o reordenar no ensucia ninguna hoja,
  así que sin esto esos cambios no llegaban nunca.
- **Publicar guarda antes.** El editor trabaja sobre su documento en memoria y
  el servidor publica lo que tiene guardado; sin ese paso, publicar ignoraba lo
  que el usuario acababa de escribir.

## 4. Comprobado

`check-editor-sequence.ts`, 12 comprobaciones sobre la secuencia real:

```
ok  guardar una hoja que solo existía en el editor la crea
ok  la plantilla nueva se publica
ok  se publica la edición · la versión avanza · el texto queda publicado
ok  publicar sin nada pendiente lo dice con claridad
ok  las hojas que el editor añadió se crean
ok  la hoja eliminada desaparece y el orden es el pedido
ok  el contenido de la hoja que sigue sobrevive
ok  una lista con nombres repetidos se rechaza
```

Y las tres que ya existían siguen pasando: administración, ida y vuelta, y la
carga en el diseñador.

## 5. La plantilla de prueba del usuario

`TEMPLATE_1F_002` («Plantilla de diseño de prueba 2») quedó en `DRAFT`, con el
borrador vacío: las hojas que se le añadieron nunca llegaron a guardarse. No se
ha tocado. Con la corrección, volver a añadirlas y guardar ya funciona.
