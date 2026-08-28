# El editor: composición y rendimiento

## 1. Por qué son quince archivos y no uno

El diseñador de `project-front` es un solo componente de **6305 líneas**, y esa
es literalmente la razón por la que no se pudo reutilizar aquí: está
entrelazado con RTK Query, el elemento normalizado, el panel de código de
diseño y el resumen de BOM, y no hay forma de tomar la rejilla sin llevarse
todo lo demás.

El editor de plantillas se compone en piezas que se pueden leer por separado:

| Archivo | Líneas | Qué resuelve |
|---|---|---|
| `pages/TemplateEditorPage.tsx` | ~530 | composición, teclado, publicación |
| `grid/TemplateGrid.tsx` | ~400 | rejilla virtualizada, encabezados, redimensionado |
| `grid/GridCell.tsx` | ~200 | una celda, memoizada |
| `RegionsPanel.tsx` | ~380 | rangos, zonas y catálogos |
| `CellBindingsPanel.tsx` | ~250 | `elementKey`, opciones, `goTo`, enlace a ítem |
| `FormatToolbar.tsx` | ~260 | formato y estructura sobre la selección |
| `SheetTabs.tsx` | ~210 | hojas: crear, renombrar, reordenar, eliminar |
| `PreviewPanel.tsx` | ~170 | vista previa con valores de prueba |
| `DiagnosticsPanel.tsx` | ~130 | problemas navegables |
| `FormulaBar.tsx` | ~70 | contenido de la celda activa |
| `hooks/useTemplateDocument.ts` | ~540 | documento, grafo, recálculo, historial |
| `hooks/useGridSelection.ts` | ~130 | selección |
| `hooks/useTemplateSave.ts` | ~110 | guardado selectivo y conflicto |
| `hooks/useTemplatePreview.ts` | ~140 | evaluación por lotes |
| `hooks/useTemplateValidation.ts` | ~120 | validación continua sin red |

Ninguna lógica de cálculo, serialización o validación vive en la capa de
interfaz: está en `@rymel/formula-engine` y `@rymel/design-template`. Es la
condición que la decisión 1 del diseño puso para aceptar tener dos rejillas en
el producto.

## 2. Rendimiento a la escala real

Medido sobre un libro con la forma y el tamaño de la plantilla real —2039
celdas, `Tablas` hasta la fila 232, `Resumen` hasta la columna `AH`, con las
dos `BUSCARV` de rango calificado en ambos extremos—:

| | |
|---|---|
| Construir el grafo completo | **2.8 ms** |
| Calcular el libro entero al abrirlo | **8.3 ms** |
| Recalcular una edición suelta | **0.81 ms** |
| Recalcular una edición dentro de un rango consultado | **1.09 ms** |

La última es la que importa: `Tablas!C100` cae dentro de
`Tablas!B45:Tablas!C156`, que una fórmula de `Resumen` consulta. El recálculo
la arrastra —que es lo que se corrigió en el motor— y aun así cuesta un
milisegundo.

Los umbrales de `useTemplateDocument.perf.spec.ts` están puestos muy por
encima (250 ms, 1 s, 50 ms) a propósito: no persiguen un número bonito, sino
avisar el día en que una edición pase de milisegundos a segundos.

## 3. Lo que hace que se pueda teclear

- **Ventana virtual.** Se dibujan las celdas visibles más un margen, no las
  12 500. El diseñador de project-front las dibuja todas y ya lo nota; un
  editor es peor caso, porque se escribe celda a celda durante horas.
- **Celda memoizada.** Escribir en una celda no vuelve a dibujar las demás.
- **Recálculo por celdas sucias.** Una edición recalcula su celda y sus
  dependientes, no el libro.
