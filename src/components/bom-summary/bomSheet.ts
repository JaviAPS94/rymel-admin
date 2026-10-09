/**
 * La lista de materiales como hoja de cálculo editable.
 *
 * En el cliente la lista se pintaba en una hoja completa: se podían cambiar
 * valores, escribir fórmulas y dar formato. Aquí se conserva ese
 * comportamiento montándola en la misma rejilla y el mismo motor que el
 * editor de plantillas, a través de un documento de una sola hoja.
 */

import { emptySheetStyles, type TemplateCell, type TemplateDocument } from "@rymel/design-template";
import type { FormulaValue } from "@rymel/formula-engine";
import type { SavedCell } from "@/types/designBom.types";
import { BOM_SUMMARY_COLUMN_WIDTHS } from "./buildBomSummary";

export const BOM_SHEET_NAME = "Lista de materiales";

const toTemplateCell = (cell: SavedCell): TemplateCell => {
  const format = {
    ...(cell.bold ? { bold: true } : {}),
    ...(cell.textColor ? { textColor: cell.textColor } : {}),
    ...(cell.backgroundColor ? { backgroundColor: cell.backgroundColor } : {}),
  };
  return {
    content: String(cell.value ?? ""),
    ...(Object.keys(format).length > 0 ? { format } : {}),
    ...(cell.bomToggleNodeId === undefined ? {} : { bomToggleNodeId: cell.bomToggleNodeId }),
  };
};

/** Las celdas armadas por `buildBomSummaryCells`, como documento de una hoja. */
export const toBomDocument = (cells: Record<string, SavedCell>): TemplateDocument => ({
  name: BOM_SHEET_NAME,
  code: "BOM",
  type: "DESIGN",
  status: "DRAFT",
  version: 0,
  sheets: [
    {
      name: BOM_SHEET_NAME,
      position: 0,
      cells: Object.fromEntries(
        Object.entries(cells).map(([ref, cell]) => [ref, toTemplateCell(cell)]),
      ),
      styles: { ...emptySheetStyles(), columnWidths: { ...BOM_SUMMARY_COLUMN_WIDTHS } },
    },
  ],
});

/**
 * Lo que se ve en la hoja, para exportarlo: el valor calculado de cada celda,
 * con las ediciones hechas en pantalla.
 */
export const visibleCells = (
  document: TemplateDocument,
  valueOf: (ref: string) => FormulaValue | undefined,
): Record<string, SavedCell> => {
  const sheet = document.sheets[0];
  if (!sheet) return {};
  const cells: Record<string, SavedCell> = {};
  for (const ref of Object.keys(sheet.cells)) {
    const value = valueOf(ref);
    cells[ref] = { value: value === undefined || value === null ? "" : String(value) };
  }
  return cells;
};
