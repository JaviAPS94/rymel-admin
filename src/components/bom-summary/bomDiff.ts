/**
 * Qué cambió el cliente en su lista de materiales: la ajustada frente a la
 * generada ahora desde la estructura.
 *
 * Las filas se emparejan por **semielaborado de la sección + Ítem (columna
 * B)**, no por posición. El cliente puede añadir y quitar filas, y por
 * posición todo lo que viene debajo de una fila nueva saldría como cambiado.
 * Cambiar el Ítem de una fila se ve como una quitada y una añadida: cambió de
 * material.
 */

import type { SavedCell } from "@/types/designBom.types";
import { COLUMNS, summaryRows } from "./summaryTable";

export type RowStatus = "same" | "added" | "removed" | "changed";

export interface DiffRow {
  /** Número de fila en su hoja, empezando en 1. */
  row: number;
  /** Lo que se ve en cada columna A–I. */
  values: string[];
  status: RowStatus;
  /** Columnas que cambiaron, solo en las filas `changed`. */
  changedColumns: Set<number>;
}

export interface BomDiff {
  adjusted: DiffRow[];
  generated: DiffRow[];
  counts: { added: number; removed: number; changed: number };
}

/** Lo que se ve en la celda: el resultado, si lo hay, o lo escrito. */
const shown = (cell: SavedCell | undefined): string => {
  if (!cell) return "";
  const computed = cell.computed;
  if (computed !== undefined && computed !== null && computed !== "") return String(computed).trim();
  return String(cell.value ?? "").trim();
};

const TOGGLES = new Set(["▶", "▼"]);

/** Las filas con contenido, cada una con su clave de emparejamiento. */
const keyedRows = (cells: Record<string, SavedCell>) => {
  let section = "";
  const seen = new Map<string, number>();
  const rows: { key: string; row: number; values: string[] }[] = [];
  for (const { row, cells: rowCells } of summaryRows(cells)) {
    const values = rowCells.map(shown);
    if (values.every((value) => value === "")) continue;
    const [a, b] = values;
    let base: string;
    if (a && !TOGGLES.has(a) && b.startsWith("Semielaborado")) {
      section = a;
      base = `section:${a}`;
    } else if (b === "Item") {
      base = `header:${section}`;
    } else if (TOGGLES.has(a)) {
      base = `child:${section}:${b}`;
    } else {
      base = `item:${section}:${b}`;
    }
    // El mismo ítem dos veces en una sección: se emparejan por orden
    const occurrence = seen.get(base) ?? 0;
    seen.set(base, occurrence + 1);
    rows.push({ key: `${base}#${occurrence}`, row, values });
  }
  return rows;
};

export const diffBom = (
  adjustedCells: Record<string, SavedCell>,
  generatedCells: Record<string, SavedCell>,
): BomDiff => {
  const adjustedRows = keyedRows(adjustedCells);
  const generatedRows = keyedRows(generatedCells);
  const generatedByKey = new Map(generatedRows.map((row) => [row.key, row]));
  const adjustedKeys = new Set(adjustedRows.map((row) => row.key));
  const counts = { added: 0, removed: 0, changed: 0 };
  const changedByKey = new Map<string, Set<number>>();

  const adjusted = adjustedRows.map(({ key, row, values }): DiffRow => {
    const other = generatedByKey.get(key);
    if (!other) {
      counts.added++;
      return { row, values, status: "added", changedColumns: new Set() };
    }
    const changedColumns = new Set(
      COLUMNS.map((_, index) => index).filter((index) => values[index] !== other.values[index]),
    );
    if (changedColumns.size === 0) return { row, values, status: "same", changedColumns };
    counts.changed++;
    changedByKey.set(key, changedColumns);
    return { row, values, status: "changed", changedColumns };
  });

  const generated = generatedRows.map(({ key, row, values }): DiffRow => {
    if (!adjustedKeys.has(key)) {
      counts.removed++;
      return { row, values, status: "removed", changedColumns: new Set() };
    }
    const changedColumns = changedByKey.get(key);
    return changedColumns
      ? { row, values, status: "changed", changedColumns }
      : { row, values, status: "same", changedColumns: new Set() };
  });

  return { adjusted, generated, counts };
};
