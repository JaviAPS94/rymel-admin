# Retirada de los campos espejo

## 1. La condición, comprobada

El contrato escribía cuatro campos por duplicado —`templateHiddenRows`,
`templateHiddenColumns`, `value` y `catalogSheetId`— para que `project-front`
funcionara mientras no lo consumiera. La condición para quitarlos era que nadie
los leyera.

No se dio por supuesta. Se sirvieron las plantillas **sin los cuatro campos** y
se ejecutaron las verificaciones:

| Sobre | Campos quitados | Resultado |
|---|---|---|
| La plantilla real | 2042 | carga y calcula igual |
| La plantilla de ida y vuelta | 23 | las 18 comprobaciones pasan |

Las dos que importaban, porque eran los casos concretos del defecto original:

```
ok  la fila oculta de la plantilla se respeta — 7
ok  el enlace a ítem llega
```

**La declaración estaba desfasada.** Decía que `project-front` los leía, y ya
no: los lee del objeto que arma `runtimeSheetsFromTemplate`, no del JSON. Los
nombres de runtime (`templateHiddenRows` en `Sheet`, `value` en `Cell`) siguen
existiendo en memoria; lo que desapareció es su lectura desde lo guardado.

Confirmado también que `project-back` no lee ninguno.

## 2. Qué se hizo

**Contrato v2.0.0.** Deja de escribirlos. Mayor por definición: una plantilla
escrita sin ellos deja de leerse igual en un consumidor anterior a la
migración.

**Se siguen aceptando al leer**, y hay una prueba que lo fija. Dejar de
escribir algo no es lo mismo que dejar de entenderlo: una copia de seguridad
anterior a esta migración se restaura y se lee igual.

`DEPRECATED_FIELDS` queda **vacía y no se borra**. La prueba comprueba que se
escribe exactamente lo declarado, así que con la lista vacía escribir cualquier
espejo vuelve a fallar. El guardarraíl sigue puesto después de cruzar el
puente, y añadir uno nuevo obliga a declararlo con quién lo lee. `RETIRED_FIELDS`
conserva los cuatro con la versión en que se fueron.

**Migración `1788400000000-retire-mirror-fields`.** El contrato dejó de
escribirlos, pero eso solo vale para lo que se guarde a partir de ahora. Esto
los quita de lo que ya está guardado:

| Hoja | `value` | `templateHidden*` | Bytes |
|---|---|---|---|
| `Resumen` | 440 → **0** | sí → **no** | 27 986 → 20 737 |
| `Tablas` | 1598 → **0** | sí → **no** | 106 529 → 82 267 |

**2038 campos eliminados, 23 % menos de documento.**

Reversión verificada byte a byte, como en el saneamiento: aplicar, revertir,
comparar hashes (`idéntico tras revertir: true`), volver a aplicar.

## 3. Verificación posterior

Con los tres repositorios en v2.0.0 y el dato ya reescrito:

| | |
|---|---|
| Contrato | 96 pruebas |
| project-admin | 27 pruebas, typecheck y build |
| project-back | 26 comprobaciones de administración, build y lint |
| Ida y vuelta | 18 comprobaciones, incluida «ya no se escribe el campo espejo» |
| Carga de la plantilla real | sin cambios: `G17` en 20, dibujo intacto, `C6` único error |

Una comprobación de la ida y vuelta tuvo que invertirse: exigía que el espejo
se escribiera. Ahora exige lo contrario, y que el contenido de la celda viaje
en un solo campo.
