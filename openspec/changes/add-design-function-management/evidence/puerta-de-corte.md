# Puerta de corte: ¿puede project-front adoptar el motor compartido?

Resumen de la evidencia recogida en el grupo 10. Los dos informes de detalle
son [verificación en sombra](verificacion-en-sombra.md) y
[contraste diferencial](contraste-diferencial.md).

**Estado: abierta.** La condición que quedaba (`BUSCARV`) se resolvió implementándola.

## Qué se verificó

| dimensión | método | resultado |
|---|---|---|
| Funciones personalizadas sobre datos reales | reevaluar las 104 celdas con fórmula de los 37 sub-diseños | 78 coinciden, 26 divergen, **todas clasificadas** |
| Aritmética y funciones matemáticas | contraste diferencial contra el evaluador anterior sobre 49 fórmulas sintéticas | 43 coinciden, 6 divergen, **todas explicadas** |

## Por qué hicieron falta dos métodos

La verificación en sombra sola habría dado un falso verde. Devolvió **0
defectos del motor**, pero al medir la cobertura resultó que **las 104 celdas
con fórmula invocan una función personalizada y no hay ni una aritmética
pura**: esa categoría estaba vacía por falta de casos, no por estar demostrada.

El contraste diferencial cubre esa dimensión con un corpus sintético, y es lo
que destapó el defecto real del grupo: el motor **no tenía** una veintena de
funciones que project-front sí ofrece.

## Defectos encontrados y corregidos

1. **Funciones matemáticas ausentes** (`RAIZ`, `ABS`, `POTENCIA`, `TECHO`,
   `PISO`, `LOG`, `LN`, trigonométricas, `PI()`, `RADIANES`, `GRADOS`, `Y`,
   `O`). Adoptar el motor habría convertido en error cualquier hoja que las
   usara. Añadidas en **v1.2.0**.
2. **Llamadas sin argumentos rotas.** `PI()` daba error: el conversor a
   notación polaca inversa contaba siempre al menos un argumento. El defecto
   estaba desde la extracción y no se notaba porque ninguna de las ocho
   funciones originales admite cero argumentos. Corregido en **v1.2.1**.
3. **`BUSCARV` y `COINCIDIR` ausentes.** project-front las implementa y las
   documenta al usuario. Añadidas en **v1.3.0**; para ello los rangos dejan de
   aplanarse y conservan su forma de tabla. Contrastadas contra la
   implementación anterior en 6 casos, **0 divergencias**.
4. **Literales `TRUE`/`FALSE` no reconocidos.** La fórmula del ejemplo de la
   ayuda, `=BUSCARV(A1, B1:E10, 3, TRUE)`, no se podía ni analizar. Corregido
   en **v1.3.1**.

## Divergencias que no bloquean, y por qué

| clasificación | celdas | por qué no bloquea |
|---|---|---|
| `funcion-no-resoluble` | 16 | Los sub-diseños 11–14 cuelgan de diseños **sin subtipo**, así que su fórmula no se puede resolver. **project-front hoy también da `#ERROR`** en ese caso: con `customFunctions` vacío, su bucle no encuentra el código y `Function("QUADRATIC(1)")` lanza `ReferenceError`. Los valores guardados son históricos. No hay regresión. |
| `argumento-no-numerico` | 4 | El sub-diseño 74 tiene `=CUBIC(A11, A5)` y **`A5` contiene el texto `"a ="`**. Los valores guardados coinciden exactamente con evaluar `b=0`, porque el evaluador anterior convierte el texto en 0 en silencio. Es un error de la fórmula, casi seguro `B5` en vez de `A5`. **Requiere decisión de negocio** (ver abajo). |
| `deriva-de-version` | 2 | El sub-diseño 82 se calculó con una definición anterior de `QUADRATIC`. Es justo lo que el versionado existe para registrar. |
| `valor-previamente-erroneo` | 4 | El sub-diseño 88 tenía `#ERROR` guardado; el motor nuevo sí lo resuelve. Es una mejora. |
| comparadores sueltos | 6 (sintéticas) | project-front devuelve `#ERROR` para `=A1>A2` porque `Function()` produce un booleano y su comprobación exige un número. El motor devuelve 1/0. Estrictamente más capaz. |

## Versión verificada del motor

**v1.3.1.** Es la que project-front debe fijar en su dependencia.

## Funciones que la ayuda promete y nadie implementa

`ELEGIR`, `MIN`, `MAX` y `COUNT` aparecen en el modal de instrucciones de
project-front pero **no están en su evaluador**: están rotas hoy, antes de
este cambio. Quedan fuera de su alcance, que es paridad y no funciones nuevas.
Conviene decidir si se implementan o se retiran de la ayuda.

## Decisión pendiente del propietario del producto

El sub-diseño 74 produce números solo porque el texto `"a ="` se convierte en
0 sin avisar. Hay dos salidas y no son equivalentes:

- **Corregir la fórmula** a `=CUBIC(A11, B5)` y recalcular. Los valores
  cambiarían de `5, 8, 17, 2` a los que correspondan con `b=1`.
- **Imitar la conversión** en el motor, conservando los valores actuales a
  cambio de mantener un generador silencioso de números equivocados.

La recomendación es la primera: lo que hay guardado es basura con aspecto de
dato.

## Cómo reproducir

```bash
cd project-back
npx ts-node -r tsconfig-paths/register src/db/scripts/shadow-verification.ts <informe.md>
npx ts-node -r tsconfig-paths/register src/db/scripts/differential-formula-check.ts
```

El primero sale con código 1 si aparece un defecto del motor o una divergencia
sin clasificar. El segundo, si alguna fórmula del corpus diverge sin
explicación.
