## Context

Cinco repositorios independientes de GitHub bajo un mismo propietario (`JaviAPS94`), sin monorepo y sin registry privado propio. Cuatro existen; el quinto lo crea este cambio.

```
project-front ──┐                        (grid tipo Excel, evalúa con Function())
project-admin ──┼──► project-back ──► secure-function-engine-api
                │    (MSSQL, TypeORM)     (AES-256-CBC, mathjs)
                └──► (nuevo) rymel-formula-engine
```

**Estado real de los datos** (verificado contra la base `project` en MSSQL): 6 fórmulas, 8 asignaciones a subtipos, 25 diseños, 37 sub-diseños, `sub_design_function` vacía. Los valores calculados viven dentro de `sub_design.data`, un JSON donde cada celda es `{ value, formula, computed }`. Que la fórmula original esté guardada junto al resultado es lo que hace posible recalcular; sin eso, este cambio no tendría salida.

**Restricciones que condicionan el diseño:**

1. El secreto de negocio es la expresión. `project-front` nunca debe poder obtenerla; hoy no puede, y eso no se negocia.
2. Las hojas invocan las fórmulas con **argumentos posicionales** (`=CUBIC(A1, B2)` → `variables[0]=x`, `variables[1]=b`). El orden de las variables es contrato de datos, no un detalle de presentación.
3. `POST /design-functions/calculate` **ya acepta un arreglo** de evaluaciones. `project-front` lo llama de a una en un bucle. La capacidad de lote existe y está desaprovechada.
4. `project-admin` ya tiene un evaluador correcto y probado en `src/lib/formula/` (tokenizer, shunting-yard, RPN, grafo de dependencias, sin `eval`), producto del change `add-phantom-items-module`. No hay que escribirlo: hay que moverlo.
5. `project-front` evalúa con `Function('"use strict"; return (' + expression + ')')()` en 6 lugares de un componente de 7305 líneas, precedido por 26 pasadas de `expression.replace()`. Es ejecución de código arbitrario y es semánticamente imposible de reproducir fuera de un navegador.

## Goals / Non-Goals

**Goals:**

- Administrar fórmulas de punta a punta desde project-admin: alta, consulta en claro, edición, baja, prueba, asignación a subtipos e historial.
- Que todo resultado calculado sea **atribuible**: saber qué definición de qué fórmula produjo cada número.
- Un solo motor de evaluación, en un solo lugar, que produzca el mismo resultado en el navegador y en el servidor.
- Recalcular diseños existentes desde el servidor, sin depender de que alguien los abra.
- Cerrar los cuatro defectos vivos: colisión de códigos por sufijo, corrupción de constantes por substring, códigos duplicados sin restricción, y ejecución de código arbitrario en el navegador.

**Non-Goals:**

- Consolidar los cinco repositorios en un monorepo. Es probablemente lo correcto a plazo, pero es un proyecto en sí mismo y no es requisito de este.
- Reescribir `SpreadSheet.tsx`. Se le sustituye el evaluador; su interfaz de usuario, su edición y su persistencia no se tocan.
- Fijar cada diseño a la versión con la que se calculó. Se evaluó y se descartó a favor del marcado de obsolescencia (decisión 3).
- Un editor visual de fórmulas o autocompletado sobre la expresión. La entrada es texto.
- Operar un registry npm privado.

## Decisions

### 1. El motor se extrae a un repositorio propio, distribuido como dependencia de git con tag inmutable

`@rymel/formula-engine`, repositorio `JaviAPS94/rymel-formula-engine`, consumido como `"@rymel/formula-engine": "github:JaviAPS94/rymel-formula-engine#v1.0.0"`.

*Por qué así:* son cuatro consumidores en cuatro repositorios separados. La única forma de no repetir código es un artefacto versionado, y la pregunta real es por qué canal se distribuye. La dependencia de git con tag da inmutabilidad y fijación de versión sin operar nada: npm la resuelve de forma nativa, funciona en CI con un token, y no requiere infraestructura.

*Alternativas consideradas:*
- **Registry (GitHub Packages o npm)**: es lo correcto a plazo y sigue siendo el destino natural. Se descarta ahora porque GitHub Packages exige autenticación incluso para leer paquetes públicos, lo que añade fricción de `.npmrc` en cuatro repos y en cada despliegue, a cambio de nada que el tag de git no dé ya. La máquina de desarrollo tiene además `.npmrc` apuntando a registries del empleador del desarrollador, que no deben usarse para este proyecto.
- **`file:../rymel-formula-engine`**: rompe en CI y en despliegue, porque asume una disposición del disco. Sirve solo para iterar en local, vía `npm link`.
- **Monorepo**: resuelve esto y más, pero convierte un cambio de producto en una migración de infraestructura.

*La decisión que importa no es el canal sino la frontera.* Mover de tag de git a registry después es una línea por consumidor; extraer el paquete es lo caro, y es lo que se hace ahora.

**Restricción dura del paquete:** cero dependencias de runtime, sin React, sin módulos de Node, sin APIs de navegador. No es purismo: es la condición para que el recálculo del servidor produzca exactamente lo que el usuario ve en pantalla. En cuanto el paquete dependa del entorno, el recálculo deja de ser confiable y todo el cambio pierde su fundamento. Se verifica en el pipeline del paquete.

**Versionado:** el resultado numérico es parte del contrato. Un cambio que altere el valor de una fórmula ya válida es versión mayor aunque no toque ninguna firma pública.

### 2. Núcleo síncrono con puerto asíncrono inyectable, y lotes por nivel de dependencia

El motor de project-admin es síncrono. Las fórmulas de diseño exigen una llamada remota. La tentación es volver todo asíncrono y hacer `await` por celda; sería una llamada de red por celda con función personalizada — es exactamente lo que hace `project-front` hoy.

La estructura elegida:

```
evaluateSheet(cells, { resolveCustomFunctions })
  → orden topológico (grafo de dependencias)
  → por cada nivel:
      · evaluar sincrónicamente todo lo que no sea función personalizada
      · recolectar las invocaciones de función personalizada del nivel
      · UNA llamada a resolveCustomFunctions(lote)
      · asignar resultados y continuar al siguiente nivel
```

El número de llamadas de red pasa a depender de la **profundidad** del grafo, no de la cantidad de celdas. En una hoja con 40 celdas `=QUADRATIC(...)` independientes: hoy son 40 peticiones, con esto es 1.

`resolveCustomFunctions` es un puerto que el consumidor inyecta: `project-front` con HTTP a `project-back`, `project-back` llamando a su propio servicio en proceso. El núcleo no conoce transporte, URL ni autenticación, y por eso permanece puro y testeable sin red.

*Alternativa considerada:* precargar todas las fórmulas descifradas en el cliente y evaluar localmente. Elimina la red por completo, y está descartada de plano: entrega el secreto de negocio al navegador.

### 3. Versionado sin fijación: siempre la versión vigente, con estampado y marca de obsolescencia

**Modelo:** `design_function` conserva la identidad (`name`, `code`, `type`, `description`). Nace `design_function_version` con `expression` (cifrada), `variables`, `constants`, `version`, `is_current`, `created_by`, `created_at`. Las versiones publicadas son inmutables; corregir es publicar.

**Resolución:** toda evaluación usa la versión vigente. Cada `sub_design` guarda con qué versiones se calculó; publicar marca como desactualizados los que quedaron atrás, **sin tocarles los valores**.

*Por qué no fijar cada diseño a su versión:* es reproducible por construcción, pero significa mantener vivas para siempre todas las versiones de todas las fórmulas en la ruta de cálculo, y que dos diseños del mismo subtipo den números distintos sin que el usuario entienda por qué. Para un catálogo de 6 fórmulas y 25 diseños, el costo conceptual supera al beneficio. El marcado de obsolescencia conserva lo que de verdad hacía falta — **saber que un número quedó viejo** — que es precisamente lo que hoy no existe y produjo la divergencia entre los `sub_design` 11–14 y 15–17.

*Dónde se guarda el estampado:* en columnas nuevas de `sub_design` (`function_versions` como JSON y `is_stale`), **no dentro de `sub_design.data`**. El JSON de celdas es el formato que intercambian tres consumidores; meterle metadatos obliga a que los tres lo entiendan y complica la verificación en sombra. Como columna, la migración es aditiva y `data` permanece intacto.

### 4. El descifrado es una operación privilegiada, no una propiedad del dato

`POST /function-engine/decrypt` en el SFE, tras un secreto compartido servicio-a-servicio comparado en tiempo constante. `project-back` es el único llamante, solo para rol ADMIN, y registra cada acceso con usuario, fórmula, versión y marca de tiempo.

*Alternativas consideradas:*
- **Columna en claro junto a la cifrada**: trivial de implementar y anula el propósito del motor cifrado — cualquiera con acceso a la base lee todo el activo intelectual. Descartada.
- **Edición a ciegas (write-only)**: máxima seguridad, y en la práctica obliga a reescribir la expresión completa de memoria para corregir un signo. Descartada por inviable.

El razonamiento: el texto plano no se convierte en un atributo consultable de la fórmula, sino en el resultado de una operación autenticada, auditada y limitada a un rol. La superficie expuesta es una petición explícita de un administrador, no una columna.

Se añade también `POST /function-engine/validate`, que valida sintaxis y declara los símbolos usados sin cifrar ni persistir nada: alimenta el editor y el probador sin obligar a guardar para saber si la expresión sirve.

### 5. Las constantes se sustituyen sobre el árbol sintáctico, nunca sobre el texto

Hoy: `rightSide.replace(new RegExp(key, "g"), value)`. Con `CONST_1 = 4` y `CONST_10 = 9`, la expresión `CONST_10` se convierte en `40`. Con una constante `c`, `cos(x)` se convierte en `2os(x)`.

mathjs, ya presente en el SFE, expone el árbol de la expresión. La sustitución pasa a hacerse sobre nodos de símbolo, o equivalentemente pasando las constantes como parte del ámbito de evaluación junto a las variables. Un símbolo se sustituye por su nombre completo o no se sustituye.

La misma clase de defecto aparece en `project-front` al resolver los códigos de función por expresión regular sin límites (`COST` capturando dentro de `ASSOCIATE_COST`); ahí se resuelve reconociendo el código como unidad léxica en el tokenizador del motor compartido, no con expresiones regulares sobre el texto de la fórmula.

### 6. La sustitución del evaluador en project-front se corta contra una verificación en sombra

Es el punto de mayor riesgo del cambio. `Function()` acepta cualquier JavaScript; el motor compartido acepta un lenguaje de fórmulas estricto. Alguna fórmula guardada puede depender de una permisividad que el motor nuevo no tiene.

**Puerta de corte:** antes de habilitar el motor nuevo en `project-front`, se reevalúan con él los 37 sub-diseños almacenados y se difunden todos los valores calculados contra el `computed` guardado. Cada divergencia se clasifica: o es un defecto del motor nuevo, y se corrige; o es un valor que ya estaba mal, y se documenta. No se conmuta con divergencias sin clasificar.

Con 37 sub-diseños esto es exhaustivo, no un muestreo. Es la ventaja de hacerlo ahora y no con diez veces más datos.

*Por qué no convivir con los dos evaluadores tras una bandera:* duplicaría indefinidamente la semántica que este cambio busca unificar, y la bandera se volvería permanente. La verificación en sombra da la misma confianza sin dejar deuda.

### 7. Orden de despliegue

Hay una dependencia dura: si el SFE se despliega exigiendo el secreto servicio-a-servicio y `project-back` todavía no lo envía, el descifrado responde 401.

```
1. rymel-formula-engine v1.0.0        (paquete; nadie lo consume aún)
2. secure-function-engine-api         (decrypt/validate; el secreto se acepta
                                       ausente durante una ventana de transición)
3. project-back                       (migración + API + envío del secreto)
4. SFE: se exige el secreto           (cierre de la ventana)
5. project-admin                      (sección de fórmulas)
6. verificación en sombra             (puerta de corte)
7. project-front                      (motor compartido + aviso de recálculo)
```

Los pasos 1–5 son aditivos y reversibles por separado. Solo el 7 cambia el comportamiento de un usuario existente, y va después de la puerta de corte.

## Risks / Trade-offs

**El motor compartido cambia resultados en project-front** → La verificación en sombra sobre los 37 sub-diseños es la puerta de corte; ninguna divergencia queda sin clasificar antes de conmutar. Volumen pequeño, verificación exhaustiva.

**Se altera el motor de `project-admin`, que hoy usa el grid de fantasmas** → La extracción es un movimiento de archivos sin cambio de comportamiento, y las pruebas del motor viajan con él. Las capacidades nuevas (referencias entre hojas, funciones personalizadas) son aditivas: el grid de fantasmas no las usa y no cambia.

**Un cuarto repositorio más que versionar y liberar** → Costo real y aceptado: es el precio de no duplicar el motor en tres lugares. Se acota con tags inmutables y actualización deliberada por consumidor; ningún consumidor se ve arrastrado por una publicación.

**El descifrado abre una superficie que hoy no existe** → Secreto servicio-a-servicio comparado en tiempo constante, restricción a rol ADMIN en `project-back`, auditoría de cada acceso, y ninguna ruta alcanzable desde el navegador. El texto plano nunca aparece en listados ni en respuestas hacia `project-front`.

**Los códigos duplicados de producción (`CUBIC`, `QUADRATIC`) rompen la restricción de unicidad** → La migración no borra ni fusiona nada: crea la restricción para lo nuevo y marca los conflictos heredados para que un administrador los resuelva desde la interfaz. Nunca se decide automáticamente cuál fórmula sobrevive.

**El recálculo del servidor escribe sobre datos de producción** → Transaccional por sub-diseño, con registro de valor anterior y nuevo por celda. Un fallo deja el sub-diseño exactamente como estaba. El registro permite revertir y es lo que alimenta el aviso al usuario.

**El marcado de obsolescencia no reproduce el pasado** → Trade-off aceptado y explícito: se sabe que un número quedó viejo, no se puede regenerar el número viejo. Recuperar esa capacidad exigiría fijar versiones por diseño, con el costo descrito en la decisión 3. El historial de versiones queda como base si alguna vez hace falta.

**`SpreadSheet.tsx` tiene 7305 líneas y el evaluador está entretejido** → Se acota el alcance a los 6 usos de `Function()`, las 26 pasadas de `replace()` y `useDepGraph.ts`. La interfaz, la edición y la persistencia no se tocan. Si la separación resulta más profunda de lo previsto, el paso 7 se puede diferir sin bloquear los pasos 1–6, que ya entregan la administración completa.

## Open Questions

- **Recálculo automático o manual.** El diseño asume que un administrador lanza el recálculo desde el panel. Queda abierto si publicar una versión debería encolarlo automáticamente. Se prefiere manual al inicio: la primera vez que este mecanismo escriba sobre 37 sub-diseños conviene que sea con alguien mirando.
- **Retención del registro de recálculos.** Cuánto tiempo conservar el detalle de celdas modificadas. Sin política definida crece sin límite; con 25 diseños no es urgente.
- **Qué hacer con los códigos duplicados heredados.** El sistema los señala, pero la decisión de negocio — cuál `CUBIC` sobrevive y qué pasa con los diseños que usan la otra — es del propietario del producto.
- **`sub_design_function`.** La tabla existe y está vacía. El plan es retirarla; falta confirmar que no hay ningún consumidor fuera de los cuatro repositorios revisados.
