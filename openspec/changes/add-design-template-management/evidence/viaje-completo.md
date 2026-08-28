# El viaje completo: del editor al diseñador

## 1. Ida y vuelta con todo lo que una plantilla puede declarar

`roundtrip-template.ts` (project-back) escribe una plantilla como lo haría el
editor —dos hojas, fórmula entre hojas con `;` y rango calificado en ambos
extremos, formato, celda combinada, fila oculta, las tres clases de región,
enlace a ítem, clave de elemento, lista desplegable, navegación y una directiva
de gráfico—, la publica, y la lee **por la misma ruta que la biblioteca del
diseñador**: `TemplateService.findBySubTypeId` + `TemplateResponseDto`.

`check-roundtrip.ts` (project-front) la carga con el contrato. **31
comprobaciones entre los dos, todas pasan.** Las que importan:

- La **fila oculta de la plantilla** llega en el campo canónico *y* en el
  espejo que project-front todavía lee. Era el defecto original.
- El **estado de sesión del diseñador** no viaja en la plantilla.
- La **directiva de gráfico** llega sin el `=`, lista para dibujar sin depender
  de ningún valor calculado.
- **Ninguna celda trae valor calculado.**
- Formato, combinación, inmovilización, ancho de columna, rango con nombre,
  tabla de catálogo, zona de semielaborado, enlace a ítem, clave de elemento,
  opciones y navegación: todo llega.

La plantilla de prueba se borra al terminar y se comprueba que la base queda
como estaba.

## 2. Los números coinciden en los dos lados

No es una obviedad: el editor calcula celda a celda en orden de dependencias
con `evaluateCell`, y el diseñador resuelve el libro entero con
`evaluateSheet`. Son dos entradas distintas al mismo motor.

```
ok  la BUSCARV entre hojas da 9
ok  la fórmula que depende de ella da 18
ok  el diseñador y el editor calculan lo mismo en todas las celdas
```

Si no coincidieran, lo que el autor ve al publicar no sería lo que el diseñador
obtiene, que es el fallo que este cambio existe para hacer imposible.

## 3. Sin regresión en la plantilla real

`dump-library-template.ts` vuelca `TEMPLATE_1F_0001` ya normalizada tal como la
sirve la biblioteca (440 + 1598 celdas), y `check-template-load.ts` la carga:
mismos resultados que antes de sanear. `G17` en 20, el dibujo de `K73` intacto,
`I39` exacto, y `C6` como única celda en error.

## 4. El corte de la biblioteca

`TemplateService.findBySubTypeId` filtra por `PUBLISHED`. Verificado en ambos
sentidos:

| | |
|---|---|
| Por omisión | `TEMPLATE_1F_0001` se sirve; `TEMPLATE_3F_0001` no («estado: DRAFT») |
| `TEMPLATE_LIBRARY_PUBLISHED_ONLY=false` | vuelve a servirse, con un aviso en el registro |

Es el único paso del cambio que altera lo que ve un diseñador, y por eso va al
final y con marcha atrás: si algo sale mal se apaga con una variable de
entorno, sin desplegar nada.

## 5. Lo que el diseñador ve cuando no hay plantillas

El mensaje decía «No hay plantillas disponibles — ¡Crea tu primera plantilla!».
Un diseñador no puede crear plantillas: quien las escribe y publica es el
administrador. Ahora dice que no hay **publicadas** para ese subtipo, que puede
haber alguna en preparación, y de dónde salen.

Importa hoy: el subtipo 2 se ha quedado sin plantillas publicadas, porque sus
dos plantillas están a medio hacer y pasaron a borrador.
