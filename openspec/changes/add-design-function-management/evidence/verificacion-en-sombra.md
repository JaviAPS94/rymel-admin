# Verificación en sombra del motor de fórmulas

Ejecutada el 2026-08-14T02:47:17.013Z

## Resumen

- Sub-diseños con fórmulas: **26** de 37
- Celdas comparadas: **104**
- Coincidentes: **82**
- Divergentes: **22**

| clasificación | celdas | ¿bloquea? |
|---|---|---|
| funcion-no-resoluble | 16 | no |
| deriva-de-version | 2 | no |
| valor-previamente-erroneo | 4 | no |

## Resultado: **puerta abierta**

Ninguna divergencia sin clasificar y ningún defecto del motor. project-front puede adoptar el motor compartido.

## Detalle de las divergencias

### funcion-no-resoluble (16)

> el diseño no tiene subtipo, así que la fórmula no se puede resolver

| sub-diseño | celda | fórmula | almacenado | recalculado |
|---|---|---|---|---|
| 11 Sub Diseño Prueba 1 | B11 | `=QUADRATIC(A11)` | 1 | "#ERROR" |
| 11 Sub Diseño Prueba 1 | B12 | `=QUADRATIC(A12)` | 4 | "#ERROR" |
| 11 Sub Diseño Prueba 1 | B13 | `=QUADRATIC(A13)` | 9 | "#ERROR" |
| 11 Sub Diseño Prueba 1 | B14 | `=QUADRATIC(A14)` | 0 | "#ERROR" |
| 12 Sub Diseño Prueba 2 | B11 | `=QUADRATIC(A11)` | 1 | "#ERROR" |
| 12 Sub Diseño Prueba 2 | B12 | `=QUADRATIC(A12)` | 4 | "#ERROR" |
| 12 Sub Diseño Prueba 2 | B13 | `=QUADRATIC(A13)` | 9 | "#ERROR" |
| 12 Sub Diseño Prueba 2 | B14 | `=QUADRATIC(A14)` | 0 | "#ERROR" |
| 13 Sub Diseño Prueba 1 | B11 | `=QUADRATIC(A11)` | 1 | "#ERROR" |
| 13 Sub Diseño Prueba 1 | B12 | `=QUADRATIC(A12)` | 4 | "#ERROR" |
| 13 Sub Diseño Prueba 1 | B13 | `=QUADRATIC(A13)` | 9 | "#ERROR" |
| 13 Sub Diseño Prueba 1 | B14 | `=QUADRATIC(A14)` | 0 | "#ERROR" |
| 14 Sub Diseño Prueba 2 | B11 | `=QUADRATIC(A11)` | 1 | "#ERROR" |
| 14 Sub Diseño Prueba 2 | B12 | `=QUADRATIC(A12)` | 4 | "#ERROR" |
| 14 Sub Diseño Prueba 2 | B13 | `=QUADRATIC(A13)` | 9 | "#ERROR" |
| 14 Sub Diseño Prueba 2 | B14 | `=QUADRATIC(A14)` | 0 | "#ERROR" |

### deriva-de-version (2)

> ambos valores son válidos: el almacenado se calculó con una definición anterior de la fórmula

| sub-diseño | celda | fórmula | almacenado | recalculado |
|---|---|---|---|---|
| 82 SubDiseño1 | B12 | `=QUADRATIC(A12)` | 7 | 9 |
| 82 SubDiseño1 | B13 | `=QUADRATIC(A13)` | 7 | 13 |

### valor-previamente-erroneo (4)

> el valor almacenado ya era un error; el motor nuevo sí lo resuelve

| sub-diseño | celda | fórmula | almacenado | recalculado |
|---|---|---|---|---|
| 88 Hoja2 | B11 | `=QUADRATIC(A11)` | "#ERROR" | 7 |
| 88 Hoja2 | B12 | `=QUADRATIC(A12)` | "#ERROR" | 9 |
| 88 Hoja2 | B13 | `=QUADRATIC(A13)` | "#ERROR" | 13 |
| 88 Hoja2 | B14 | `=QUADRATIC(A14)` | "#ERROR" | 7 |
