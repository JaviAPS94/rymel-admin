import { useCallback, useMemo, useState } from "react";
import { columnIndexToLabel, parseCellRef } from "@rymel/formula-engine";
import { GRID_COLUMNS, GRID_ROWS } from "@rymel/design-template";

export interface CellPosition {
  row: number;
  column: number;
}

export interface Rect {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

export interface UseGridSelectionResult {
  anchor: CellPosition;
  focus: CellPosition;
  /** Rectángulo seleccionado, normalizado. */
  rect: Rect;
  /** Referencia de la celda activa: `AH73`. */
  activeRef: string;
  /** Todas las referencias de la selección. */
  selectedRefs: string[];
  isSelected: (row: number, column: number) => boolean;
  isActive: (row: number, column: number) => boolean;
  select: (row: number, column: number, extend?: boolean) => void;
  selectRange: (from: CellPosition, to: CellPosition) => void;
  /** Mueve la celda activa, colapsando la selección. */
  move: (rowDelta: number, columnDelta: number) => void;
  reset: () => void;
}

export const refOf = (row: number, column: number): string =>
  `${columnIndexToLabel(column)}${row + 1}`;

export const positionOf = (ref: string): CellPosition | null => {
  const parsed = parseCellRef(ref);
  return parsed === null ? null : { row: parsed.row, column: parsed.col };
};

const clamp = (value: number, max: number): number =>
  Math.max(0, Math.min(value, max - 1));

const rectOf = (a: CellPosition, b: CellPosition): Rect => ({
  top: Math.min(a.row, b.row),
  left: Math.min(a.column, b.column),
  bottom: Math.max(a.row, b.row),
  right: Math.max(a.column, b.column),
});

/**
 * Selección de la rejilla: una celda activa, un ancla y el rectángulo entre
 * ambas.
 *
 * Se guarda como dos posiciones y no como un conjunto de referencias porque
 * una selección de `A1:AX250` son 12 500 celdas, y mantener ese conjunto en
 * memoria para pintar un borde no tiene sentido. Las referencias se derivan
 * solo cuando alguien las pide, que es al aplicar formato.
 */
export const useGridSelection = (): UseGridSelectionResult => {
  const [anchor, setAnchor] = useState<CellPosition>({ row: 0, column: 0 });
  const [focus, setFocus] = useState<CellPosition>({ row: 0, column: 0 });

  const rect = useMemo(() => rectOf(anchor, focus), [anchor, focus]);

  const select = useCallback((row: number, column: number, extend = false) => {
    const position = { row: clamp(row, GRID_ROWS), column: clamp(column, GRID_COLUMNS) };
    setFocus(position);
    if (!extend) setAnchor(position);
  }, []);

  const selectRange = useCallback((from: CellPosition, to: CellPosition) => {
    setAnchor({ row: clamp(from.row, GRID_ROWS), column: clamp(from.column, GRID_COLUMNS) });
    setFocus({ row: clamp(to.row, GRID_ROWS), column: clamp(to.column, GRID_COLUMNS) });
  }, []);

  const move = useCallback((rowDelta: number, columnDelta: number) => {
    setFocus((current) => {
      const next = {
        row: clamp(current.row + rowDelta, GRID_ROWS),
        column: clamp(current.column + columnDelta, GRID_COLUMNS),
      };
      setAnchor(next);
      return next;
    });
  }, []);

  const selectedRefs = useMemo(() => {
    const refs: string[] = [];
    for (let row = rect.top; row <= rect.bottom; row++) {
      for (let column = rect.left; column <= rect.right; column++) {
        refs.push(refOf(row, column));
      }
    }
    return refs;
  }, [rect]);

  return {
    anchor,
    focus,
    rect,
    activeRef: refOf(focus.row, focus.column),
    selectedRefs,
    isSelected: useCallback(
      (row: number, column: number) =>
        row >= rect.top &&
        row <= rect.bottom &&
        column >= rect.left &&
        column <= rect.right,
      [rect],
    ),
    isActive: useCallback(
      (row: number, column: number) => row === focus.row && column === focus.column,
      [focus],
    ),
    select,
    selectRange,
    move,
    reset: useCallback(() => {
      setAnchor({ row: 0, column: 0 });
      setFocus({ row: 0, column: 0 });
    }, []),
  };
};
