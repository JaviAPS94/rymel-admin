import { useCallback, useMemo, useRef, useState } from "react";
import {
  buildGraph,
  getRecalcOrder,
  updateCellInGraph,
  evaluateFormula,
  FORMULA_CIRCULAR,
  type DepGraph,
  type CellValueMap,
  type FormulaValue,
} from "@/lib/formula";
import { COLUMNS, getColumnByLetter } from "@components/phantom-item/columns";
import type { PhantomItemDetail } from "@/types/phantom-item.types";

/** One grid cell: the raw content the user typed (formula or literal), and its evaluated result. */
export interface GridCell {
  formula: string;
  computed: FormulaValue;
}

export type CellGrid = Record<string, GridCell>;

/**
 * Header-scope columns (A–E, L plain fields, plus F/H/J's derivation
 * formulas). The phantom item has exactly one header, even though the
 * template repeats it visually on every row — editing any of these columns
 * on any row must update every row alike (tasks.md 10.7).
 */
const HEADER_LETTERS = COLUMNS.filter((c) => c.scope === "header").map((c) => c.letter);

const cellRef = (letter: string, row: number): string => `${letter}${row}`;

const rawValueToText = (value: string | number | undefined): string =>
  value === undefined || value === null ? "" : String(value);

export const buildValueMap = (cells: CellGrid): CellValueMap => {
  const map: CellValueMap = {};
  Object.entries(cells).forEach(([ref, cell]) => {
    map[ref] = cell.computed;
  });
  return map;
};

/** Fully recalculates every formula cell in dependency order. */
export const recalculateAll = (graph: DepGraph, cells: CellGrid): CellGrid =>
  recalculateCells(graph, Object.keys(cells), cells);

/** Recalculates `dirtyRefs` and everything that depends on them, in order. */
export const recalculateCells = (
  graph: DepGraph,
  dirtyRefs: string[],
  cells: CellGrid,
): CellGrid => {
  const { order, circular } = getRecalcOrder(graph, dirtyRefs);
  const updated = { ...cells };
  const valueMap = buildValueMap(updated);

  // `getRecalcOrder` only returns cells that have a formula (see
  // depGraph.ts): a plain literal dirty cell — e.g. typing "1UEF" into a
  // header field — has no formula, so it never appears in `order`. Its
  // `computed` still needs to be (re)populated directly from its own
  // content, both for display and so other cells' formulas can read it.
  const orderedSet = new Set(order);
  dirtyRefs.forEach((ref) => {
    if (orderedSet.has(ref) || !updated[ref]) return;
    const result = evaluateFormula(updated[ref].formula, valueMap);
    updated[ref] = { ...updated[ref], computed: result };
    valueMap[ref] = result;
  });

  order.forEach((ref) => {
    if (!updated[ref]) return;
    const result = evaluateFormula(updated[ref].formula, valueMap);
    updated[ref] = { ...updated[ref], computed: result };
    valueMap[ref] = result;
  });

  circular.forEach((ref) => {
    if (!updated[ref]) return;
    updated[ref] = { ...updated[ref], computed: FORMULA_CIRCULAR };
    valueMap[ref] = FORMULA_CIRCULAR;
  });

  return updated;
};

/** One empty row (header + component blank), with derived columns' default formulas preinserted. */
export const buildEmptyCells = (): CellGrid => {
  const cells: CellGrid = {};
  COLUMNS.forEach((column) => {
    cells[cellRef(column.letter, 1)] = {
      formula: column.defaultFormula ? column.defaultFormula(1) : "",
      computed: "",
    };
  });
  return cells;
};

/** Rebuilds a `CellGrid` from a persisted phantom item's header + components. */
export const buildCellsFromDetail = (detail: PhantomItemDetail): CellGrid => {
  const cells: CellGrid = {};
  const rowCount = Math.max(detail.components.length, 1);

  for (let row = 1; row <= rowCount; row++) {
    const component = detail.components[row - 1];

    COLUMNS.forEach((column) => {
      const ref = cellRef(column.letter, row);
      let formula = "";

      if (column.scope === "header") {
        const override = detail.formulaOverrides?.[column.field];
        if (override) {
          formula = override;
        } else if (column.defaultFormula) {
          formula = column.defaultFormula(row);
        } else {
          formula = rawValueToText(
            (detail as unknown as Record<string, string | number>)[column.field],
          );
        }
      } else if (column.scope === "derived") {
        formula = detail.formulaOverrides?.[column.field] ?? column.defaultFormula?.(row) ?? "";
      } else if (component) {
        const override = component.formulaOverrides?.[column.field];
        formula =
          override ??
          rawValueToText(
            (component as unknown as Record<string, string | number>)[column.field],
          );
      }

      cells[ref] = { formula, computed: "" };
    });
  }

  return cells;
};

export interface UsePhantomItemGridResult {
  rowCount: number;
  cells: CellGrid;
  referenceLengthLimit: number;
  setReferenceLengthLimit: (limit: number) => void;
  isDirty: boolean;
  markSaved: () => void;
  getCell: (letter: string, row: number) => GridCell;
  setCellValue: (letter: string, row: number, rawValue: string) => void;
  restoreDefaultFormula: (letter: string, row: number) => void;
  hasOwnFormula: (letter: string, row: number) => boolean;
  addRow: () => void;
  removeRow: (row: number) => void;
  isOverLimit: (letter: string, row: number) => boolean;
  isCircular: (letter: string, row: number) => boolean;
}

/**
 * Owns the phantom item grid's cell state: a flat `CellGrid` addressed with
 * `A1`..`T{n}` notation, exactly like the exported `.xlsx` — header columns
 * (A–E, L) are stored per row like every other column, but writing to one
 * propagates to every row, since the template shows one shared header
 * repeated on each line (see design.md, decision 4 and tasks.md 10.7).
 */
export const usePhantomItemGrid = (
  detail?: PhantomItemDetail,
): UsePhantomItemGridResult => {
  const graphRef = useRef<DepGraph>(buildGraph({}));

  const [cells, setCells] = useState<CellGrid>(() => {
    const initial = detail ? buildCellsFromDetail(detail) : buildEmptyCells();
    graphRef.current = buildGraph(initial);
    return recalculateAll(graphRef.current, initial);
  });

  const [referenceLengthLimit, setReferenceLengthLimitState] = useState(
    detail?.referenceLengthLimit ?? 40,
  );

  const [isDirty, setIsDirty] = useState(false);
  const setReferenceLengthLimit = useCallback((limit: number) => {
    setIsDirty(true);
    setReferenceLengthLimitState(limit);
  }, []);
  const markSaved = useCallback(() => setIsDirty(false), []);

  const rowCount = useMemo(
    () =>
      Math.max(
        ...Object.keys(cells).map((ref) => Number.parseInt(ref.slice(1), 10)),
        1,
      ),
    [cells],
  );

  const getCell = useCallback(
    (letter: string, row: number): GridCell =>
      cells[cellRef(letter, row)] ?? { formula: "", computed: "" },
    [cells],
  );

  const hasOwnFormula = useCallback(
    (letter: string, row: number): boolean => {
      const column = getColumnByLetter(letter);
      if (!column?.defaultFormula) return false;
      return getCell(letter, row).formula !== column.defaultFormula(row);
    },
    [getCell],
  );

  const setCellValue = useCallback((letter: string, row: number, rawValue: string) => {
    setIsDirty(true);
    setCells((prev) => {
      const column = getColumnByLetter(letter);
      if (!column) return prev;

      const next: CellGrid = { ...prev };
      const changedRefs: string[] = [];
      const isSharedHeader = HEADER_LETTERS.includes(letter);

      if (isSharedHeader) {
        // Editing a header cell on any row updates every row's header column.
        const currentRowCount = Math.max(
          ...Object.keys(prev).map((ref) => Number.parseInt(ref.slice(1), 10)),
          1,
        );
        for (let r = 1; r <= currentRowCount; r++) {
          const ref = cellRef(letter, r);
          next[ref] = { ...next[ref], formula: rawValue };
          updateCellInGraph(graphRef.current, ref, rawValue);
          changedRefs.push(ref);
        }
      } else {
        const ref = cellRef(letter, row);
        next[ref] = { ...next[ref], formula: rawValue };
        updateCellInGraph(graphRef.current, ref, rawValue);
        changedRefs.push(ref);
      }

      return recalculateCells(graphRef.current, changedRefs, next);
    });
  }, []);

  const restoreDefaultFormula = useCallback(
    (letter: string, row: number) => {
      const column = getColumnByLetter(letter);
      if (!column?.defaultFormula) return;
      setCellValue(letter, row, column.defaultFormula(row));
    },
    [setCellValue],
  );

  const addRow = useCallback(() => {
    setIsDirty(true);
    setCells((prev) => {
      const currentRowCount = Math.max(
        ...Object.keys(prev).map((ref) => Number.parseInt(ref.slice(1), 10)),
        1,
      );
      const newRow = currentRowCount + 1;
      const next: CellGrid = { ...prev };
      const changedRefs: string[] = [];

      COLUMNS.forEach((column) => {
        const ref = cellRef(column.letter, newRow);
        const formula = HEADER_LETTERS.includes(column.letter)
          ? (prev[cellRef(column.letter, 1)]?.formula ?? "")
          : (column.defaultFormula?.(newRow) ?? "");
        next[ref] = { formula, computed: "" };
        updateCellInGraph(graphRef.current, ref, formula);
        changedRefs.push(ref);
      });

      return recalculateCells(graphRef.current, changedRefs, next);
    });
  }, []);

  const removeRow = useCallback((row: number) => {
    setIsDirty(true);
    setCells((prev) => {
      const currentRowCount = Math.max(
        ...Object.keys(prev).map((ref) => Number.parseInt(ref.slice(1), 10)),
        1,
      );
      if (currentRowCount <= 1) return prev;

      const next: CellGrid = {};
      let targetRow = 1;

      for (let r = 1; r <= currentRowCount; r++) {
        if (r === row) continue;

        COLUMNS.forEach((column) => {
          const source = prev[cellRef(column.letter, r)];
          const targetRefKey = cellRef(column.letter, targetRow);
          const isSharedHeader = HEADER_LETTERS.includes(column.letter);

          let formula: string;
          if (isSharedHeader) {
            // Shared across every row by invariant; read from the old
            // row 1 rather than shifting `source`, which may itself be
            // the row being removed.
            formula = prev[cellRef(column.letter, 1)]?.formula ?? "";
          } else if (column.defaultFormula && source?.formula === column.defaultFormula(r)) {
            // Row-relative default formulas (the length/quantity columns)
            // are regenerated for the new row position rather than shifted
            // verbatim, since shifting rows changes what "this row" means.
            formula = column.defaultFormula(targetRow);
          } else {
            formula = source?.formula ?? "";
          }

          next[targetRefKey] = { formula, computed: "" };
        });

        targetRow += 1;
      }

      graphRef.current = buildGraph(next);
      return recalculateAll(graphRef.current, next);
    });
  }, []);

  const isOverLimit = useCallback(
    (letter: string, row: number): boolean => {
      const column = getColumnByLetter(letter);
      if (column?.kind !== "length") return false;

      const cell = getCell(letter, row);
      const value = typeof cell.computed === "number" ? cell.computed : Number(cell.computed);
      if (!Number.isFinite(value)) return false;

      const limit = column.limit ?? referenceLengthLimit;
      return value > limit;
    },
    [getCell, referenceLengthLimit],
  );

  const isCircular = useCallback(
    (letter: string, row: number): boolean => getCell(letter, row).computed === FORMULA_CIRCULAR,
    [getCell],
  );

  return {
    rowCount,
    cells,
    referenceLengthLimit,
    setReferenceLengthLimit,
    isDirty,
    markSaved,
    getCell,
    setCellValue,
    restoreDefaultFormula,
    hasOwnFormula,
    addRow,
    removeRow,
    isOverLimit,
    isCircular,
  };
};
