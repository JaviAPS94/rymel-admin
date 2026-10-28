/**
 * Una hoja guardada de un diseño, en la forma de la rejilla del editor.
 *
 * El admin no recalcula nada: muestra lo que el diseñador calculó y guardó
 * (`computed`). Las fórmulas de diseño están cifradas y se evalúan en el
 * servidor, así que volver a evaluarlas aquí ni siquiera sería posible.
 */

import { emptySheetStyles, type CellFormat, type TemplateSheet } from "@rymel/design-template";
import type { CellValueMap, FormulaValue } from "@rymel/formula-engine";
import type { SavedCell, SavedSheet } from "@/types/design.types";

/** Lo que se ve en la celda: el resultado, si lo hay, o lo escrito. */
export const shownValue = (cell: SavedCell | undefined): FormulaValue => {
  if (!cell) return "";
  const computed = cell.computed;
  if (computed !== undefined && computed !== null && computed !== "") return computed;
  return cell.value ?? "";
};

const FORMAT_KEYS = [
  "bold",
  "textColor",
  "backgroundColor",
  "border",
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
  "decimals",
] as const;

const formatOf = (cell: SavedCell): CellFormat | undefined => {
  const format: Record<string, unknown> = {};
  for (const key of FORMAT_KEYS) {
    if (cell[key] !== undefined && cell[key] !== "") format[key] = cell[key];
  }
  return Object.keys(format).length > 0 ? (format as CellFormat) : undefined;
};

/**
 * La hoja y sus valores. `content` es la fórmula o el valor escrito, que es
 * lo que el admin consulta al elegir una celda; la rejilla pinta `values`.
 */
export const toGridSheet = (saved: SavedSheet): { sheet: TemplateSheet; values: CellValueMap } => {
  const values: CellValueMap = {};
  const cells: TemplateSheet["cells"] = {};
  for (const [ref, cell] of Object.entries(saved.cells ?? {})) {
    if (!cell) continue;
    const format = formatOf(cell);
    cells[ref] = { content: String(cell.formula || cell.value || ""), ...(format ? { format } : {}) };
    values[`${saved.name}!${ref}`] = shownValue(cell);
  }
  return {
    sheet: {
      name: saved.name,
      position: 0,
      cells,
      styles: {
        ...emptySheetStyles(),
        columnWidths: { ...(saved.columnWidths ?? {}) },
        rowHeights: { ...(saved.rowHeights ?? {}) },
        // Lo que oculta la plantilla, como lo ve el diseñador; lo que oculta
        // él es de su sesión
        hiddenRows: [...(saved.templateHiddenRows ?? [])],
        hiddenColumns: [...(saved.templateHiddenColumns ?? [])],
        freezeRow: saved.freezeRow ?? 0,
        freezeColumn: saved.freezeColumn ?? 0,
        mergedCells: [...(saved.mergedCells ?? [])],
      },
    },
    values,
  };
};
