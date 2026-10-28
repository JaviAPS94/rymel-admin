import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildDesignWorkbook } from "./exportDesign";
import type { DesignDetail, SavedSheet } from "@/types/design.types";

const sheet = (name: string, cells: SavedSheet["cells"], extra: Partial<SavedSheet> = {}): SavedSheet => ({
  id: name,
  name,
  cells,
  ...extra,
});

const DESIGN = {
  id: 28,
  code: "1DAA26A54-CO CV",
  name: "28",
  createdAt: "",
  updatedAt: "",
  designElements: [],
  subDesigns: [
    {
      id: 90,
      name: "Hoja1",
      code: "h",
      data: sheet(
        "Hoja1",
        {
          A1: { value: "Espesor", bold: true, backgroundColor: "#dbeafe" },
          B1: { value: "=4*6", formula: "=4*6", computed: 24 },
          C1: { value: "18" },
          D1: { value: "1-25-220" },
          E1: { value: "3.14159", decimals: 2 },
        },
        { columnWidths: { 0: 140 }, mergedCells: [{ startCell: "A3", endCell: "B4", rowSpan: 2, colSpan: 2 }] },
      ),
    },
  ],
  cost: { id: 1, name: "Costos", subCosts: [{ id: 5, name: "Hoja1", code: "c", data: sheet("Hoja1", { A1: { value: "100" } }) }] },
} as unknown as DesignDetail;

const roundTrip = async (bom: { name: string; sheet: SavedSheet } | null) => {
  const workbook = await buildDesignWorkbook(DESIGN, bom);
  const read = new ExcelJS.Workbook();
  await read.xlsx.load((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
  return read;
};

describe("buildDesignWorkbook", () => {
  it("una pestaña por hoja de diseño, de costos y la lista de materiales, sin repetir nombres", async () => {
    const read = await roundTrip({ name: "Lista de materiales", sheet: sheet("Lista", { B3: { value: "240" } }) });
    expect(read.worksheets.map((ws) => ws.name)).toEqual(["Hoja1", "Costos Hoja1", "Lista de materiales"]);
  });

  it("la hoja base del diseño no se exporta aparte: va calculada en la lista de materiales", async () => {
    const withBase = {
      ...DESIGN,
      subDesigns: [
        ...DESIGN.subDesigns,
        { id: 91, name: "Lista de materiales", code: "b", data: sheet("Lista de materiales", { D3: { value: "=Hoja1!B1", computed: "viejo" } }, { billOfMaterials: { structureId: 2, structureCode: "X", structureName: "X" } }) },
      ],
    } as unknown as DesignDetail;
    const workbook = await buildDesignWorkbook(withBase, { name: "Lista de materiales", sheet: sheet("Lista", { D3: { value: "24" } }) });
    expect(workbook.worksheets.map((ws) => ws.name)).toEqual(["Hoja1", "Costos Hoja1", "Lista de materiales"]);
    expect(workbook.getWorksheet("Lista de materiales")!.getCell("D3").value).toBe(24);
  });

  it("exporta los valores calculados, con números como números", async () => {
    const ws = (await roundTrip(null)).getWorksheet("Hoja1")!;
    expect(ws.getCell("B1").value).toBe(24);
    expect(ws.getCell("C1").value).toBe(18);
    expect(ws.getCell("D1").value).toBe("1-25-220");
    expect(ws.getCell("A1").font?.bold).toBe(true);
    expect(ws.getCell("A1").fill).toMatchObject({ fgColor: { argb: "FFDBEAFE" } });
    expect(ws.getCell("E1").numFmt).toBe("0.00");
    expect(ws.getColumn(1).width).toBe(20);
    expect(ws.getCell("B4").isMerged).toBe(true);
  });
});
