# Inventario de las plantillas reales

Extraído de la base `project` (MSSQL) el 2026-08-18. El volcado literal está en
`rymel-design-template/test/fixtures/legacy-templates.json` y es el material de
prueba del paquete de contrato.

## 1. Qué hay

| Plantilla | Código | Tipo | Subtipo | Hojas |
|---|---|---|---|---|
| 3 | `TEMPLATE_1F_0001` | DESIGN | 1 | 2 |
| 4 | `TEMPLATE_3F_0001` | DESIGN | 2 | **0** |
| 5 | `TEMPLATE_3F_0002` | DESIGN | 2 | **0** |
| 6 | `COST_TEMPLATE_1F_0001` | COST | 1 | **0** |

Confirmado con el responsable del producto: **solo la plantilla 3 está
completa**; las otras tres están a medio hacer. Se quedan en `DRAFT`.

## 2. La única plantilla completa

| Hoja | `order` | Celdas | Fórmulas | Literales | Sin contenido | Solo formato | Extensión |
|---|---|---|---|---|---|---|---|
| `Resumen` | 0 | 1111 | 8 | 233 | **671** | 199 | hasta `AH73` |
| `Tablas` | 0 | 1902 | 1 | 1572 | **304** | 25 | hasta `Z232` |

**Corrección respecto de la estimación inicial del change.** El proposal hablaba
de 45 celdas sin contenido en `Resumen`; esa cifra contaba solo las celdas sin
las claves `value`/`formula`. Contando también las que las traen vacías, y
excluyendo las que llevan formato (que sí se conservan), las celdas que la
normalización descarta son **975 de 3013, un 32 % del documento**.

Otros hechos del volcado:

- `value` y `formula` coinciden en **las 2963 celdas** que traen ambas: la
  consolidación en un solo campo es sin pérdida.
- Ninguna referencia de celda está mal formada.
- `cellsStyles` persiste la forma *runtime* de la hoja: `templateHiddenRows`,
  `templateHiddenColumns`, `userHiddenRows`, `userHiddenColumns` y
  `hiddenCells`. Los tres últimos son estado del diseñador, no de la plantilla,
  y no deben persistirse. Todos están vacíos hoy.
- `namedRanges` vive dentro de `cellsStyles`; `semiFinishedZones` e
  `itemCatalogTables` no aparecen: ninguna plantilla los usa todavía.
- Uso real de formato: `border` 1907, `bold` 24, `textColor` 20, `mergedCells`
  151, `options` 2 (una lista `["Aluminio","Cobre"]` en `I23`), `goTo` 1
  (`Q10`, condicionado por `I23`), `freezeRow` 7.
- `Resumen` llega a la columna `AH` (34.ª). Confirma que la rejilla del editor
  necesita las 50 columnas de `project-front`, no las 26 de `COLUMN_LABELS`.

## 3. Las 9 celdas con `=`, evaluadas contra `@rymel/formula-engine` v1.5.0

> Son 9, no 8: las 7 fórmulas y la directiva de gráfico de `Resumen`, más
> `=SUM(B2:B9)` en `Tablas!B10`.

| Celda | Fórmula | Resultado |
|---|---|---|
| `T28` | `=Tablas!C231` | correcto |
| `T29` | `=Tablas!C232` | correcto |
| `AE30` | `=AE28*AE29+I22/100+8.3` | correcto |
| `AH29` | `=AE28*AE29` | correcto |
| `I39` | `=Q14*10^6/(2.22*I34*...*10^3)` | correcto |
| `C6` | `=AE42*(VLOOKUP(I39*10; Tablas!B45:Tablas!C156; 2; TRUE))` | **`#ERROR`** |
| `G17` | `=G14*(VLOOKUP(G13;Tablas!B3:Tablas!C10;2;TRUE))` | **`#ERROR`** |
| `K73` | `=DRAW:BOBINADO:D56:D59,D60,...` | **`#ERROR`** |

Tres causas distintas, todas verificadas ejecutando el motor contra el volcado:

### 3.1 El separador de argumentos es `;`, y el motor solo acepta `,`

Las plantillas están escritas con la convención regional española. La misma
fórmula con comas evalúa correctamente:

```
=G14*(VLOOKUP(G13;Tablas!B3:Tablas!C10;2;TRUE))   -> #ERROR
=G14*(VLOOKUP(G13,Tablas!B3:C10,2,TRUE))          -> 15
```

### 3.2 Los rangos vienen calificados en los dos extremos

`Tablas!B45:Tablas!C156`. El motor admite `Hoja!A1:B5` (prefijo una sola vez).

Esto no es solo un problema de evaluación: `extractPrecedents` sobre esa forma
devuelve **únicamente los dos extremos**, `Tablas!B45` y `Tablas!C156`, en vez
de expandir el rango. El grafo de dependencias queda incompleto, así que un
cambio en `Tablas!C100` no marca como sucia la celda que lo consulta. Es un
defecto latente del grafo, no solo del resultado.

### 3.3 `=DRAW:` no es una fórmula

Es una directiva de gráfico que `SpreadSheetCell.tsx` interpreta para dibujar
dentro de la celda (`InlineCellGraphic.tsx`). Está almacenada **con `=`**, y su
`computed` guardado es el mismo texto sin el `=`, que es lo que el renderizador
lee:

```
value:    "=DRAW:BOBINADO:D56:D59,D60,D61,D62:..."
computed: "DRAW:BOBINADO:D56:D59,D60,D61,D62:..."
```

El motor la trata como fórmula: da `#ERROR` y, peor, `extractPrecedents` le
inventa precedentes (`D56`, `D57`, `D58`, `D59`, `E59`, `F59`…) al leer los
tramos `D56:D59` como rangos, metiendo aristas falsas en el grafo.

### 3.4 `C6` tiene además una causa propia, y no es del motor

Corregidas las dos anteriores, `G17` volvió a dar los **20** que tenía
guardados. `C6` siguió en `#ERROR`, y la razón resultó ser otra:

**El cuarto argumento de `BUSCARV`/`VLOOKUP` está invertido respecto de Excel.**
En Excel, `TRUE` significa búsqueda **aproximada** y `FALSE`, exacta. El motor
hace lo contrario:

```ts
const exact = exactArg === undefined ? true
  : typeof exactArg === "number" ? exactArg !== 0 : ...
```

No lo introdujo el motor. El evaluador anterior de `project-front` tenía
exactamente la misma línea (`git show 6c0fe11^`):

```js
const exactMatch = params[3]
  ? params[3].toLowerCase() === "true" || params[3] === "1"
  : true;
```

El motor lo replicó fielmente, y sus pruebas lo fijan
(`BUSCARV encuentra por coincidencia exacta` con `"TRUE"`). Es una desviación
**heredada**, no una regresión.

Con esa semántica, `C6` busca `I39*10 = 14.2247…` de forma exacta en
`Tablas!B45:C156` y no lo encuentra. Pero es que **la tabla está a medio
escribir**: `B45` es el texto `"T"`, `C45` es `"M0 0,75"`, y de `B46` en
adelante todo vale 9 con 0 al lado. Su valor guardado es `0` — no un número de
la tabla, sino el `0` que el evaluador anterior devolvía cuando la búsqueda
fallaba. El motor da `#ERROR` en su lugar, por la decisión explícita del change
anterior de no dejar que un cálculo fallido siga viajando disfrazado de número.

Es decir: `C6` **ya no calculaba nada** antes de este trabajo. Mostraba un 0
que parecía un resultado.

### 3.5 Consecuencia: dos regresiones de la migración y una desviación heredada

`project-front` ya evalúa con el motor compartido (`formula-evaluation.ts`
enruta todo por `evaluateCell` / `evaluateSheet`), y `loadTemplate` recalcula
la plantilla entera al cargarla. Es decir: **hoy, al abrir `Template 1F` en
`project-front`, `C6` y `G17` dan `#ERROR` y el dibujo de `K73` desaparece**,
porque su `computed` se sobrescribe con `#ERROR`.

De las tres, **dos son regresiones de la migración al motor** —el evaluador
anterior sí normalizaba `;` a `,` y sí entendía `Tablas!B3:Tablas!C10`, como se
ve en el mismo `git show 6c0fe11^`— y se corrigen restaurando la paridad. La
tercera, el `#ERROR` de `C6`, tiene la causa aparte que describe el punto 3.4 y
**no se arregla en este change**.

## 4. Catálogo de claves de elemento (pregunta abierta 2)

**Sí existe y es consultable.** La tabla `field` guarda en `base` un JSON con la
definición de los campos del elemento, relacionado con el subtipo:

```json
{
  "phases":          { "label": "Fases", "type": "number", "validations": { "group": [1,3] } },
  "power":           { "label": "Potencia [kVA]", "type": "number", "validations": { "positives": true, "decimalsNumber": 1 } },
  "primaryVoltage":  { "label": "Voltaje Primario [V]", "type": "number", ... },
  "secondaryVoltage":{ "label": "Voltaje secundario [V]", "type": "string", ... }
}
```

Las claves de ese objeto son exactamente los `elementKey` que una celda puede
declarar, y traen etiqueta y tipo, que es lo que el editor necesita para
ofrecerlas en vez de pedirlas escritas a mano.

**Falta el endpoint**: el módulo `field` de `project-back` es un esqueleto
—`FieldService` está vacío y el controlador no expone rutas—. Hay que añadir la
lectura de los campos por subtipo.

## 5. Exposición de los diseños ya guardados al motor nuevo

Medido sobre `sub_design` el 2026-08-18, antes de decidir si `project-front`
sube el tag del motor. La pregunta es si las tres correcciones de v1.6.0
pueden cambiar algún número ya calculado:

| | |
|---|---|
| `sub_design` con datos | 31 |
| celdas con fórmula | 64 |
| celdas con `#ERROR` guardado | **0** |
| celdas con separador `;` | **0** |
| celdas con rango calificado en ambos extremos | **0** |
| celdas de gráfico (`DRAW:`) | **0** |
| `sub_design` afectados | **0** |

**Ninguno.** Las tres construcciones que v1.6.0 corrige solo aparecen en la
plantilla, no en los diseños guardados a partir de ella. Los 31 diseños usan
64 fórmulas, todas con sintaxis que v1.5.0 ya entendía.

Es la diferencia con la inversión de `BUSCARV` de la sección 3.4: aquella sí
cambiaría resultados guardados y por eso queda fuera; esta no puede cambiarlos,
así que subir el tag en `project-front` no necesita verificación en sombra.
