/**
 * Utilidades de rango de la rejilla.
 *
 * Viven fuera del componente para que el archivo de la rejilla solo exporte
 * componentes —lo que necesita el recargado en caliente— y para poder
 * probarlas sin montar React.
 */

export interface GridPosition {
  row: number;
  column: number;
}

/** `A1` → `{ row: 0, column: 0 }`. `null` si la referencia no está bien formada. */
export const parseRef = (ref: string): GridPosition | null => {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  let column = 0;
  for (const character of match[1]) {
    column = column * 26 + (character.charCodeAt(0) - 64);
  }

  return { row: Number(match[2]) - 1, column: column - 1 };
};

/** `true` si `ref` cae dentro del rectángulo que forman `start` y `end`. */
export const isInsideRange = (
  ref: string,
  start: string,
  end: string,
): boolean => {
  const target = parseRef(ref);
  const from = parseRef(start);
  const to = parseRef(end);
  if (!target || !from || !to) return false;

  return (
    target.row >= Math.min(from.row, to.row) &&
    target.row <= Math.max(from.row, to.row) &&
    target.column >= Math.min(from.column, to.column) &&
    target.column <= Math.max(from.column, to.column)
  );
};
