## Why

Las **fórmulas de diseño** (`design_function`) son el activo intelectual del negocio: definen cómo se calcula un transformador. Se guardan cifradas (AES-256-CBC) en `project-back` y solo el `secure-function-engine-api` (SFE) puede evaluarlas, de modo que `project-front` obtiene resultados sin ver nunca la expresión. El diseño del secreto es correcto. **Su administración no existe.**

Hoy la única forma de crear una fórmula es un `POST /design-functions` a mano. No hay listado, ni edición, ni borrado, ni historial. Una vez cifrada, la expresión es irrecuperable: no hay ruta de descifrado en ninguna parte del sistema. Las 6 fórmulas en producción se administran, en la práctica, con SQL directo.

Eso ya produjo daño observable. En la base de datos actual:

- **Los resultados guardados divergen en silencio.** Los `sub_design` 11–14 tienen `=QUADRATIC(A11)` → `computed: 1, 4, 9`; los `sub_design` 15–17 tienen **la misma fórmula** → `computed: 7, 9, 13`. Alguien cambió QUADRATIC entre una fecha y otra. Nada en el sistema registra cuál definición produjo cuál número, y no hay forma de saber cuál de los 25 diseños es confiable.
- **`code` no es único.** `CUBIC` existe en las filas 6 y 16; `QUADRATIC` en la 8 y la 10. `project-front` resuelve con `find(f => f.code === funcName)`: gana la primera. Ninguna restricción lo impide.
- **Colisión por prefijo, bug vivo.** `project-front` arma `new RegExp(code + "\\(([^)]*)\\)")`. Las fórmulas `COST` y `ASSOCIATE_COST` están asignadas al mismo subtipo, y `COST(` hace match dentro de `ASSOCIATE_COST(`. Con COST primero en el arreglo, **`=ASSOCIATE_COST(A1,B2)` se evalúa hoy como COST**.
- **Las constantes se sustituyen por substring.** El SFE hace `rightSide.replace(new RegExp(key, "g"), value)`. `CONST_1` corrompe a `CONST_10`, y una constante llamada `c` destruiría el `cos(x)` de cualquier expresión.
- **`project-front` ejecuta cada fórmula como JavaScript.** `Function('"use strict"; return (' + expression + ')')()` en 6 lugares de `SpreadSheet.tsx`, siendo la línea 3084 la ruta principal de toda celda. Una fórmula proveniente de un `.xlsx` importado es ejecución de código arbitrario en el navegador del usuario. Además hace que el resultado no sea reproducible fuera de un navegador, que es justo lo que se necesita para recalcular.

El costo de no hacerlo crece con cada diseño guardado: cada uno congela un número que nadie puede auditar ni reproducir.

## What Changes

**Administración de fórmulas (project-admin)**

- Nueva sección **Fórmulas**: listado con búsqueda y filtros por tipo (`DESIGN`/`COST`), estado y subtipo; alta, edición y baja lógica.
- Editor con la expresión **en claro**, editor estructurado de variables (orden explícito y bloqueado, porque el orden es contrato) y de constantes (nombre + valor validados).
- **Probador**: evaluar la fórmula con valores de prueba antes de publicarla, contra el motor real.
- **Asignación a subtipos de diseño** (`design_subtype_function`) desde la UI.
- **Historial de versiones** por fórmula y panel de **diseños desactualizados** con acción de recálculo.

**Versionado y linaje (project-back)**

- Nueva tabla `design_function_version`: la expresión cifrada, las variables y las constantes dejan de vivir en `design_function` y pasan a ser versiones. `design_function` conserva la identidad (nombre, código, tipo, descripción). Las 6 filas actuales migran a la versión 1.
- Toda evaluación usa **siempre la versión vigente**. Cada `sub_design` queda **estampado** con el conjunto de versiones que usó al calcularse; publicar una versión nueva **marca como desactualizados** los diseños afectados, sin cambiarles el valor.
- API REST completa de fórmulas: listar, detalle, crear, editar (publica versión), eliminar (baja lógica), publicar, asignar a subtipos, historial, y consulta de impacto ("qué diseños usan esta fórmula").
- Endpoint de recálculo por lotes de diseños desactualizados.
- **BREAKING (interno)**: `expression`, `variables` y `constants` salen de `design_function`. `POST /design-functions` y `POST /design-functions/calculate` conservan su contrato externo.

**Motor cifrado (secure-function-engine-api)**

- Nuevo `POST /function-engine/decrypt`, protegido con secreto compartido servicio-a-servicio. Es la pieza que habilita la edición. Solo `project-back` lo llama, solo para rol ADMIN, y cada acceso queda auditado. `project-front` no tiene ruta hacia él.
- Nuevo `POST /function-engine/validate`: valida sintaxis y declara las variables y constantes que la expresión realmente usa, sin cifrar ni persistir. Alimenta el editor y el probador.
- **Sustitución de constantes por token**, no por substring: se reemplazan símbolos del AST de mathjs, nunca texto. Corrige la corrupción `CONST_1`/`CONST_10` y `c`/`cos`.
- La clave de cifrado deja de leerse en el constructor sin verificación: se valida su longitud al arrancar (`aes-256-cbc` exige 32 bytes) en vez de fallar en la primera petición.

**Motor de fórmulas compartido (nuevo repo `rymel-formula-engine`)**

- El motor que ya existe en `project-admin/src/lib/formula/` (tokenizer, shunting-yard, RPN, grafo de dependencias, sin `eval`, con tests) se **extrae a un paquete propio**, consumido por los tres consumidores. No se copia código: `project-admin` pasa a importarlo y borra su copia local.
- Se le añade lo que hoy solo tiene `project-front`: referencias entre hojas (`Hoja1!A1`) y **funciones personalizadas remotas**, resueltas por un puerto inyectable y **evaluadas en lote por nivel de dependencia** en vez de una llamada de red por celda.
- `project-front` **retira sus 6 usos de `Function()`** y adopta el motor. Cierra el hueco de ejecución de código arbitrario y hace que el mismo insumo produzca el mismo resultado en navegador y en servidor.
- `project-back` usa el mismo paquete para recalcular diseños en lote sin depender de un navegador.

## Capabilities

### New Capabilities

- `shared-formula-engine`: El paquete `@rymel/formula-engine`: contrato de evaluación determinista, idéntico en navegador y en Node; referencias entre hojas; resolución de funciones personalizadas por puerto inyectable con lotes por nivel de dependencia; reglas de distribución y versionado del paquete.
- `design-function-catalog`: Modelo de datos de fórmulas con versionado y linaje, reglas de validación (unicidad y no-colisión de `code`, orden de variables como contrato, nombres de constantes), asignación a subtipos y API REST de administración en project-back.
- `secure-function-engine`: Contrato del motor cifrado: cifrar, descifrar bajo autenticación servicio-a-servicio, validar y evaluar; sustitución de constantes por token; verificación de la clave al arranque; y auditoría de todo descifrado.
- `design-function-admin`: La sección de administración en project-admin: listado y filtros, editor de expresión/variables/constantes, probador, asignación a subtipos, historial de versiones y panel de diseños desactualizados.
- `design-recalculation`: Estampado de versiones en los diseños, marcado de obsolescencia al publicar, recálculo por lotes desde el servidor, y el aviso en project-front de que ciertos valores cambiaron por una actualización de fórmulas.

### Modified Capabilities

Ninguna. `openspec/specs/` está vacío en este repo y este cambio no altera requisitos ya especificados. La relación con `phantom-item-grid-editor` (change `add-phantom-items-module`, en project-back) es de **origen del código**, no de requisitos: su motor de fórmulas es el que aquí se extrae a paquete.

## Impact

**Repos afectados: 5** (4 existentes + 1 nuevo). Los artefactos de planificación viven en `project-admin/openspec/`, pero la implementación toca cada repo por separado; no hay monorepo.

**`rymel-formula-engine`** (nuevo, `github.com/JaviAPS94/rymel-formula-engine`)
- Paquete TypeScript sin dependencias de runtime, sin React y sin módulos de Node: es la condición para que corra igual en navegador y en servidor.
- Build dual ESM/CJS, distribuido como dependencia de git con tag inmutable (`github:JaviAPS94/rymel-formula-engine#v1.0.0`). No requiere operar un registry.
- Semilla: `project-admin/src/lib/formula/` (`cellRef.ts`, `depGraph.ts`, `evaluate.ts`, `functions.ts` + sus specs).

**`project-admin`** (`rymel-admin`)
- Nueva página `FormulasPage` + ruta protegida por rol ADMIN, entrada en `Navbar` bajo "Administración".
- Nuevos `services/designFunctionService.ts`, `hooks/useDesignFunctions.ts`, `types/designFunction.types.ts`, siguiendo el patrón de `designCodeRules*`.
- **Se elimina `src/lib/formula/`**; sus importadores (el grid de fantasmas) pasan al paquete. Sin cambio de comportamiento: es el mismo código.

**`project-back`** (`rymel-back`)
- Migración: crea `design_function_version`, traslada `expression`/`variables`/`constants` de las 6 filas actuales a la versión 1, añade el estampado de versiones y la marca de obsolescencia en `sub_design`, e impone unicidad de `code` por tipo. Reversible.
- `src/modules/design/`: nuevo servicio de versiones, servicio de recálculo, endpoints de administración; `DesignFunctionService` deja de leer la expresión desde la entidad.
- Nueva dependencia del paquete compartido y variable de entorno para el secreto servicio-a-servicio del SFE.

**`secure-function-engine-api`**
- Nuevos endpoints `decrypt` y `validate`; guard de secreto compartido; sustitución de constantes reescrita sobre el AST de mathjs; validación de `ENCRYPTION_KEY` al arranque.
- Nueva variable de entorno `SFE_SERVICE_SECRET`. **Si el SFE se despliega con esta versión y `project-back` sin ella, `decrypt` responde 401** — hay orden de despliegue.

**`project-front`** (`rymel-front`)
- `SpreadSheet.tsx` (7305 líneas) sustituye su evaluador por el paquete: se retiran los 6 `Function()`, las 26 pasadas de `expression.replace()` y `useDepGraph.ts` local.
- Aviso en la hoja cuando sus valores fueron recalculados por un cambio de fórmula.
- **Es el cambio de mayor radio de impacto.** Los resultados los produce otro evaluador con semántica más estricta (hoy `Function()` acepta cualquier JavaScript). Se mitiga con una verificación en sombra sobre los 37 `sub_design` guardados antes de conmutar; ver `design.md`.

**Datos en producción**: 6 fórmulas, 8 asignaciones a subtipos, 25 diseños, 37 sub-diseños. `sub_design_function` está vacía y se retira. Volumen suficientemente pequeño para migrar y verificar exhaustivamente, en vez de por muestreo.

**Riesgo principal**: la unificación del evaluador en project-front. **Se mitiga** con la verificación en sombra como puerta de corte: el motor nuevo recalcula los 37 sub-diseños y se difunde contra el `computed` almacenado; toda divergencia se explica antes de conmutar (es un bug del motor nuevo, o un valor que ya estaba mal). El resto del cambio es aditivo.
