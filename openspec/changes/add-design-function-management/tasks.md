> Los grupos siguen el orden de despliegue de `design.md` (decisión 7). Cada grupo indica el repositorio en el que se trabaja: los artefactos de planificación viven en `project-admin`, pero la implementación se reparte entre cinco repositorios.

## 1. Paquete compartido: extracción (repo nuevo `rymel-formula-engine`)

- [x] 1.1 Crear el repositorio `JaviAPS94/rymel-formula-engine` con TypeScript, Vitest y build dual ESM/CJS, sin dependencias de runtime
- [x] 1.2 Mover `cellRef.ts`, `depGraph.ts`, `evaluate.ts`, `functions.ts` y sus specs desde `project-admin/src/lib/formula/`, sin cambios de comportamiento
- [x] 1.3 Definir la superficie pública en `index.ts` y los tipos exportados (`CellValueMap`, `FormulaValue`, valores de error)
- [x] 1.4 Añadir al pipeline una verificación que falle si se importa React, un módulo de Node, una API de navegador o cualquier dependencia de runtime
- [x] 1.5 Verificar que las pruebas migradas pasan y que el paquete se resuelve tanto desde Vite como desde Node
- [x] 1.6 Publicar el tag `v1.0.0`

## 2. Paquete compartido: capacidades nuevas

- [x] 2.1 Soportar referencias entre hojas (`Hoja1!A1`, `'Hoja 1'!A1`) en el tokenizador, el resolutor de referencias y el grafo de dependencias
- [x] 2.2 Definir el puerto `CustomFunctionResolver` que recibe un lote de invocaciones y devuelve un lote de resultados
- [x] 2.3 Reconocer los códigos de función personalizada como unidad léxica en el tokenizador, de modo que `COST` no capture dentro de `ASSOCIATE_COST`
- [x] 2.4 Implementar `evaluateSheet` con orden topológico y agrupación de invocaciones por nivel de dependencia
- [x] 2.5 Mapear argumentos posicionales a las variables declaradas y devolver error cuando la aridad no coincide, sin invocar al puerto
- [x] 2.6 Propagar los fallos del puerto como error de fórmula acotado al lote afectado
- [x] 2.7 Cubrir con pruebas: colisión por prefijo, código dentro de un literal de texto, funciones encadenadas, lote único para celdas independientes, ciclos y hoja inexistente
- [x] 2.8 Publicar el tag `v1.1.0`

## 3. project-admin: adopción del paquete

- [x] 3.1 Añadir la dependencia `@rymel/formula-engine` fijada al tag `v1.1.0`
- [x] 3.2 Redirigir los importadores del grid de ítems fantasma al paquete y eliminar `src/lib/formula/`
- [x] 3.3 Verificar que las pruebas del grid de fantasmas siguen pasando sin cambios de comportamiento

## 4. secure-function-engine-api

- [x] 4.1 Validar `ENCRYPTION_KEY` al arranque (presencia y 32 bytes) y abortar con un mensaje explícito si falla
- [x] 4.2 Reescribir la sustitución de constantes sobre el ámbito de evaluación de mathjs, eliminando el `replace` por subcadena
- [x] 4.3 Añadir pruebas de la sustitución: `CONST_1` frente a `CONST_10`, constante `c` frente a `cos(x)`, constante no usada y constante no numérica
- [x] 4.4 Implementar el guard de secreto compartido servicio-a-servicio con comparación en tiempo constante, tolerando su ausencia durante la ventana de transición
- [x] 4.5 Implementar `POST /function-engine/decrypt` protegido por el guard, con errores que no filtren detalles criptográficos
- [x] 4.6 Implementar `POST /function-engine/validate`: valida sintaxis y devuelve los símbolos usados, sin cifrar ni persistir
- [x] 4.7 Añadir auditoría de los descifrados atendidos y rechazados, sin registrar la expresión ni la clave
- [x] 4.8 Verificar que una expresión cifrada con la versión anterior sigue evaluándose sin re-cifrado
- [x] 4.9 Documentar `SFE_SERVICE_SECRET` en el README (el despliegue con la ventana abierta queda pendiente de ejecutarse)

## 5. project-back: modelo de datos y migración

- [x] 5.1 Crear la entidad `DesignFunctionVersion` (expresión cifrada, variables, constantes, número de versión, vigente, autor, fecha) y ajustar `DesignFunction` a solo identidad
- [x] 5.2 Escribir la migración que crea la tabla, traslada las 6 filas actuales a su versión 1 vigente y retira las columnas trasladadas
- [x] 5.3 Añadir a `sub_design` las columnas de estampado de versiones y marca de desactualización
- [x] 5.4 Añadir el índice de apoyo `IX_design_function_code_type`. **La restricción única en base queda diferida a propósito**: los datos actuales tienen `CUBIC` y `QUADRATIC` duplicados y un índice único no llegaría a crearse. La unicidad se aplica en el servicio (tarea 6.1); el índice único se añadirá cuando el propietario resuelva los cuatro conflictos heredados
- [x] 5.5 Retirar la tabla `sub_design_function`, previa verificación de que no tiene consumidores
- [x] 5.6 Escribir y probar la reversión de la migración
- [x] 5.7 Ejecutar la migración sobre la base real (con backup previo) y verificar que ninguna evaluación cambia de resultado
- [x] 5.8 Corregir la multiplicación implícita de las fórmulas 16 y 18, que dependían del defecto de sustitución por subcadena (`CONST_1x` → `CONST_1*x`). Equivalencia comprobada contra el motor real en 5 juegos de valores por fórmula; publicada como versión 2 conservando la versión 1

## 6. project-back: validación y servicio de fórmulas

- [x] 6.1 Implementar la validación del código: formato, unicidad por tipo y rechazo cuando un código es sufijo de otro
- [x] 6.2 Implementar la validación de variables: unicidad, no colisión con constantes y detección de cambios incompatibles de orden o de aridad
- [x] 6.3 Implementar la validación de constantes: formato del nombre, valor numérico finito y contraste contra los símbolos de la expresión
- [x] 6.4 Implementar el servicio de versiones: publicar una versión nueva, marcarla vigente y conservar inmutables las anteriores
- [x] 6.5 Implementar el cliente del SFE para descifrar y validar, con el secreto servicio-a-servicio y manejo del servicio no disponible
- [x] 6.6 Implementar la auditoría de accesos al texto plano, con usuario, fórmula, versión y marca de tiempo
- [x] 6.7 Adaptar `DesignFunctionService.calculateSingleFunction` para tomar la expresión y las constantes de la versión vigente (hecho en el grupo 5)

## 7. project-back: API de administración

- [x] 7.1 Listado paginado con filtros por tipo, búsqueda, subtipo y estado, sin exponer la expresión en ninguna forma
- [x] 7.2 Detalle de edición con la expresión en claro, restringido a rol ADMIN y auditado
- [x] 7.3 Alta de fórmula y publicación de versión nueva, con todas las validaciones del grupo 6
- [x] 7.4 Baja lógica con reporte previo de impacto
- [x] 7.5 Historial de versiones y restauración de una anterior como versión nueva
- [x] 7.6 Asignación y desasignación de fórmulas a subtipos, rechazando las que provoquen colisión de códigos
- [x] 7.7 Consulta de impacto: subtipos asignados, diseños que la usan y diseños desactualizados
- [x] 7.8 Endpoint de prueba de una expresión no publicada, sin persistir nada
- [x] 7.9 Verificar que `POST /design-functions/calculate` conserva su contrato y que `GET /design/subtypes/:id/with-functions` sigue sirviendo a project-front (hoy devuelve la expresión cifrada, igual que antes del cambio; se retira en la tarea 11.7)

## 8. project-back: obsolescencia y recálculo

- [x] 8.1 Estampar las versiones usadas al guardar un sub-diseño
- [x] 8.2 Marcar como desactualizados los sub-diseños afectados al publicar una versión, sin alterar sus valores
- [x] 8.3 Tratar como desactualizados los sub-diseños sin estampado
- [x] 8.4 Adoptar `@rymel/formula-engine` en project-back e inyectar el puerto de funciones personalizadas resuelto en proceso
- [x] 8.5 Implementar el recálculo por lotes: reevaluar celdas con fórmula, conservar las de entrada manual y actualizar el estampado (con modo simulación)
- [x] 8.6 Hacer el recálculo transaccional por sub-diseño, de modo que un fallo lo deje intacto y el lote continúe
- [x] 8.7 Registrar por celda el valor anterior y el nuevo, y las fórmulas que motivaron el recálculo
- [x] 8.8 Exponer el endpoint de recálculo y el de consulta del último recálculo de un sub-diseño
- [x] 8.9 Cerrar la ventana de transición del SFE exigiendo el secreto compartido (`SFE_SERVICE_SECRET` configurado en ambos `.env` locales; pendiente replicarlo en los despliegues)

## 9. project-admin: sección de fórmulas

- [x] 9.1 Definir los tipos en `types/designFunction.types.ts`
- [x] 9.2 Implementar `services/designFunctionService.ts` siguiendo el patrón de `designCodeRulesService`
- [x] 9.3 Implementar `hooks/useDesignFunctions.ts` con Tanstack Query y notificaciones, siguiendo `useDesignCodeRules`
- [x] 9.4 Crear `FormulasPage` con listado paginado, búsqueda, filtros, estado vacío y marca de códigos en conflicto
- [x] 9.5 Registrar la ruta protegida por rol ADMIN y la entrada en el menú de administración
- [x] 9.6 Construir el editor: expresión en claro con aviso de confidencialidad, y modo degradado cuando no puede recuperarse
- [x] 9.7 Construir el editor de variables como lista ordenada con la posición visible y la advertencia de contrato
- [x] 9.8 Construir el editor de constantes con validación de nombre y valor
- [x] 9.9 Contrastar los símbolos de la expresión contra lo declarado y bloquear el guardado ante símbolos no declarados
- [x] 9.10 Construir el probador con valores de prueba, sobre fórmula guardada y sobre expresión en edición
- [x] 9.11 Implementar el diálogo de confirmación de cambios incompatibles con el conteo de diseños afectados
- [x] 9.12 Implementar la baja con reporte de impacto y confirmación
- [x] 9.13 Implementar la gestión de asignación a subtipos
- [x] 9.14 Implementar la vista de historial de versiones con consulta y restauración
- [x] 9.15 Implementar el panel de diseños desactualizados con lanzamiento de recálculo, progreso y reporte de fallos

## 10. Verificación en sombra (puerta de corte)

- [x] 10.1 Escribir el script que reevalúa con el motor compartido todos los sub-diseños almacenados y los difunde contra el `computed` guardado
- [x] 10.2 Ejecutarlo sobre la base real y producir el reporte de celdas comparadas, coincidentes y divergentes
- [x] 10.3 Clasificar cada divergencia como defecto del motor o como valor previamente incorrecto
- [x] 10.4 Corregir en el paquete los defectos encontrados y volver a ejecutar hasta que no queden divergencias sin clasificar (v1.2.0: veinte funciones matemáticas ausentes; v1.2.1: llamadas sin argumentos rotas)
- [x] 10.6 Cubrir la aritmética con un contraste diferencial contra el evaluador anterior: la verificación en sombra no podía, porque las 104 celdas con fórmula de la base invocan todas una función personalizada
- [x] 10.5 Registrar el reporte final como evidencia de la puerta de corte

## 11. project-front: adopción del motor compartido

> Antes de sustituir nada se hizo un **inventario sistemático** de la sintaxis
> que acepta el evaluador anterior (`evidence/auditoria-de-sintaxis.md`): 46
> formas, 45 iguales, 1 divergencia deliberada, 0 huecos. Las cuatro primeras
> incompatibilidades del motor habían aparecido por accidente; el inventario
> destapó dos más que ese método no habría encontrado.

- [x] 11.0 **Condición de la puerta de corte**: `BUSCARV` y `COINCIDIR` implementadas en el motor (v1.3.0), literales `TRUE`/`FALSE` reconocidos (v1.3.1); contrastadas contra la implementación anterior con 0 divergencias
- [x] 11.1 Añadir la dependencia `@rymel/formula-engine` fijada al tag verificado en el grupo 10 (v1.3.1)
- [x] 11.2 Sustituir el evaluador de `SpreadSheet.tsx` por el motor, retirando los 6 usos de `Function()` y las 26 pasadas de `expression.replace()`
- [x] 11.3 Reemplazar `useDepGraph.ts` por el grafo de dependencias del paquete
- [x] 11.4 Inyectar el puerto de funciones personalizadas sobre `POST /design-functions/calculate`, aprovechando el lote por nivel en vez de la llamada por celda (88 celdas pasaron de 88 peticiones a 22)
- [x] 11.5 Verificar sobre diseños reales que los resultados coinciden con el reporte del grupo 10 (82/88 coinciden; las 6 divergencias son exactamente las ya clasificadas)
- [x] 11.6 Retirar `expression` de `DesignFunctionOutputDto` una vez que project-front deje de leerla para su biblioteca de funciones
- [x] 11.7 Confirmar que ninguna respuesta recibida por project-front contiene la expresión de una fórmula

## 12. project-front: aviso de valores recalculados

- [x] 12.1 Mostrar el aviso al abrir un diseño cuyos valores cambiaron por un recálculo, identificando las fórmulas responsables
- [x] 12.2 Implementar el detalle con las celdas afectadas, su valor anterior y el actual
- [x] 12.3 Implementar el descarte del aviso, persistente por usuario y por recálculo
- [x] 12.4 Mostrar el aviso de versión anterior para diseños desactualizados aún no recalculados
- [x] 12.5 Verificar que un recálculo posterior produce un aviso nuevo (el descarte va por identificador de recálculo)
- [x] 12.6 Cubrir el caso de una hoja **desactualizada y recalculada a la vez**: manda el estado actual, sin perder el detalle del último recálculo

## 13. Cierre

- [x] 13.1 Ejecutar el recálculo de los diseños desactualizados con supervisión y verificar el registro de cambios (2 recalculados, 19 sin cambios, 11 sin fórmulas, 4 sin subtipo)
- [x] 13.2 Documentar en cada repositorio las variables de entorno y la dependencia del paquete compartido
- [x] 13.3 Registrar los códigos duplicados heredados como decisión pendiente del propietario del producto (`evidence/decisiones-pendientes.md`, con tres decisiones más)
- [x] 13.4 Verificar de punta a punta: crear una fórmula, asignarla, usarla en un diseño, publicar una versión nueva, comprobar la marca de desactualización, recalcular y ver el aviso en project-front
