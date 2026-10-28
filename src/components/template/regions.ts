/**
 * Utilidades de región compartidas por el panel de regiones, el menú
 * contextual y sus diálogos. Viven fuera de los componentes para que esos
 * archivos solo exporten componentes, que es lo que necesita el recargado en
 * caliente.
 */

import type { ReadOnlyZone } from "@rymel/design-template";
import { positionOf } from "@hooks/useGridSelection";

export const newRegionId = (prefix: string): string => `${prefix}-${Date.now()}`;

/** Sustituye la región con el mismo `id`, o la añade si es nueva. */
export const upsertRegion = <R extends { id: string }>(regions: readonly R[], region: R): R[] =>
  regions.some((item) => item.id === region.id)
    ? regions.map((item) => (item.id === region.id ? region : item))
    : [...regions, region];

export const readOnlyZone = (startCell: string, endCell: string): ReadOnlyZone => ({
  id: newRegionId("ro"),
  startCell,
  endCell,
});

/**
 * Lee una lista de referencias escrita a mano: `b5, c5` → `["B5", "C5"]`.
 *
 * Si alguna no es una referencia, no devuelve nada: guardar la lista a medias
 * dejaría una condición distinta de la que el autor escribió.
 */
export const parseRefList = (
  text: string,
): { refs: string[]; invalid: string[] } => {
  const items = text
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter((item) => item !== "");
  const invalid = items.filter((item) => positionOf(item) === null);
  return { refs: invalid.length > 0 ? [] : [...new Set(items)], invalid };
};
