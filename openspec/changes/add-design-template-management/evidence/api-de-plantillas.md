# API de plantillas: verificación contra la base real

`check-template-admin.ts`, ejecutado el 2026-08-18. Crea una plantilla de
prueba, la ejercita y la borra; al terminar comprueba que la base quedó como
estaba (4 → 4 plantillas). **26 comprobaciones, todas pasan.**

## Lo que se verificó

| Requisito | Comprobación |
|---|---|
| Nace en borrador | `DRAFT`, versión 0, sin hojas |
| Unicidad de código | rechaza el duplicado nombrando la plantilla que lo usa |
| Nombres de hoja únicos | rechaza la segunda hoja con el mismo nombre |
| Posiciones consecutivas | `[0,1]` tras crear dos hojas |
| Guardado por hoja | celdas y filas ocultas conservadas |
| Reordenamiento | `["Tablas","Resumen"]` en una sola operación |
| Validación en servidor | detecta `unknown-sheet` en `=NoExiste!A1` |
| Publicación bloqueada | no publica y la versión no avanza |
| Publicación válida | publica, versión 1, borrador desaparece, hojas en filas |
| **Aislamiento del borrador** | editar una publicada deja `*2` en las filas y `*99` solo en el borrador |
| Concurrencia | rechaza la escritura basada en un borrador viejo |
| Historial | instantánea al publicar sobre lo publicado |
| Restauración | deja borrador sin cambiar la versión publicada |
| Duplicación | copia en borrador, con hojas, sin heredar historial |

El aislamiento del borrador es el que justifica la decisión 11 de `design.md`:
mientras alguien edita una plantilla publicada, lo que cargan los diseñadores
no cambia.

## Un detalle que la verificación destapó

La duplicación heredaba los identificadores de fila de las hojas del original.
Publicar la copia habría sobrescrito las hojas del original. La copia ahora
nace sin identificadores de hoja.
