# Contraste diferencial: evaluador anterior contra motor compartido

Complementa a [la verificación en sombra](verificacion-en-sombra.md).

## Por qué hace falta

La verificación en sombra sobre los datos reales devolvió **0 defectos del
motor**, pero por el motivo equivocado: las 104 celdas con fórmula de la base
invocan todas una función personalizada y **no hay ni una aritmética pura**.
Esa dimensión salía verde por falta de casos, no por estar demostrada.

Este contraste la cubre por otra vía: reproduce el núcleo del evaluador de
project-front —sustituir referencias, traducir nombres a \`Math.*\`, evaluar con
\`Function()\`— y lo compara contra el motor sobre un corpus sintético.

Script: \`project-back/src/db/scripts/differential-formula-check.ts\`

## Resultado

\`\`\`
fórmulas contrastadas: 49 | coincidentes: 43 | divergentes: 6

divergencias:
   =A1>A2                         anterior="#ERROR"  motor=1
   =A1<A2                         anterior="#ERROR"  motor=0
   =A1>=A1                        anterior="#ERROR"  motor=1
   =A1<=A2                        anterior="#ERROR"  motor=0
   =A1=A1                         anterior="#ERROR"  motor=1
   =A1<>A2                        anterior="#ERROR"  motor=1
\`\`\`

## Clasificación de las divergencias

Las seis son el mismo caso: **comparadores sueltos**. project-front evalúa
\`A1>A2\` con \`Function()\`, obtiene un booleano, y su comprobación final
(\`typeof result === "number"\`) lo rechaza y devuelve \`#ERROR\`. El motor
compartido devuelve 1 o 0.

**No bloquea**: el motor es estrictamente más capaz. Ninguna hoja guardada
puede depender de que una comparación devuelva error, porque un error no es un
resultado que nadie use a propósito. Adoptar el motor convierte un error en un
valor.

## BUSCARV: hueco cerrado

Estaba fuera del motor y era la condición que mantenía cerrada la puerta. No
bastaba con comprobar que ninguna hoja la usara: **la ayuda del diseñador se
la documenta al usuario con ejemplos**, así que quien la lea puede escribirla
mañana.

Implementada en **v1.3.0**, junto con \`COINCIDIR\`. Para ello los rangos dejan
de aplanarse y conservan su forma de tabla. Contrastada contra la
implementación anterior en 6 casos —coincidencia exacta, primer y último
registro, tolerancia de 0.0001 y búsqueda aproximada por ambos lados— con
**0 divergencias**.

El contraste destapó además que el tokenizador no reconocía \`TRUE\` ni
\`FALSE\`, así que la fórmula tal como está documentada en la ayuda no se podía
analizar. Corregido en **v1.3.1**. Lo encontró el contraste diferencial y no
la prueba unitaria, porque esta invocaba la función directamente y se saltaba
el análisis de la expresión, que era donde estaba el fallo.

## Funciones que la ayuda promete y nadie implementa

\`ELEGIR\`, \`MIN\`, \`MAX\` y \`COUNT\` aparecen en el modal de instrucciones pero
**no están en el evaluador de project-front**: están rotas hoy, antes de este
cambio. Quedan fuera de su alcance, que es paridad y no funciones nuevas.
