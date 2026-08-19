# Decisiones pendientes del propietario del producto

Cosas que el cambio deja funcionando pero que **no le corresponde decidir a
quien lo implementa**. Ninguna bloquea el uso del sistema.

## 1. Códigos de fórmula duplicados

En la base hay tres conflictos de código entre fórmulas activas:

| fórmulas | conflicto |
|---|---|
| #6 «Función cúbica prueba nuevo proyecto» y #16 «Función cúbica nuevo proyecto con constantes» | ambas usan `CUBIC` |
| #8 «Función cuadrática nuevo proyecto» y #10 «Función cuadrática nuevo proyecto con constantes» | ambas usan `QUADRATIC` |
| #17 «Calculo de costos» y #18 «Calculo de costos asociados» | `COST` es sufijo de `ASSOCIATE_COST` |

**Por qué importa.** El código es el nombre con el que una hoja invoca la
fórmula: `=CUBIC(A1, B2)`. Con dos fórmulas activas del mismo tipo y el mismo
código, una hoja no puede expresar a cuál se refiere. Hoy no explota porque
los duplicados no coinciden dentro del mismo subtipo, pero nada lo impedía.

El tercer caso era un **defecto vivo**: el evaluador anterior resolvía los
códigos con una expresión regular sin límites, así que `COST` capturaba dentro
de `ASSOCIATE_COST` y `=ASSOCIATE_COST(A1,B2)` se evaluaba como `COST`. El
motor compartido ya no tiene ese defecto —reconoce el código como unidad
léxica completa— pero un código ambiguo sigue siendo mala idea: quien lea la
hoja no sabrá cuál se invoca.

**Qué hace el sistema hoy.** Los señala en el listado de fórmulas con una
etiqueta «choca» y un aviso arriba, e **impide crear conflictos nuevos**. Los
heredados se dejan pasar para no bloquear la edición de esas fórmulas: quien
corrige una descripción no debería tener que tomar antes una decisión de
negocio.

**Qué falta decidir.** Cuál de cada par se renombra. No se puede automatizar:
hay diseños calculados con cada una y renombrar cambia lo que las hojas
invocan.

**Cuando se resuelva**, se puede añadir la restricción única en la base, que
esta migración dejó deliberadamente fuera porque no llegaría a crearse con los
datos actuales.

## 2. Funciones que la ayuda promete y nadie implementa

`InstructionsModal.tsx` de project-front documenta al usuario `ELEGIR`, `MIN`,
`MAX` y `COUNT` con ejemplos. **No están en el evaluador**, ni en el anterior
ni en el motor compartido: están rotas desde antes de este cambio.

Quedaron fuera de su alcance, que era paridad y no funciones nuevas. Hay que
implementarlas o retirarlas de la ayuda; lo que no se sostiene es prometerlas.

## 3. Diseños sin subtipo asignado

Catorce sub-diseños cuelgan de diseños **sin subtipo**, así que las fórmulas
que invocan no se pueden resolver. Sus valores guardados son históricos, de
cuando sí se podían resolver.

El recálculo los reporta y **no los toca**. project-front tampoco los sabe
evaluar hoy, así que no hay regresión, pero conviene decidir si se les asigna
un subtipo o se archivan.

## 4. Retención de la bitácora de recálculos

`sub_design_recalculation` guarda, por cada recálculo, qué celdas cambiaron
con su valor anterior. Es lo que alimenta el aviso al usuario y lo que
permitiría revertir.

No tiene política de retención: crece sin límite. Con 25 diseños no es
urgente, pero conviene fijarla antes de que lo sea.
