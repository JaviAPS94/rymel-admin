import type { PhantomItem, PhantomItemComponent } from "@/types/phantom-item.types";

/**
 * Declarative column map for the phantom item grid: relates the template's
 * column letter (A..T) to the model field, its scope, its display kind,
 * and — for derived columns — the default formula preinserted on new rows
 * (see design.md, decision 4 and tasks.md 10.6).
 */

export type ColumnScope = "header" | "component" | "derived";
export type ColumnKind = "text" | "number" | "length" | "percentage";

export interface PhantomItemColumnDef {
  letter: string;
  header: string;
  field: string;
  scope: ColumnScope;
  kind: ColumnKind;
  /** Length columns only: fixed limit, or `undefined` if configurable per record. */
  limit?: number;
  /** Derived columns only: default formula for a new row at `row` (1-based, matching A1 notation). */
  defaultFormula?: (row: number) => string;
  /** `true` if the column is read-only in the grid (calculated, never typed by the user). */
  readOnly?: boolean;
}

export const COLUMNS: PhantomItemColumnDef[] = [
  { letter: "A", header: "Tipo PT", field: "finishedProductType", scope: "header", kind: "text" },
  { letter: "B", header: "Tipo PP", field: "workInProcessType", scope: "header", kind: "text" },
  { letter: "C", header: "Raiz Fantasma", field: "phantomRootCode", scope: "header", kind: "text" },
  { letter: "D", header: "R kVA + Norma / Otros", field: "kvaRatingStandard", scope: "header", kind: "text" },
  { letter: "E", header: "Item", field: "itemCode", scope: "header", kind: "text" },
  {
    letter: "F",
    header: "Referencia",
    field: "reference",
    scope: "header",
    kind: "text",
    defaultFormula: (row) => `="F-"&A${row}&"-"&B${row}&"-"&C${row}&D${row}`,
  },
  {
    letter: "G",
    header: "Largo 40/50",
    field: "referenceLength",
    scope: "derived",
    kind: "length",
    readOnly: true,
    defaultFormula: (row) => `=LARGO(F${row})`,
  },
  {
    letter: "H",
    header: "Desc. item",
    field: "itemDescription",
    scope: "header",
    kind: "text",
    defaultFormula: (row) => `=F${row}`,
  },
  {
    letter: "I",
    header: "Largo 40",
    field: "itemDescriptionLength",
    scope: "derived",
    kind: "length",
    limit: 40,
    readOnly: true,
    defaultFormula: (row) => `=LARGO(H${row})`,
  },
  {
    letter: "J",
    header: "Desc. corta",
    field: "shortDescription",
    scope: "header",
    kind: "text",
    defaultFormula: (row) => `="FANTASMA "&C${row}`,
  },
  {
    letter: "K",
    header: "Largo 20",
    field: "shortDescriptionLength",
    scope: "derived",
    kind: "length",
    limit: 20,
    readOnly: true,
    defaultFormula: (row) => `=LARGO(J${row})`,
  },
  { letter: "L", header: "UM", field: "unitOfMeasure", scope: "header", kind: "text" },
  { letter: "M", header: "ÍTEM - COMPONENTE", field: "componentItemCode", scope: "component", kind: "text" },
  { letter: "N", header: "DESCRIPCIÓN", field: "description", scope: "component", kind: "text" },
  { letter: "O", header: "CANT. BASE", field: "baseQuantity", scope: "component", kind: "number" },
  { letter: "P", header: "CANT. REQUERIDA", field: "requiredQuantity", scope: "component", kind: "number" },
  {
    letter: "Q",
    header: "CANT. REQUERIDA UNITARIA",
    field: "requiredQuantityPerUnit",
    scope: "component",
    kind: "number",
    defaultFormula: (row) => `=P${row}/O${row}`,
  },
  { letter: "R", header: "U.M", field: "componentUnitOfMeasure", scope: "component", kind: "text" },
  { letter: "S", header: "% DESP.", field: "wastePercentage", scope: "component", kind: "percentage" },
  { letter: "T", header: "BODEGA CONSUMO", field: "consumptionWarehouse", scope: "component", kind: "text" },
];

const byLetter = new Map(COLUMNS.map((column) => [column.letter, column]));
const byField = new Map(COLUMNS.map((column) => [column.field, column]));

export const getColumnByLetter = (letter: string): PhantomItemColumnDef | undefined =>
  byLetter.get(letter.toUpperCase());

export const getColumnByField = (field: string): PhantomItemColumnDef | undefined =>
  byField.get(field);

export const COLUMN_LETTERS = COLUMNS.map((column) => column.letter);

export const HEADER_COLUMNS = COLUMNS.filter((column) => column.scope === "header");
export const DERIVED_COLUMNS = COLUMNS.filter((column) => column.scope === "derived");
export const COMPONENT_COLUMNS = COLUMNS.filter((column) => column.scope === "component");

/** Reads a header field's current value off a `PhantomItem`, for grid display. */
export const readHeaderValue = (
  phantomItem: Pick<
    PhantomItem,
    | "finishedProductType"
    | "workInProcessType"
    | "phantomRootCode"
    | "kvaRatingStandard"
    | "itemCode"
    | "reference"
    | "referenceLength"
    | "itemDescription"
    | "itemDescriptionLength"
    | "shortDescription"
    | "shortDescriptionLength"
    | "unitOfMeasure"
  >,
  field: string,
): string | number | undefined =>
  (phantomItem as unknown as Record<string, string | number | undefined>)[field];

/** Reads a component field's current value off a `PhantomItemComponent`, for grid display. */
export const readComponentValue = (
  component: PhantomItemComponent,
  field: string,
): string | number | undefined =>
  (component as unknown as Record<string, string | number | undefined>)[field];
