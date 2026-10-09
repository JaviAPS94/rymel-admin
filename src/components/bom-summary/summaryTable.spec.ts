import { describe, expect, it } from "vitest";
import { summaryRows, toCsv } from "./summaryTable";

const cells = {
  A1: { value: "1", bold: true },
  B1: { value: "Semielaborado : Bobina" },
  B2: { value: "AL-001" },
  C2: { value: 'Platina "3 mm"; recocida' },
  D2: { value: "18" },
  E2: { value: "kg" },
  B4: { value: "AC-1" },
};

describe("summaryRows", () => {
  it("conserva las filas vacías que separan los semielaborados", () => {
    const rows = summaryRows(cells);
    expect(rows.map((row) => row.row)).toEqual([1, 2, 3, 4]);
    expect(rows[2]!.cells.every((cell) => cell === undefined)).toBe(true);
  });
});

describe("toCsv", () => {
  const csv = toCsv(cells);

  it("empieza con BOM UTF-8 y lleva encabezado de columnas con `;`", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1).split("\r\n")[0]).toBe("ID;Ítem;Descripción;Cantidad;U.M.");
  });

  it("entrecomilla lo que trae `;` o comillas", () => {
    expect(csv).toContain(';AL-001;"Platina ""3 mm""; recocida";18;kg');
  });

  it("una fila por fila de la lista, vacías incluidas", () => {
    expect(csv.slice(1).trimEnd().split("\r\n")).toHaveLength(5);
  });
});
