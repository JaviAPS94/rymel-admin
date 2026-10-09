import { describe, expect, it } from "vitest";
import {
  buildGridColumns,
  columnLetter,
  customKeyFor,
  scopeOf,
  validateColumns,
} from "./processColumns";
import { COLUMNS } from "./columns";
import { ProcessColumnScope, type PhantomProcess, type ProcessColumn } from "@/types/phantom-item.types";

const catalog = (): ProcessColumn[] =>
  COLUMNS.map((column) => ({
    key: column.field,
    header: column.header,
    scope: column.scope === "component" ? ProcessColumnScope.COMPONENT : ProcessColumnScope.HEADER,
  }));

/** ALISTAMIENTO Y ENCUBE as the import creates it, plus a line column to try */
const alistamiento: PhantomProcess = {
  id: 3,
  name: "ALISTAMIENTO Y ENCUBE",
  position: 2,
  referenceSeparator: "",
  families: [],
  phantomItemsCount: 76,
  columns: [
    ...catalog().map((column) =>
      column.key === "requiredQuantity" ? { ...column, header: "CANT. REQUERIDA LMS" } : column,
    ),
    { key: "custom:plan1", header: "PLAN1", scope: ProcessColumnScope.HEADER },
    { key: "custom:lote", header: "LOTE", scope: ProcessColumnScope.COMPONENT },
  ],
};

describe("process columns", () => {
  it("builds an own column's key as the server does", () => {
    expect(customKeyFor("MAYOR 1")).toBe("custom:mayor_1");
    expect(customKeyFor(" Clasificación  ")).toBe("custom:clasificacion");
  });

  it("names columns as Excel does", () => {
    expect([0, 19, 20, 25, 26, 27].map(columnLetter)).toEqual(["A", "T", "U", "Z", "AA", "AB"]);
  });

  it("takes a catalog column's scope from the catalog, whatever was stored", () => {
    expect(scopeOf({ key: "itemCode", header: "Item", scope: ProcessColumnScope.COMPONENT })).toBe(
      ProcessColumnScope.HEADER,
    );
    expect(scopeOf({ key: "custom:lote", header: "LOTE", scope: ProcessColumnScope.COMPONENT })).toBe(
      ProcessColumnScope.COMPONENT,
    );
  });

  describe("validation", () => {
    it("accepts the catalog", () => {
      expect(validateColumns(catalog())).toEqual([]);
    });

    it("requires the columns the import needs", () => {
      const withoutComponent = catalog().filter((column) => column.key !== "componentItemCode");
      expect(validateColumns(withoutComponent)).toEqual(["Falta «ÍTEM - COMPONENTE», que es obligatoria."]);
    });

    it("keeps «Fantasma» for the family", () => {
      const columns = [...catalog(), { key: "custom:fantasma", header: "fantasma", scope: ProcessColumnScope.HEADER }];
      expect(validateColumns(columns)).toEqual(["«Fantasma» está reservado para la columna de familia."]);
    });

    it("rejects a header repeated without regard to case or accents", () => {
      const columns = [...catalog(), { key: "custom:descripcion", header: "Descripcion", scope: ProcessColumnScope.COMPONENT }];
      expect(validateColumns(columns)).toEqual(["El encabezado «Descripcion» está repetido."]);
    });
  });

  describe("editor grid", () => {
    it("keeps A–T with the process's headers and adds its own line columns from U", () => {
      const columns = buildGridColumns(alistamiento);

      expect(columns).toHaveLength(21);
      expect(columns.find((column) => column.letter === "P")).toMatchObject({
        field: "requiredQuantity",
        header: "CANT. REQUERIDA LMS",
        kind: "number",
      });
      expect(columns[20]).toMatchObject({ letter: "U", field: "custom:lote", header: "LOTE", scope: "component" });
    });

    it("writes «Referencia» with the process's rule", () => {
      const withSpace = buildGridColumns({ ...alistamiento, referenceSeparator: " " });
      expect(withSpace.find((column) => column.letter === "F")!.defaultFormula!(3)).toBe(
        '="F-"&A3&"-"&B3&"-"&C3&" "&D3',
      );
      expect(buildGridColumns(alistamiento).find((column) => column.letter === "F")!.defaultFormula!(3)).toBe(
        '="F-"&A3&"-"&B3&"-"&C3&D3',
      );
    });

    it("leaves own header columns out of the grid", () => {
      expect(buildGridColumns(alistamiento).some((column) => column.field === "custom:plan1")).toBe(false);
    });

    it("is the catalog when there is no process", () => {
      expect(buildGridColumns()).toEqual(COLUMNS);
    });
  });
});
