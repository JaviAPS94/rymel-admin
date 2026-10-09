/**
 * Lectura de las tablas de catálogo de una plantilla.
 *
 * Una sola implementación para todo lo que necesita saber qué ítems tiene una
 * tabla —el selector de ítem y la marca de la celda vinculada—, porque dos
 * lecturas de «qué filas son datos» acabarían discrepando en las filas de
 * encabezado.
 */

import type {
  ItemCatalogTable,
  TemplateDocument,
  TemplateSheet,
} from "@rymel/design-template";
import { parseRef } from "./grid/range";
import { refOf } from "@hooks/useGridSelection";

export interface CatalogRow {
  itemId: string;
  description: string;
  um: string;
  /** Celda del identificador, para poder llevar a ella. */
  ref: string;
}

/**
 * Lo que se muestra de una celda. Por omisión, lo escrito; quien tenga
 * valores calculados puede pasarlos, para que una descripción con fórmula se
 * lea como el diseñador la verá.
 */
export type ValueOf = (sheetName: string, ref: string) => string;

const writtenValue =
  (sheet: TemplateSheet): ValueOf =>
  (_sheetName, ref) =>
    sheet.cells[ref]?.content.trim() ?? "";

/** Filas de datos de una tabla, sin las de encabezado ni las vacías. */
export const catalogRows = (
  sheet: TemplateSheet,
  table: ItemCatalogTable,
  valueOf: ValueOf = writtenValue(sheet),
): CatalogRow[] => {
  const start = parseRef(table.startCell);
  const end = parseRef(table.endCell);
  if (start === null || end === null) return [];

  const top = Math.min(start.row, end.row);
  const bottom = Math.max(start.row, end.row);
  const left = Math.min(start.column, end.column);

  const rows: CatalogRow[] = [];
  for (let row = top + table.headerRows; row <= bottom; row++) {
    const ref = refOf(row, left + table.idColumnOffset);
    const itemId = valueOf(sheet.name, ref).trim();
    if (itemId === "") continue;
    rows.push({
      itemId,
      description: valueOf(sheet.name, refOf(row, left + table.descriptionColumnOffset)),
      um: valueOf(sheet.name, refOf(row, left + table.umColumnOffset)),
      ref,
    });
  }
  return rows;
};

export interface CatalogTableRef {
  sheetName: string;
  table: ItemCatalogTable;
}

/** Todas las tablas de catálogo de la plantilla, con su hoja. */
export const catalogTables = (document: TemplateDocument): CatalogTableRef[] =>
  document.sheets.flatMap((sheet) =>
    sheet.styles.itemCatalogTables.map((table) => ({ sheetName: sheet.name, table })),
  );

const normalize = (text: string): string => text.trim().toLowerCase();

/**
 * Tablas cuyas etiquetas contienen **todos** los valores de las condiciones.
 *
 * Es la regla del diseñador: las condiciones enrutan a una tabla comparando
 * sin distinguir mayúsculas. Sin condiciones, o con todas vacías, no hay nada
 * que filtrar y valen todas.
 */
export const matchCatalogTables = (
  document: TemplateDocument,
  conditionValues: readonly string[],
): CatalogTableRef[] => {
  const required = conditionValues.map(normalize).filter((value) => value !== "");
  const all = catalogTables(document);
  if (required.length === 0) return all;

  return all.filter(({ table }) => {
    const tags = (table.tags ?? []).map(normalize);
    return required.every((value) => tags.includes(value));
  });
};
