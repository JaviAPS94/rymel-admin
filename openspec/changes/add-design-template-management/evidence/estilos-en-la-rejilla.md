# Los estilos no se pintaban: dos fallos en la rejilla

Reportado: lo guardado en el admin no se veía bien, ni en el admin ni en el
cliente. La pista del usuario era buena — «la plantilla 3 tiene los estilos
correctamente en su data, el admin debería seguir la misma línea».

## 1. Lo primero fue descartar el dato

| Comprobación | Resultado |
|---|---|
| El borrador de `TEMPLATE_1F_0001` que lee el admin | 324 celdas con formato en `Resumen`, 1591 en `Tablas`, 33 anchos, 141 combinaciones, `freezeRow: 7` |
| Lo que el admin escribiría al publicar, contra lo publicado | **idéntico**: 0 diferencias en `Tablas`, 1 en `Resumen` (una celda editada a mano), estilos idénticos |
| El formato por la cadena completa cliente → servidor → base | llega plano, con la misma forma que `TEMPLATE_1F_0001` |

Es decir: **el dato se leía bien y se guardaba bien.** El fallo estaba en el
dibujo, y ninguna prueba de datos podía verlo.

## 2. El fallo grande: los bordes no se pintaban

`GridCell` armaba el estilo así:

```tsx
border: format?.border,
borderTop: format?.borderTop,      // undefined
borderRight: format?.borderRight,  // undefined
borderBottom: format?.borderBottom,
borderLeft: format?.borderLeft,
```

React escribe **todas** las propiedades del objeto, y una `undefined` la
escribe como cadena vacía. Comprobado sobre el CSSOM:

```
tras border:           "1px solid rgb(0, 0, 0)"
tras borderTop = "":   ""
```

Poner un lado a vacío **destruye el atajo**. En la plantilla real hay **1907
celdas con `border`**, y no se pintaba ni una.

Ahora los bordes se arman solo con lo que la celda declara.

## 3. El segundo: la inmovilización no existía

La hoja `Resumen` declara `freezeRow: 7` — las siete primeras filas son los
rótulos. La rejilla leía el valor y **lo ignoraba**: no había paneles
inmovilizados.

Implementados: las filas y columnas inmovilizadas compensan el desplazamiento,
van por encima del resto, y **se dibujan siempre**, aunque la virtualización
las dejara fuera de la ventana — que es justo cuando hacen falta.

## 4. La brecha de método que lo dejó pasar

No había forma de probar un componente ni un hook: solo funciones puras y el
servicio. Los tres fallos que llegaron al usuario —las hojas que no se
guardaban, el publicar que decía «no hay cambios» y estos estilos— vivían todos
en la capa que ninguna prueba tocaba.

Se añadió `@testing-library/react` con jsdom y dos ficheros:

- `useTemplateDocument.editor.spec.tsx`, 10 pruebas: escribir, dar formato,
  redimensionar y deshacer sobre el hook montado, comprobando **lo que sale por
  el serializador**.
- `TemplateGrid.spec.tsx`, 11 pruebas sobre lo que se pinta, con un recorte
  real del borrador de la plantilla 3: negrita, bordes, color, anchos, altos,
  combinaciones e inmovilización.

De 27 pruebas a **48**.
