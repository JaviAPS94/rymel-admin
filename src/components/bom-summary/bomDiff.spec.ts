import { describe, expect, it } from "vitest";
import cases from "./__fixtures__/client-bom-cases.json";
import { diffBom } from "./bomDiff";
import type { SavedCell } from "@/types/designBom.types";

const generated = (cases as unknown as Record<string, { cells: Record<string, SavedCell> }>)[
  "sub_design 90 · plegado"
]!.cells;

/** Copia de la lista generada con cambios, como la guardaría el cliente. */
const adjust = (changes: Record<string, SavedCell | null>) => {
  const cells: Record<string, SavedCell> = JSON.parse(JSON.stringify(generated));
  for (const [ref, cell] of Object.entries(changes)) {
    if (cell === null) delete cells[ref];
    else cells[ref] = cell;
  }
  return cells;
};

/** La fila de un ítem, por su columna B. */
const rowOf = (rows: ReturnType<typeof diffBom>["adjusted"], item: string) =>
  rows.find((row) => row.values[1] === item);

describe("diffBom", () => {
  it("sin cambios, nada marcado", () => {
    const diff = diffBom(adjust({}), generated);
    expect(diff.counts).toEqual({ added: 0, removed: 0, changed: 0 });
  });

  it("una cantidad cambiada marca la fila y la celda, en las dos listas", () => {
    // D3 es la cantidad de 240 · Fibra de 2 mm
    expect(generated.B3?.value).toBe("240");
    const diff = diffBom(adjust({ D3: { value: "=2+3", formula: "=2+3", computed: 5 } }), generated);
    expect(diff.counts).toEqual({ added: 0, removed: 0, changed: 1 });
    const row = rowOf(diff.adjusted, "240")!;
    expect(row.status).toBe("changed");
    expect([...row.changedColumns]).toEqual([3]);
    expect(row.values[3]).toBe("5");
    expect(rowOf(diff.generated, "240")!.status).toBe("changed");
  });

  it("una fila añadida no desplaza a las demás", () => {
    // Fila nueva en medio: todo lo de debajo sube una posición
    const shifted: Record<string, SavedCell> = {};
    for (const [ref, cell] of Object.entries(generated)) {
      const row = Number(ref.slice(1));
      shifted[`${ref[0]}${row >= 4 ? row + 1 : row}`] = cell;
    }
    shifted.B4 = { value: "999" };
    shifted.C4 = { value: "Ítem nuevo" };
    const diff = diffBom(shifted, generated);
    expect(diff.counts).toEqual({ added: 1, removed: 0, changed: 0 });
    expect(rowOf(diff.adjusted, "999")!.status).toBe("added");
  });

  it("una fila vaciada sale como quitada en la generada", () => {
    const accessory = Object.entries(generated).find(([, cell]) => cell.value === "501")![0];
    const row = accessory.slice(1);
    const removed = Object.fromEntries(
      ["B", "C", "D", "E", "F", "G", "H", "I"].map((column) => [`${column}${row}`, null]),
    );
    const diff = diffBom(adjust(removed), generated);
    expect(diff.counts).toEqual({ added: 0, removed: 1, changed: 0 });
    expect(rowOf(diff.generated, "501")!.status).toBe("removed");
  });

  it("cambiar el Ítem es quitar uno y añadir otro", () => {
    const diff = diffBom(adjust({ B3: { value: "241" } }), generated);
    expect(diff.counts).toEqual({ added: 1, removed: 1, changed: 0 });
  });
});
