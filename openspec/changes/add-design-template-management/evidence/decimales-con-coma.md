# Decimales escritos con coma

## 1. Qué pasaba

Quien escribe una plantilla teclea `3,36`, porque es como se escribe un decimal
en español. En la única plantilla completa que existe hay **1200 celdas así**,
de 2038 con contenido.

Ni el evaluador anterior ni el motor actual las entienden como números. Lo
grave no es eso: es que **no fallan, calculan mal**, y de forma inconsistente.

| Fórmula, con `A1="3,36"` y `A2="1,64"` | Da | Debería dar |
|---|---|---|
| `=A1+A2` | **4** | 5 |
| `=SUMA(A1:A2)` | **0** | 5 |
| `=A1*2` | **6** | 6.72 |
| `=C1*1000` con `C1="0,022"` | **0** | 22 |

El operador `+` coacciona el texto truncando en la coma; `SUMA` ignora lo no
numérico y devuelve cero. La misma celda da un número distinto según qué la
lea, y ninguno es el correcto.

El evaluador anterior hacía lo mismo con `parseFloat`: **641 de esas 1200
celdas quedaron guardadas como `0`**.

Un número equivocado no se distingue de uno correcto mirando la pantalla. Por
eso llevaba años ahí.

## 2. Por qué la lectura decimal es la correcta

`16,708` es ambiguo: podría ser 16.708 o el entero 16 708 con separador de
miles. Tres cosas de los datos reales deciden:

- Hay celdas como `0,012` y `0,022`, que como millares no significan nada.
- **Ninguna cifra lleva dos comas**: no aparece la notación `1.234,56`, que es
  la que haría creíble el separador de miles.
- El mismo documento escribe `115.2` **con punto** en otras celdas. Convive la
  notación de quien escribió con punto y la de quien escribió con coma.

Reparto por número de decimales: 1→204, 2→586, **3→404**, 4→1, 5→2, 6→1, 7→2.
Las 404 de tres decimales son las únicas ambiguas, y el editor las señala.

## 3. Qué se hizo

**En el contrato** (`@rymel/design-template` v1.2.0), tres funciones:
`isDecimalComma`, `normalizeDecimalComma`, `findDecimalCommaCells` y
`normalizeDecimalCommas`.

La conversión **nunca ocurre sola**: no se aplica al leer ni al guardar.
Reescribir en silencio el contenido de una plantilla al serializarla sería el
tipo de cambio invisible que este contrato existe para impedir.

La regla es estrecha a propósito, y las pruebas protegen sobre todo **lo que no
se toca**:

| No se toca | Por qué |
|---|---|
| `=SUMA(1,2)` | la coma separa argumentos |
| `Aislamiento (0,25 mm)` | texto que contiene un número |
| `M0 0,75` | un código con coma dentro |
| `DRAW:FRONTAL:NUCLEO:H53,H54` | una directiva de gráfico |
| `1.234,56` | notación de miles: exige otra decisión |
| `115.2` | ya usa punto |

Comprobado contra la plantilla real: encuentra **las 1200 exactas**, marca
**404 como ambiguas**, y ninguna de las 21 celdas de texto con coma cambia.

**En el editor**, dos caminos:

- **Al escribir.** Teclear `3,36` en una celda deja `3.36`. El autor ve
  enseguida qué quedó guardado.
- **Para lo que ya estaba.** Un aviso en el panel de problemas dice cuántas
  hay, cuántas son ambiguas, enseña las primeras conversiones y ofrece
  convertirlas todas de una vez. Entra en el historial, así que se puede
  deshacer.

## 4. Por qué el aviso no bloquea la publicación

No es un diagnóstico de validación. Una plantilla con `3,36` **es válida** — es
texto en una celda, y hay celdas de texto legítimas. Bloquear la publicación
por esto dejaría sin publicar la única plantilla real, que tiene 1200.

La decisión de convertir es del autor, y las 404 ambiguas son la razón por la
que conviene que lo sea.
