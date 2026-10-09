import { describe, expect, it } from "vitest";
import { emptySheetStyles } from "@rymel/design-template";
import type { ItemCatalogTable, TemplateDocument, TemplateSheet } from "@rymel/design-template";
import { catalogRows, matchCatalogTables } from "./catalog";

const tabla = (overrides: Partial<ItemCatalogTable> = {}): ItemCatalogTable => ({
  id: "tbl-al",
  name: "Aluminio",
  tags: ["aluminio", "rectangular"],
  startCell: "B2",
  endCell: "D6",
  headerRows: 1,
  idColumnOffset: 0,
  descriptionColumnOffset: 1,
  umColumnOffset: 2,
  ...overrides,
});

const hoja = (tables: ItemCatalogTable[]): TemplateSheet => ({
  name: "Tablas",
  position: 0,
  cells: {
    B2: { content: "ID" },
    C2: { content: "Descripción" },
    D2: { content: "U.M." },
    B3: { content: "AL-001" },
    C3: { content: "Platina 3 mm" },
    D3: { content: "KG" },
    B5: { content: " AL-003 " },
    C5: { content: "Platina 5 mm" },
  },
  styles: { ...emptySheetStyles(), itemCatalogTables: tables },
});

const plantilla = (tables: ItemCatalogTable[]): TemplateDocument => ({
  name: "P",
  code: "P",
  type: "DESIGN",
  status: "DRAFT",
  version: 0,
  sheets: [hoja(tables)],
});

describe("catalogRows", () => {
  it("lee las filas de datos, sin encabezado ni filas vacías", () => {
    expect(catalogRows(hoja([]), tabla())).toEqual([
      { itemId: "AL-001", description: "Platina 3 mm", um: "KG", ref: "B3" },
      { itemId: "AL-003", description: "Platina 5 mm", um: "", ref: "B5" },
    ]);
  });

  it("usa los valores calculados cuando se le dan", () => {
    const rows = catalogRows(hoja([]), tabla(), (_sheet, ref) =>
      ref === "C3" ? "calculada" : ref === "B3" ? "AL-001" : "",
    );
    expect(rows).toEqual([{ itemId: "AL-001", description: "calculada", um: "", ref: "B3" }]);
  });
});

describe("matchCatalogTables", () => {
  const dos = [tabla(), tabla({ id: "tbl-cu", name: "Cobre", tags: ["cobre"] })];

  it("enruta por todas las condiciones, sin distinguir mayúsculas", () => {
    expect(matchCatalogTables(plantilla(dos), ["Aluminio"]).map((t) => t.table.id)).toEqual([
      "tbl-al",
    ]);
    expect(
      matchCatalogTables(plantilla(dos), ["ALUMINIO", " rectangular "]).map((t) => t.table.id),
    ).toEqual(["tbl-al"]);
  });

  it("no ofrece nada si una condición no coincide", () => {
    expect(matchCatalogTables(plantilla(dos), ["aluminio", "redondo"])).toEqual([]);
  });

  it("sin condiciones, o con todas vacías, ofrece todas", () => {
    expect(matchCatalogTables(plantilla(dos), [])).toHaveLength(2);
    expect(matchCatalogTables(plantilla(dos), ["", "  "])).toHaveLength(2);
  });
});
