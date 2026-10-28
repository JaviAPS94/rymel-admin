import { describe, expect, it } from "vitest";
import { emptySheetStyles, type TemplateSheet } from "@rymel/design-template";
import { cellMenuEntries } from "./contextMenu";

const hoja = (styles: Partial<TemplateSheet["styles"]> = {}): TemplateSheet => ({
  name: "Hoja1",
  position: 0,
  cells: {},
  styles: { ...emptySheetStyles(), ...styles },
});

const labels = (sheet: TemplateSheet, ref: string, readOnlyEnabled = false) =>
  cellMenuEntries({
    sheet,
    ref,
    rect: { top: 0, left: 0, bottom: 0, right: 0 },
    readOnlyEnabled,
  })
    .flat()
    .map((entry) => entry.label);

describe("cellMenuEntries", () => {
  it("dentro de una zona ofrece editarla, con su código, y quitarla", () => {
    const sheet = hoja({
      semiFinishedZones: [
        {
          id: "sf-1",
          semiFinishedId: 1,
          semiFinishedCode: "BOBINA",
          semiFinishedName: "Bobina BT",
          startCell: "B2",
          endCell: "D6",
        },
      ],
    });
    expect(labels(sheet, "C3")).toEqual(
      expect.arrayContaining(["Editar zona (BOBINA)", "Quitar zona"]),
    );
    expect(labels(sheet, "F9")).toContain("Asignar zona a semi-terminado");
  });

  it("sin la bandera no ofrece la protección", () => {
    expect(labels(hoja(), "A1").some((label) => label.includes("solo lectura"))).toBe(false);
  });

  it("con la bandera ofrece proteger, o quitar la zona que contiene la celda", () => {
    expect(labels(hoja(), "A1", true)).toContain("Proteger como solo lectura");
    const sheet = hoja({ readOnlyZones: [{ id: "ro-1", startCell: "A1", endCell: "B4" }] });
    expect(labels(sheet, "B2", true)).toContain("Quitar solo lectura (A1:B4)");
  });

  it("no ofrece combinar una sola celda", () => {
    expect(labels(hoja(), "A1")).not.toContain("Combinar celdas");
  });
});
