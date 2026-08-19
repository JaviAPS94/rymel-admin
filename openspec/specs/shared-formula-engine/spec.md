# shared-formula-engine

## Purpose

El motor de fórmulas compartido: el componente que analiza y evalúa las fórmulas de las hojas de cálculo del sistema.

Existe como paquete propio porque los tres consumidores —project-admin, project-front y project-back— necesitan que la misma fórmula dé exactamente el mismo resultado, tanto en el navegador como en el servidor. Antes cada uno tenía su propio evaluador, y el de project-front traducía la fórmula a JavaScript y la ejecutaba, lo que era ejecución de código arbitrario sobre un `.xlsx` subido por cualquiera.

## Requirements

### Requirement: Paquete independiente y reutilizable

El motor de fórmulas SHALL distribuirse como el paquete `@rymel/formula-engine`, en su propio repositorio, consumido como dependencia por project-admin, project-front y project-back. Ningún consumidor SHALL mantener una copia propia del código de evaluación.

El paquete SHALL declarar cero dependencias de runtime, y SHALL NOT importar React, ni módulos propios de Node (`fs`, `crypto`, `path`), ni APIs exclusivas del navegador (`window`, `document`, `localStorage`). Esta restricción es la que garantiza que el mismo código produzca el mismo resultado en el navegador y en el servidor.

#### Scenario: El paquete se instala en un consumidor de navegador y uno de servidor

- **WHEN** se instala `@rymel/formula-engine` en project-front (Vite/navegador) y en project-back (NestJS/Node)
- **THEN** ambos resuelven el paquete sin `polyfills` ni configuración de bundler adicional
- **AND** el build de cada consumidor pasa sin errores de módulos no resueltos

#### Scenario: Se intenta introducir una dependencia de entorno

- **WHEN** un cambio en el paquete importa `fs`, `window` o una librería externa de runtime
- **THEN** el pipeline del paquete falla la verificación de dependencias
- **AND** el cambio no puede publicarse

#### Scenario: project-admin deja de tener código de evaluación propio

- **WHEN** se completa la migración
- **THEN** `project-admin/src/lib/formula/` ya no existe
- **AND** el grid de ítems fantasma importa desde `@rymel/formula-engine`
- **AND** el comportamiento observable del grid no cambia

### Requirement: Distribución con versiones inmutables

El paquete SHALL versionarse con SemVer y SHALL consumirse fijado a un tag inmutable de git (`github:JaviAPS94/rymel-formula-engine#vX.Y.Z`). Los consumidores SHALL NOT depender de una rama móvil como `main`.

Todo cambio en la semántica de evaluación de una fórmula ya válida SHALL tratarse como cambio mayor, aunque no altere la firma de las funciones públicas: para este paquete, el resultado numérico es parte del contrato.

#### Scenario: Un consumidor fija su versión

- **WHEN** project-front declara la dependencia
- **THEN** la referencia apunta a un tag de versión concreto
- **AND** una publicación posterior del paquete no altera la instalación de project-front hasta que se actualice el tag deliberadamente

#### Scenario: Cambia el resultado de una fórmula ya soportada

- **WHEN** una modificación hace que `=1/3` redondee distinto que en la versión anterior
- **THEN** la publicación se numera como versión mayor
- **AND** las notas de la versión declaran explícitamente la divergencia de resultados

### Requirement: Evaluación determinista y sin ejecución de código

El motor SHALL evaluar fórmulas mediante su propio analizador (tokenización, conversión a notación polaca inversa y evaluación sobre pila). El motor SHALL NOT usar `eval`, `new Function`, `Function()` ni ningún otro mecanismo que ejecute la fórmula como código del lenguaje anfitrión.

Dadas las mismas celdas de entrada y la misma resolución de funciones personalizadas, el motor SHALL producir exactamente el mismo resultado en navegador y en servidor.

#### Scenario: Una fórmula contiene código malicioso

- **WHEN** una celda contiene `=fetch("https://evil.example")` o `=constructor.constructor("...")()`
- **THEN** el motor devuelve un valor de error de fórmula
- **AND** no se ejecuta ninguna operación fuera de la evaluación aritmética

#### Scenario: El mismo insumo se evalúa en los dos entornos

- **WHEN** el mismo conjunto de celdas se evalúa con el motor en Node y en el navegador
- **THEN** todos los valores calculados son idénticos, incluida la representación de los errores

### Requirement: Referencias entre hojas

El motor SHALL resolver referencias a celdas de otra hoja con la notación `NombreHoja!A1`, incluyendo nombres de hoja con espacios mediante comillas simples (`'Hoja 1'!A1`). Las referencias entre hojas SHALL participar del grafo de dependencias igual que las locales.

#### Scenario: Una celda referencia otra hoja

- **WHEN** la celda `B2` de `Hoja2` contiene `='Template 1F'!A11 * 2`
- **AND** `'Template 1F'!A11` vale 5
- **THEN** `Hoja2!B2` se calcula como 10

#### Scenario: Cambia la celda referenciada en otra hoja

- **WHEN** cambia el valor de `'Template 1F'!A11`
- **THEN** el motor recalcula `Hoja2!B2` en el mismo pase
- **AND** la referencia entre hojas aparece como precedente de `Hoja2!B2`

#### Scenario: La hoja referenciada no existe

- **WHEN** una fórmula referencia `NoExiste!A1`
- **THEN** el motor devuelve un error de fórmula para esa celda
- **AND** no interrumpe el cálculo de las celdas restantes

### Requirement: Funciones personalizadas por puerto inyectable

El motor SHALL resolver las funciones personalizadas (las fórmulas de diseño, invocadas como `=CUBIC(A1, B2)`) a través de un puerto inyectado por el consumidor, y SHALL NOT conocer el transporte, la autenticación ni la ubicación del servicio que las evalúa.

El puerto SHALL recibir un lote de invocaciones y devolver un lote de resultados. El motor SHALL NOT emitir una invocación al puerto por cada celda de forma independiente.

Los argumentos posicionales SHALL asociarse a las variables declaradas de la función respetando su orden. Si el número de argumentos no coincide con el de variables declaradas, la celda SHALL resultar en error sin invocar al puerto.

#### Scenario: El consumidor inyecta su propia resolución

- **WHEN** project-front inyecta un puerto que llama a la API por HTTP y project-back inyecta uno que llama al servicio internamente
- **THEN** el mismo motor evalúa `=CUBIC(A1, B2)` en ambos
- **AND** el núcleo del motor no contiene ninguna referencia a HTTP ni a una URL

#### Scenario: Faltan argumentos

- **WHEN** una función declara las variables `x,c,d` y la celda contiene `=CUBIC(A1)`
- **THEN** la celda resulta en error de argumentos
- **AND** no se invoca al puerto de resolución

### Requirement: Agrupación de invocaciones por nivel de dependencia

El motor SHALL calcular las celdas en orden topológico y SHALL agrupar en una sola invocación al puerto todas las funciones personalizadas de un mismo nivel de dependencia. El número de invocaciones al puerto SHALL depender de la profundidad del grafo de dependencias, no de la cantidad de celdas con función personalizada.

#### Scenario: Muchas celdas independientes con función personalizada

- **WHEN** una hoja tiene 40 celdas con `=QUADRATIC(...)` y ninguna depende de otra
- **THEN** el motor realiza exactamente una invocación al puerto con las 40 evaluaciones
- **AND** los 40 resultados se asignan a sus celdas correspondientes

#### Scenario: Funciones personalizadas encadenadas

- **WHEN** `B1` contiene `=QUADRATIC(A1)` y `C1` contiene `=CUBIC(B1, A2)`
- **THEN** el motor invoca al puerto una vez para el nivel de `B1` y otra para el de `C1`
- **AND** `C1` recibe como argumento el valor ya resuelto de `B1`

#### Scenario: El puerto falla

- **WHEN** la invocación al puerto devuelve un error o expira
- **THEN** todas las celdas de ese lote resultan en error de fórmula
- **AND** las celdas que no dependen de ese lote conservan su valor calculado

### Requirement: Resolución de funciones personalizadas sin colisión por prefijo

Al identificar la invocación de una función personalizada dentro de una fórmula, el motor SHALL reconocer el nombre completo del código como una unidad léxica. Un código que sea sufijo de otro SHALL NOT capturar la invocación del más largo.

#### Scenario: Códigos donde uno es sufijo del otro

- **WHEN** existen las funciones con código `COST` y `ASSOCIATE_COST`, ambas disponibles en la misma hoja
- **AND** una celda contiene `=ASSOCIATE_COST(A1, B2)`
- **THEN** el motor resuelve la función `ASSOCIATE_COST`
- **AND** no invoca a `COST`

#### Scenario: El código aparece dentro de un texto

- **WHEN** una celda contiene `="El COST(total) es:" & B1`
- **THEN** el motor trata `COST(total)` como parte del literal de texto
- **AND** no lo interpreta como invocación de función

### Requirement: Detección de referencias circulares

El motor SHALL detectar ciclos en el grafo de dependencias y SHALL marcar las celdas involucradas con un valor de error de circularidad, sin entrar en recursión infinita ni agotar la pila.

#### Scenario: Ciclo directo entre dos celdas

- **WHEN** `A1` contiene `=B1+1` y `B1` contiene `=A1+1`
- **THEN** ambas celdas quedan marcadas como referencia circular
- **AND** el resto de la hoja se calcula normalmente

### Requirement: Paridad de funciones incorporadas con los consumidores actuales

El motor SHALL soportar las funciones incorporadas ya en uso por los consumidores, con sus nombres en español y en inglés: suma, promedio, mínimo, máximo, conteo, condicional, redondeo, largo, concatenación e izquierda/derecha.

El comportamiento de cada función incorporada SHALL estar cubierto por pruebas automatizadas en el paquete.

#### Scenario: Nombres equivalentes en ambos idiomas

- **WHEN** una hoja usa `=SUMA(A1:A5)` y otra `=SUM(A1:A5)` sobre los mismos valores
- **THEN** ambas producen el mismo resultado

#### Scenario: Una función usada hoy en project-front

- **WHEN** se evalúa una fórmula tomada de un diseño existente que usa `AVERAGE` o `IF`
- **THEN** el resultado coincide con el que project-front produce hoy para esa misma fórmula
