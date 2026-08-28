# Saneamiento de las plantillas: simulación, aplicación y reversión

Ejecutado sobre la base `project` el 2026-08-18, en este orden: simular,
contrastar con la línea base, aplicar, revertir, comparar, volver a aplicar.

## 1. Simulación previa (`dry-run-template-normalization.ts`)

```
=== TEMPLATE_1F_0001 (Template 1F) — 2 hoja(s)
  posiciones ambiguas [0,0] -> quedarían [0,1]
  Resumen: 1111 celdas -> 440 (descarta 671)  [coincide con la línea base]
  Tablas: 1902 celdas -> 1598 (descarta 304)  [coincide con la línea base]
  tamaño: 364.4 KB -> 141.3 KB
  validación: sin diagnósticos

=== TEMPLATE_3F_0001  — 0 hoja(s) -> pasaría a DRAFT
=== TEMPLATE_3F_0002  — 0 hoja(s) -> pasaría a DRAFT
=== COST_TEMPLATE_1F_0001 — 0 hoja(s) -> pasaría a DRAFT

Sin desviaciones respecto de la línea base.
```

Los conteos coinciden **exactamente** con los del inventario, hecho de forma
independiente. El documento encoge un **61 %**: 364.4 KB → 141.3 KB, sin perder
nada que se use — las 224 celdas que solo llevan formato se conservan.

La validación no encuentra un solo diagnóstico en la plantilla real. Era la
comprobación que más importaba: un validador que rechazara la única plantilla
completa que existe no serviría de nada.

## 2. Un obstáculo que solo aparece al ejecutar

`template.code` estaba declarado `nvarchar(max)`, y SQL Server no admite ese
tipo como columna de un índice: la unicidad del código era **imposible de
imponer** tal como estaba el esquema. La migración lo estrecha a
`nvarchar(100)` —el código más largo que hay guardado son 21 caracteres— antes
de crear el índice.

Del mismo modo, el índice único de `(template_id, order)` no puede crearse en
la migración de esquema, porque las dos hojas reales valen ambas 0 y la
creación falla. Lo crea la migración de normalización, después de arreglar los
datos: primero el dato, después la restricción.

## 3. Estado tras aplicar

| Plantilla | Estado | Versión | Contrato |
|---|---|---|---|
| `TEMPLATE_1F_0001` | PUBLISHED | 1 | 1.0.0 |
| `TEMPLATE_3F_0001` | **DRAFT** | 0 | — |
| `TEMPLATE_3F_0002` | **DRAFT** | 0 | — |
| `COST_TEMPLATE_1F_0001` | **DRAFT** | 0 | — |

| Hoja | `order` | Antes | Después |
|---|---|---|---|
| `Resumen` | 0 | 114 437 | 27 986 |
| `Tablas` | **1** | 236 441 | 106 529 |

Cuatro instantáneas en `template_revision`, una por plantilla, con el contenido
literal previo.

El índice único está activo y verificado: intentar poner `order = 0` en la
segunda hoja falla con *«Cannot insert duplicate key row»*.

## 4. Reversión verificada byte a byte

Aplicada la migración, se revirtió y se compararon los SHA-256 de `cells` y
`cellsStyles` de cada hoja, más su `order`, su tamaño y el estado de cada
plantilla:

```
hojas idénticas tras revertir: true
plantillas idénticas tras revertir: true
```

No es una reserialización parecida: la instantánea guarda las cadenas tal cual
estaban, sin interpretarlas, y `down()` las devuelve como estaban.

## 5. Idempotencia

Vuelta a ejecutar la simulación sobre los datos ya normalizados:

```
  Resumen: 440 celdas -> 440 (descarta 0)  [ya normalizada con el contrato 1.0.0]
  Tablas: 1598 celdas -> 1598 (descarta 0)  [ya normalizada con el contrato 1.0.0]
  tamaño: 141.3 KB -> 141.3 KB
```

La normalización no erosiona el documento al repetirse. La simulación distingue
«ya normalizada» de «desviación», para que volver a ejecutarla después de
migrar no dé una alarma falsa.
