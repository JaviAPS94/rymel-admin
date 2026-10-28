/**
 * La lista armada como filas de una tabla, y como CSV.
 *
 * `buildBomSummaryCells` produce celdas de hoja de cálculo —es la forma del
 * cliente, y se conserva para no tocar sus reglas—. Aquí se leen como las
 * columnas que son: ID, Ítem, Descripción, Cantidad, U.M. y, de los accesorios
 * de la norma, Referencia, Costo promedio, Último costo y Observación.
 */

import type { SavedCell } from '@/types/designBom.types';

export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const;
export const HEADERS = [
  'ID',
  'Ítem',
  'Descripción',
  'Cantidad',
  'U.M.',
  'Referencia',
  'Costo promedio',
  'Último costo',
  'Observación',
];

export interface SummaryRow {
  /** Número de fila en la hoja, empezando en 1. */
  row: number;
  cells: (SavedCell | undefined)[];
}

/**
 * Las filas en orden, incluidas las vacías que separan los semielaborados:
 * son las que hacen legible la lista, igual que en la hoja del cliente.
 */
export const summaryRows = (cells: Record<string, SavedCell>): SummaryRow[] => {
  let last = 0;
  for (const ref of Object.keys(cells)) {
    const row = Number(ref.slice(1));
    if (row > last) last = row;
  }
  return Array.from({ length: last }, (_, index) => ({
    row: index + 1,
    cells: COLUMNS.map((column) => cells[`${column}${index + 1}`]),
  }));
};

const quote = (text: string): string =>
  /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;

/**
 * CSV con `;` y BOM UTF-8: es lo que Excel en español abre con columnas y
 * acentos correctos. Las filas de encabezado de cada semielaborado se
 * conservan, porque sin ellas no se sabe a cuál pertenece cada ítem.
 */
export const toCsv = (cells: Record<string, SavedCell>): string => {
  const lines = [HEADERS.map(quote).join(';')];
  for (const { cells: row } of summaryRows(cells)) {
    lines.push(row.map((cell) => quote(String(cell?.value ?? ''))).join(';'));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
};
