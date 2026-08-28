# Migración de project-front: paridad y carga

## 1. Paridad entre las dos formas de cargar

`scripts/parity-template-loading.ts` compara, hoja por hoja y celda por celda,
lo que hace hoy `loadTemplate` contra lo que hace `runtimeSheetsFromTemplate`,
que pasa por el contrato compartido.

**2891 diferencias, todas explicadas:**

| Diferencias | Motivo |
|---|---|
| 1814 | el valor calculado deja de viajar en la plantilla; se recalcula al cargar |
| 975 | celda sin contenido descartada por la normalización |
| 100 | celda que solo lleva formato: contenido vacío explícito en vez de clave ausente |
| 2 | la directiva de gráfico se guarda sin el `=` |

La tercera no se aceptó de palabra. 50 celdas de la plantilla llevan borde y
ninguna clave de contenido; el contrato les pone `""`. El script **comprueba**
que los dos consumidores de ese campo —el renderizador, con `value || ""`, y el
evaluador, con `!formula || formula.trim() === ""`— se comportan igual con
`undefined` y con `""` antes de darla por inocua.

Cualquier diferencia fuera de esas cuatro categorías detiene la conmutación.
Fue lo que pasó en la primera ejecución: 101 diferencias sin explicar, que
resultaron ser justamente las de las celdas con solo formato.

## 2. La carga completa

`scripts/check-template-load.ts` reproduce lo que hace el diseñador al elegir
una plantilla —traducir con el contrato y recalcular con el motor— sobre
`TEMPLATE_1F_0001`:

- `G17` vuelve a dar los **20** que tenía guardados.
- El dibujo de `K73` **sobrevive al recálculo**: la directiva llega en el
  propio contenido de la celda, sin depender de un valor calculado que se
  sobrescribía.
- `I39` reproduce su valor guardado exacto.
- `C6` sigue en `#ERROR`, por su causa conocida y ajena a este cambio.
- Ninguna celda circular, y **`C6` es la única celda en error de toda la
  plantilla**.

## 3. Un hallazgo grande: 1200 celdas con decimales escritos con coma

De las 2038 celdas con contenido de la plantilla real, **1200 guardan números
escritos a la española**: `3,36`, `16,708`, `0,022`.

Ninguno de los dos evaluadores los entiende como números.

**Corrección de lo que este documento decía antes.** Al escribir la prueba de
la normalización resultó que el motor actual no se limita a dejarlos como
texto: **dentro de una fórmula los trunca igual que el anterior**, y no de
forma consistente.

| Fórmula | `A1="3,36"`, `A2="1,64"` | Debería |
|---|---|---|
| `=A1+A2` | **4** | 5 |
| `=SUMA(A1:A2)` | **0** | 5 |
| `=A1*2` | **6** | 6.72 |
| `=A1` (la celda sola) | `"3,36"` | — |

El operador `+` coacciona el texto truncando en la coma; `SUMA` ni siquiera
trunca, ignora lo no numérico y devuelve cero. **La misma celda da un número
distinto según qué la lea, y ninguno es el correcto.**

Y el evaluador anterior hacía lo mismo con `parseFloat`: 641 de esas 1200
celdas quedaron guardadas como `0`. No redondeadas: truncadas.

Es decir, no es un problema de presentación. Buena parte de los números de la
plantilla llevan tiempo entrando en los cálculos como su parte entera, o como
cero, sin que nadie lo viera — porque un número equivocado no se distingue de
uno correcto mirando la pantalla.

**Resuelto en el editor**: ver `evidence/decimales-con-coma.md`.

## 4. Los diseños ya guardados

`check-saved-designs.ts` recalcula los 37 sub-diseños y compara contra su valor
guardado. Resultado:

```
celdas con fórmula evaluadas: 0
celdas con fórmula de diseño, fuera de la comparación: 88
```

**Las 88 fórmulas de los diseños guardados son todas invocaciones de fórmulas
de diseño**, y resolverlas exige el motor cifrado, que este script no usa. Así
que la comprobación **no confirma la paridad por sí sola**, y lo dice: la
primera versión concluía «todos los diseños se abren igual» habiendo comparado
cero celdas, que era una falsa tranquilidad.

Lo que sí está medido es la exposición (sección 5 del inventario): ninguna de
esas celdas usa el separador `;`, ni un rango calificado en ambos extremos, ni
una celda de gráfico — las tres construcciones que cambió v1.6.0.
