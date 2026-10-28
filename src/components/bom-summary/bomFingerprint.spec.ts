import { describe, expect, it } from "vitest";
import cases from "./__fixtures__/client-bom-cases.json";
import { bomFingerprint } from "./bomFingerprint";
import type { SavedCell } from "@/types/designBom.types";

const cellsOf = (name: string) =>
  (cases as unknown as Record<string, { cells: Record<string, SavedCell> }>)[name]!.cells;

// Calculadas con el `bomFingerprint` de project-front sobre estos mismos casos
const CLIENT = {
  "sub_design 90 · plegado": "f7c6852346570823d8cddaab6b4e6a925220eb027bfe2129473bd7b4b4571dd5",
  "accesorios de la norma": "f19ece038913dd934c725bb10605c89fadfd91d298a7655d450af659b5e92a9f",
};

describe("bomFingerprint", () => {
  for (const [name, expected] of Object.entries(CLIENT)) {
    it(`da la misma huella que el cliente: ${name}`, async () => {
      expect(await bomFingerprint(cellsOf(name))).toBe(expected);
    });
  }

  it("no depende del orden de las celdas", async () => {
    const cells = cellsOf("sub_design 90 · plegado");
    const reversed = Object.fromEntries(Object.entries(cells).reverse());
    expect(await bomFingerprint(reversed)).toBe(CLIENT["sub_design 90 · plegado"]);
  });
});
