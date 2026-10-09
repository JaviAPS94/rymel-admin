import { COLUMNS, getColumnByField, type PhantomItemColumnDef } from "./columns";
import {
  ProcessColumnScope,
  type PhantomProcess,
  type ProcessColumn,
} from "@/types/phantom-item.types";

/**
 * A process's columns, as the server keeps them (see `process-columns.ts` in
 * project-back): catalog fields under the header the process uses, plus own
 * columns (`custom:…`) stored as text. These rules repeat the server's so the
 * editor can say what is wrong before saving; the server checks them again.
 */

export const CUSTOM_PREFIX = "custom:";
export const FAMILY_HEADER = "Fantasma";

/** Without these the import cannot group or quantify a phantom item */
export const REQUIRED_KEYS = ["itemCode", "componentItemCode", "baseQuantity", "requiredQuantity"];

export const isCustomKey = (key: string): boolean => key.startsWith(CUSTOM_PREFIX);

/** Without case, accents or extra spaces, as the server compares headers */
export const normalizeHeader = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** «MAYOR 1» → `custom:mayor_1`, the same key the server would infer */
export const customKeyFor = (header: string): string =>
  CUSTOM_PREFIX +
  normalizeHeader(header)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

/** Where a column's values live: a catalog field's own scope, or the declared one */
export const scopeOf = (column: ProcessColumn): ProcessColumnScope => {
  if (isCustomKey(column.key)) return column.scope;
  return getColumnByField(column.key)?.scope === "component"
    ? ProcessColumnScope.COMPONENT
    : ProcessColumnScope.HEADER;
};

/** The catalog's name for a field, to tell it apart from the process's header */
export const catalogHeader = (key: string): string | undefined => getColumnByField(key)?.header;

/** Catalog fields the process does not show yet */
export const missingCatalogColumns = (columns: ProcessColumn[]) => {
  const used = new Set(columns.map((column) => column.key));
  return COLUMNS.filter((column) => !used.has(column.field));
};

/** Problems with a column list, in Spanish; empty if it is valid */
export const validateColumns = (columns: ProcessColumn[]): string[] => {
  const problems: string[] = [];
  const keys = new Set<string>();
  const headers = new Set<string>();

  columns.forEach((column, index) => {
    const header = column.header.trim();
    if (header === "") problems.push(`La columna ${index + 1} no tiene encabezado.`);
    if (header.length > 100) problems.push(`«${header}» tiene más de 100 caracteres.`);
    if (isCustomKey(column.key) && column.key === CUSTOM_PREFIX) {
      problems.push(`«${header}» necesita letras o números en su nombre.`);
    }
    if (keys.has(column.key)) problems.push(`«${header}» está repetida.`);
    keys.add(column.key);

    const normalized = normalizeHeader(header);
    if (normalized === normalizeHeader(FAMILY_HEADER)) {
      problems.push(`«${FAMILY_HEADER}» está reservado para la columna de familia.`);
    } else if (normalized !== "" && headers.has(normalized)) {
      problems.push(`El encabezado «${header}» está repetido.`);
    }
    headers.add(normalized);
  });

  REQUIRED_KEYS.forEach((key) => {
    if (!keys.has(key)) problems.push(`Falta «${catalogHeader(key) ?? key}», que es obligatoria.`);
  });

  return problems;
};

/**
 * «Referencia» with the process's rule, as its sheet writes it:
 * `CONCATENATE("F-",C,"-",D,"-",E," ",F)` when the formula adds the space.
 */
export const referenceFormula = (separator: string) => (row: number) =>
  `="F-"&A${row}&"-"&B${row}&"-"&C${row}&"${separator.replace(/"/g, '""')}"&D${row}`;

/** 0 → A, 25 → Z, 26 → AA, as Excel names its columns */
export const columnLetter = (index: number): string => {
  let letter = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letter = String.fromCharCode(65 + ((n - 1) % 26)) + letter;
  }
  return letter;
};

/** The process's own columns of one scope, in its order */
export const ownColumns = (process: PhantomProcess | undefined, scope: ProcessColumnScope) =>
  (process?.columns ?? []).filter((column) => isCustomKey(column.key) && column.scope === scope);

/**
 * The editor grid for a process: the catalog's A–T, with their formulas and
 * types, under the headers the process uses («CANT. REQUERIDA LMS»), then the
 * process's own line columns from U on. Own header columns (PLAN/MAYOR) are
 * one value per phantom item and go in the header form, not in the grid.
 */
export const buildGridColumns = (process?: PhantomProcess): PhantomItemColumnDef[] => {
  const headers = new Map((process?.columns ?? []).map((column) => [column.key, column.header]));
  const separator = process?.referenceSeparator ?? "";
  return [
    ...COLUMNS.map((column) => ({
      ...column,
      header: headers.get(column.field) ?? column.header,
      ...(column.field === "reference" && separator
        ? { defaultFormula: referenceFormula(separator) }
        : {}),
    })),
    ...ownColumns(process, ProcessColumnScope.COMPONENT).map((column, index) => ({
      letter: columnLetter(COLUMNS.length + index),
      header: column.header,
      field: column.key,
      scope: "component" as const,
      kind: "text" as const,
    })),
  ];
};
