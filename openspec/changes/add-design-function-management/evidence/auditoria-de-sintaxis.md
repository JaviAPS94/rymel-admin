# Auditoría de sintaxis: evaluador anterior contra motor compartido

Inventario **cerrado**, no una muestra. Cada caso sale de una expresión
regular concreta del evaluador de `SpreadSheet.tsx`, citada en el propio
caso, de modo que la lista cubre toda la superficie sintáctica que el
evaluador anterior acepta.

## Por qué se hizo así

Las cuatro primeras incompatibilidades del motor aparecieron **de una en una,
por accidente**: faltaban veinte funciones matemáticas, `PI()` no se podía
invocar, `BUSCARV` no existía, `TRUE` no se analizaba, las referencias entre
instancias no se reconocían. La última se encontró leyendo
`parseCrossSheetRef` justo antes de escribir el código nuevo; sin esa lectura
habría llegado a producción como `#ERROR` en fórmulas que hoy funcionan, sin
que ninguna prueba lo detectara, porque no hay hojas guardadas que las usen.

Cuatro de cuatro por suerte no es un método. De ahí este inventario.

## Resultado

```
| forma sintáctica | fórmula | esperado | motor | ¿compatible? |
|---|---|---|---|---|
| referencia local | `=A1` | 9 | 9 | sí |
| referencia absoluta con $ | `=$A$1` | 9 | 9 | sí |
| referencia a otra hoja | `=Hoja1!A1` | 7 | 7 | sí |
| referencia entre instancias | `=design:Hoja1!A1` | 21 | 21 | sí |
| hoja cuyo nombre empieza por dígito | `=1F!A1` | 5 | 5 | sí |
| hoja con espacios entre comillas simples | `='Template 1F'!A1` | 11 | 11 | sí |
| rango | `=SUMA(F1:G2)` | 330 | 330 | sí |
| número entero | `=42` | 42 | 42 | sí |
| número decimal | `=1.5+1.5` | 3 | 3 | sí |
| texto entre comillas dobles | `="hola"` | "hola" | "hola" | sí |
| texto entre comillas simples | `='hola'` | "hola" | "hola" | sí |
| literal TRUE | `=SI(TRUE, 1, 2)` | 1 | 1 | sí |
| suma | `=A1+A2` | 13 | 13 | sí |
| resta | `=A1-A2` | 5 | 5 | sí |
| multiplicación | `=A1*A2` | 36 | 36 | sí |
| división | `=A1/A2` | 2.25 | 2.25 | sí |
| potencia con ^ | `=A3^A2` | 16 | 16 | sí |
| negación unaria | `=-A2+A1` | 5 | 5 | sí |
| paréntesis y precedencia | `=(A1+A2)*A3` | 26 | 26 | sí |
| concatenación de texto | `="a" & "b"` | "ab" | "ab" | sí |
| SUM sobre rango | `=SUM(F1:G2)` | 330 | 330 | sí |
| AVERAGE sobre rango | `=AVERAGE(F1:F2)` | 15 | 15 | sí |
| SUM con celdas sueltas separadas por coma | `=SUM(F1,G1)` | 110 | 110 | sí |
| BUSCARV exacta | `=BUSCARV(20, F1:G2, 2, TRUE)` | 200 | 200 | sí |
| VLOOKUP (alias en inglés) | `=VLOOKUP(10, F1:G2, 2, TRUE)` | 100 | 100 | sí |
| COINCIDIR | `=COINCIDIR(20, F1:F2, 0)` | 2 | 2 | sí |
| SI/IF | `=SI(A1>A2, 1, 2)` | 1 | 1 | sí |
| SI en minúsculas | `=si(A1>A2, 1, 2)` | 1 | 1 | sí |
| AND | `=AND(1,1)` | 1 | 1 | sí |
| OR | `=OR(0,1)` | 1 | 1 | sí |
| SENO/SIN | `=SENO(0)` | 0 | 0 | sí |
| nombre de función en minúsculas | `=abs(B1)` | 4 | 4 | sí |
| RAIZ/SQRT | `=RAIZ(A1)` | 3 | 3 | sí |
| LOGARITMO base 10 | `=LOGARITMO(100)` | 2 | 2 | sí |
| LN | `=LN(1)` | 0 | 0 | sí |
| POTENCIA/POWER | `=POTENCIA(A3,A2)` | 16 | 16 | sí |
| REDONDEAR con decimales | `=REDONDEAR(A1/A2,2)` | 2.25 | 2.25 | sí |
| TECHO/CEILING | `=TECHO(1.2)` | 2 | 2 | sí |
| PISO/FLOOR | `=PISO(1.8)` | 1 | 1 | sí |
| PI() | `=REDONDEAR(PI(),4)` | 3.1416 | 3.1416 | sí |
| RADIANES | `=REDONDEAR(RADIANES(180),4)` | 3.1416 | 3.1416 | sí |
| GRADOS | `=GRADOS(PI())` | 180 | 180 | sí |
| función anidada | `=RAIZ(POTENCIA(A1,A3))` | 9 | 9 | sí |

43 de 43 formas sintácticas compatibles.
```

## Huecos encontrados y cerrados

De 43 formas sintácticas, 41 ya eran compatibles. Las dos que no, ambas
cerradas en **v1.5.0**:

1. **Hojas cuyo nombre empieza por dígito.** El patrón del evaluador anterior
   es `[A-Za-z0-9]+!`, y los subtipos de este sistema se llaman `1F` y `3F`.
   `=1F!A1` es una referencia perfectamente plausible que habría pasado a
   `#ERROR`.
2. **Literales de texto entre comillas simples.** El evaluador anterior los
   admite porque `Function()` evalúa JavaScript.

## Cómo reproducir

```bash
cd project-back
npx ts-node -r tsconfig-paths/register src/db/scripts/syntax-compatibility-audit.ts
```

Sale con código 1 si alguna forma sintáctica deja de ser compatible.
