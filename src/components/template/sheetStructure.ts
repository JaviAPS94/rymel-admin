/**
 * Cambios de estructura de una hoja, como funciones puras.
 *
 * Los usan la barra de formato y el menú contextual. Una sola implementación
 * es lo que garantiza que las dos entradas produzcan el mismo documento.
 */

import type { SheetStyles } from "@rymel/design-template";
import { refOf, type Rect } from "@hooks/useGridSelection";
import { isInsideRange } from "./grid/range";

export const mergeRect = (styles: SheetStyles, rect: Rect): SheetStyles => ({
  ...styles,
  mergedCells: [
    ...styles.mergedCells,
    {
      startCell: refOf(rect.top, rect.left),
      endCell: refOf(rect.bottom, rect.right),
      rowSpan: rect.bottom - rect.top + 1,
      colSpan: rect.right - rect.left + 1,
    },
  ],
});

/** Separa la combinación que contiene la celda, si la hay. */
export const unmergeAt = (styles: SheetStyles, ref: string): SheetStyles => ({
  ...styles,
  mergedCells: styles.mergedCells.filter(
    (merged) => !isInsideRange(ref, merged.startCell, merged.endCell),
  ),
});

/** Inmoviliza las filas por encima y las columnas a la izquierda de la celda. */
export const freezeAt = (styles: SheetStyles, row: number, column: number): SheetStyles => ({
  ...styles,
  freezeRow: row,
  freezeColumn: column,
});

export const unfreeze = (styles: SheetStyles, kind: "rows" | "columns" | "both"): SheetStyles => ({
  ...styles,
  freezeRow: kind === "columns" ? styles.freezeRow : 0,
  freezeColumn: kind === "rows" ? styles.freezeColumn : 0,
});

export const hideIndices = (
  styles: SheetStyles,
  kind: "rows" | "columns",
  indices: readonly number[],
): SheetStyles => {
  const key = kind === "rows" ? "hiddenRows" : "hiddenColumns";
  return { ...styles, [key]: [...new Set([...styles[key], ...indices])].sort((a, b) => a - b) };
};

export const showAll = (styles: SheetStyles, kind: "rows" | "columns"): SheetStyles => ({
  ...styles,
  [kind === "rows" ? "hiddenRows" : "hiddenColumns"]: [],
});
