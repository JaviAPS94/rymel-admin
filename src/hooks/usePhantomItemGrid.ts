import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  buildGraph,
  getRecalcOrder,
  updateCellInGraph,
  evaluateFormula,
  FORMULA_CIRCULAR,
  type DepGraph,
  type CellValueMap,
  type FormulaValue,
} from "@rymel/formula-engine";
import { COLUMNS, type PhantomItemColumnDef } from "@components/phantom-item/columns";
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

/** «U12» → 12. Letters can be more than one once a process adds columns */
const rowOf = (ref: string): number => Number.parseInt(ref.replace(/^[A-Z]+/, ""), 10);

const rowCountOf = (cells: CellGrid): number =>
  Math.max(...Object.keys(cells).map(rowOf), 1);

/** Own columns of a process (`custom:…`) keep their values in `extraValues` */
const isOwnColumn = (column: PhantomItemColumnDef): boolean => column.field.startsWith("custom:");

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
export const buildEmptyCells = (columns: PhantomItemColumnDef[] = COLUMNS): CellGrid => {
  const cells: CellGrid = {};
  columns.forEach((column) => {
    cells[cellRef(column.letter, 1)] = {
      formula: column.defaultFormula ? column.defaultFormula(1) : "",
      computed: "",
    };
  });
  return cells;
};

/**
 * Traduce una fórmula de longitud escrita en el dialecto del servidor.
 *
 * El servidor mide campos por su nombre —`=LARGO(reference)`— porque calcula
 * sin rejilla; aquí se evalúan referencias de celda, y `reference` no es
 * ninguna. Sin traducir, una fórmula guardada así da `#ERROR` en la fila
 * cargada mientras las filas nuevas, que usan `=LARGO(F2)`, salen bien.
 *
 * El servidor ya no manda las suyas por defecto, así que esto solo alcanza a
 * lo que alguien haya guardado de verdad. Se traduce en vez de descartarlo
 * porque descartarlo sería perder en silencio una decisión del usuario.
 */
const translateFieldFormula = (formula: string, row: number): string =>
  formula.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/g, (name) => {
    if (name.toUpperCase() === "LARGO") return name;
    const column = COLUMNS.find((item) => item.field === name);
    return column ? `${column.letter}${row}` : name;
  });

/** Rebuilds a `CellGrid` from a persisted phantom item's header + components. */
export const buildCellsFromDetail = (
  detail: PhantomItemDetail,
  columns: PhantomItemColumnDef[] = COLUMNS,
): CellGrid => {
  const cells: CellGrid = {};
  const rowCount = Math.max(detail.components.length, 1);

  for (let row = 1; row <= rowCount; row++) {
    const component = detail.components[row - 1];

    columns.forEach((column) => {
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
        const override = detail.formulaOverrides?.[column.field];
        formula = override
          ? translateFieldFormula(override, row)
          : (column.defaultFormula?.(row) ?? "");
      } else if (component && isOwnColumn(column)) {
        formula = component.extraValues?.[column.field] ?? "";
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
  /** The catalog's A–T, under the process's headers, then its own line columns */
  columns: PhantomItemColumnDef[];
  getColumn: (letter: string) => PhantomItemColumnDef | undefined;
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
  columns: PhantomItemColumnDef[] = COLUMNS,
): UsePhantomItemGridResult => {
  const graphRef = useRef<DepGraph>(buildGraph({}));

  // The state updaters below run later than the render that scheduled them:
  // they read the columns from here, never from a stale closure.
  const columnsRef = useRef(columns);
  useLayoutEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const byLetter = useMemo(
    () => new Map(columns.map((column) => [column.letter, column])),
    [columns],
  );
  const getColumn = useCallback(
    (letter: string) => byLetter.get(letter.toUpperCase()),
    [byLetter],
  );

  const [cells, setCells] = useState<CellGrid>(() => {
    const initial = detail ? buildCellsFromDetail(detail, columns) : buildEmptyCells(columns);
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

  const rowCount = useMemo(() => rowCountOf(cells), [cells]);

  const getCell = useCallback(
    (letter: string, row: number): GridCell =>
      cells[cellRef(letter, row)] ?? { formula: "", computed: "" },
    [cells],
  );

  const hasOwnFormula = useCallback(
    (letter: string, row: number): boolean => {
      const column = getColumn(letter);
      if (!column?.defaultFormula) return false;
      return getCell(letter, row).formula !== column.defaultFormula(row);
    },
    [getCell, getColumn],
  );

  const setCellValue = useCallback((letter: string, row: number, rawValue: string) => {
    setIsDirty(true);
    setCells((prev) => {
      const column = columnsRef.current.find((item) => item.letter === letter);
      if (!column) return prev;

      const next: CellGrid = { ...prev };
      const changedRefs: string[] = [];
      const isSharedHeader = HEADER_LETTERS.includes(letter);

      if (isSharedHeader) {
        // Editing a header cell on any row updates every row's header column.
        const currentRowCount = rowCountOf(prev);
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
      const column = getColumn(letter);
      if (!column?.defaultFormula) return;
      setCellValue(letter, row, column.defaultFormula(row));
    },
    [setCellValue, getColumn],
  );

  const addRow = useCallback(() => {
    setIsDirty(true);
    setCells((prev) => {
      const newRow = rowCountOf(prev) + 1;
      const next: CellGrid = { ...prev };
      const changedRefs: string[] = [];

      columnsRef.current.forEach((column) => {
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
      const currentRowCount = rowCountOf(prev);
      if (currentRowCount <= 1) return prev;

      const next: CellGrid = {};
      let targetRow = 1;

      for (let r = 1; r <= currentRowCount; r++) {
        if (r === row) continue;

        columnsRef.current.forEach((column) => {
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
      const column = getColumn(letter);
      if (column?.kind !== "length") return false;

      const cell = getCell(letter, row);
      const value = typeof cell.computed === "number" ? cell.computed : Number(cell.computed);
      if (!Number.isFinite(value)) return false;

      const limit = column.limit ?? referenceLengthLimit;
      return value > limit;
    },
    [getCell, getColumn, referenceLengthLimit],
  );

  const isCircular = useCallback(
    (letter: string, row: number): boolean => getCell(letter, row).computed === FORMULA_CIRCULAR,
    [getCell],
  );

  return {
    columns,
    getColumn,
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
