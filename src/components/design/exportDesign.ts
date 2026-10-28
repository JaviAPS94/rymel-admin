/**
 * Un diseño como libro de Excel: una pestaña por hoja de diseño, una por hoja
 * de costos y una con la lista de materiales que ve el cliente.
 *
 * Se exportan los valores calculados, no las fórmulas: las de diseño están
 * cifradas y se evalúan en el servidor, y Excel no las sabría resolver.
 */

import type { Workbook } from "exceljs";
import type { DesignDetail, SavedCell, SavedSheet } from "@/types/design.types";
import { shownValue } from "./savedSheet";

/** Excel: 31 caracteres, sin `[]:*?/\`, y sin repetir. */
const sheetName = (name: string, used: Set<string>): string => {
  const base = (name.replace(/[[\]:*?/\\]/g, " ").trim() || "Hoja").slice(0, 31);
  let candidate = base;
  for (let n = 2; used.has(candidate.toLowerCase()); n++) {
    const suffix = ` (${n})`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
};

const NUMBER = /^-?\d+(\.\d+)?$/;

/** El color de la hoja (`#rrggbb`) como ARGB de Excel. */
const argb = (color: string | undefined): string | undefined => {
  const match = color?.match(/^#?([0-9a-f]{6})$/i);
  return match ? `FF${match[1]!.toUpperCase()}` : undefined;
};

const addSheet = (workbook: Workbook, name: string, saved: SavedSheet, used: Set<string>) => {
  const worksheet = workbook.addWorksheet(sheetName(name, used));
  for (const [ref, cell] of Object.entries(saved.cells ?? {}) as [string, SavedCell | undefined][]) {
    if (!cell) continue;
    const value = shownValue(cell);
    if (value === "") continue;
    const target = worksheet.getCell(ref);
    // Un número escrito como texto («18», «29552.27») va como número, para que
    // Excel lo pueda sumar
    target.value = typeof value === "number" || NUMBER.test(value) ? Number(value) : value;
    const color = argb(cell.textColor);
    if (cell.bold || color) {
      target.font = { ...(cell.bold ? { bold: true } : {}), ...(color ? { color: { argb: color } } : {}) };
    }
    const fill = argb(cell.backgroundColor);
    if (fill) target.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    if (cell.decimals !== undefined && typeof target.value === "number") {
      target.numFmt = cell.decimals === 0 ? "0" : `0.${"0".repeat(cell.decimals)}`;
    }
  }
  // Anchos en píxeles → caracteres de Excel (≈ 7 px por carácter)
  for (const [column, width] of Object.entries(saved.columnWidths ?? {})) {
    worksheet.getColumn(Number(column) + 1).width = Math.max(4, Math.round(Number(width) / 7));
  }
  for (const merged of saved.mergedCells ?? []) {
    try {
      worksheet.mergeCells(`${merged.startCell}:${merged.endCell}`);
    } catch {
      // Una combinación que se solapa con otra no impide exportar el resto
    }
  }
};

export const buildDesignWorkbook = async (
  design: DesignDetail,
  bom: { name: string; sheet: SavedSheet } | null,
): Promise<Workbook> => {
  const { Workbook } = (await import("exceljs")).default;
  const workbook = new Workbook();
  workbook.creator = "Rymel admin";
  const used = new Set<string>();
  for (const subDesign of design.subDesigns) {
    addSheet(workbook, subDesign.data?.name || subDesign.name, subDesign.data, used);
  }
  for (const subCost of design.cost?.subCosts ?? []) {
    addSheet(workbook, `Costos ${subCost.data?.name || subCost.name}`, subCost.data, used);
  }
  if (bom) addSheet(workbook, bom.name, bom.sheet, used);
  return workbook;
};

export const downloadDesignWorkbook = async (
  design: DesignDetail,
  bom: { name: string; sheet: SavedSheet } | null,
): Promise<void> => {
  const workbook = await buildDesignWorkbook(design, bom);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `diseno-${design.code}.xlsx`.replace(/[^\w.-]+/g, "_");
  link.click();
  URL.revokeObjectURL(url);
};
