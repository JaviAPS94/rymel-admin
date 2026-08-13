import { describe, expect, it } from "vitest";
import { buildGraph, updateCellInGraph } from "@/lib/formula";
import {
  buildEmptyCells,
  buildValueMap,
  recalculateAll,
  recalculateCells,
  type CellGrid,
} from "./usePhantomItemGrid";

describe("usePhantomItemGrid recalculation", () => {
  it("populates `computed` for a plain literal cell (no formula) on a full recalc", () => {
    const cells = buildEmptyCells();
    const graph = buildGraph(cells);

    const recalculated = recalculateAll(graph, cells);

    // Row 1's header text columns start empty, but must resolve to "" rather
    // than staying at their uninitialized placeholder.
    expect(recalculated.A1.computed).toBe("");
  });

  it("regression: editing a plain literal cell updates its own `computed`, not just its dependents", () => {
    // This is exactly what `usePhantomItemGrid.setCellValue` does when a
    // user types into a header field like "Tipo PT": update the formula,
    // register it in the dep graph, then recalculate the changed refs.
    const cells: CellGrid = {
      A1: { formula: "", computed: "" },
      F1: { formula: '="F-"&A1', computed: "" },
    };
    const graph = buildGraph(cells);

    cells.A1 = { ...cells.A1, formula: "1UEF" };
    updateCellInGraph(graph, "A1", "1UEF");
    const recalculated = recalculateCells(graph, ["A1"], cells);

    // Before the fix, `computed` for a no-formula dirty cell was never set
    // (getRecalcOrder excludes cells without a formula from `order`), so
    // dependents reading it via a cell reference fell back to 0.
    expect(recalculated.A1.computed).toBe("1UEF");
    expect(recalculated.F1.computed).toBe("F-1UEF");
  });

  it("buildValueMap reads every cell's computed value, including literals", () => {
    const cells: CellGrid = {
      A1: { formula: "1UEF", computed: "1UEF" },
      B1: { formula: "=A1", computed: "1UEF" },
    };
    expect(buildValueMap(cells)).toEqual({ A1: "1UEF", B1: "1UEF" });
  });
});
