/**
 * Huella de una lista generada, sin editar, portada de `project-front`.
 *
 * El cliente la guarda con cada ajuste; el admin la recalcula para saber si
 * la lista generada cambió desde entonces. **Tiene que dar lo mismo que la del
 * cliente**: `bomFingerprint.spec.ts` lo fija con huellas calculadas allí.
 */

import type { SavedCell } from "@/types/designBom.types";

/** JSON con las claves de los objetos ordenadas, para que el orden no cuente. */
const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
};

/** SHA-256 en hexadecimal. */
export const bomFingerprint = async (cells: Record<string, SavedCell>): Promise<string> => {
  const bytes = new TextEncoder().encode(canonical(cells));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
};
