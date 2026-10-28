/**
 * La lógica del rastreo se prueba en `@rymel/design-template`. Aquí, que el
 * editor le pasa la plantilla y su grafo, y que recalcula cuando cambia la
 * versión del grafo.
 */

/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { buildGraph } from "@rymel/formula-engine";
import { emptySheetStyles, toEngineBook, type TemplateDocument } from "@rymel/design-template";
import { useCellTrace } from "./useCellTrace";

const plantilla: TemplateDocument = {
  name: "P",
  code: "P",
  type: "DESIGN",
  status: "DRAFT",
  version: 0,
  sheets: [
    {
      name: "Resumen",
      position: 0,
      cells: { A1: { content: "=Tablas!J14*2" }, B1: { content: "", elementKey: "power" } },
      styles: emptySheetStyles(),
    },
    { name: "Tablas", position: 1, cells: { J14: { content: "=Resumen!B1" } }, styles: emptySheetStyles() },
  ],
};

describe("useCellTrace", () => {
  it("traces the active cell over the editor's graph, across sheets", () => {
    const graph = buildGraph(toEngineBook(plantilla));
    const { result } = renderHook(() =>
      useCellTrace(plantilla, () => graph, "Resumen", "A1", { full: true }, 0),
    );

    expect(result.current.precedents).toEqual([{ sheet: "Tablas", ref: "J14" }]);
    expect(result.current.chain).toEqual([
      [{ sheet: "Tablas", ref: "J14", origin: "formula" }],
      [{ sheet: "Resumen", ref: "B1", origin: "element", elementKey: "power" }],
    ]);
  });

  it("recalculates when the graph version changes, since the graph changes in place", () => {
    const graph = buildGraph(toEngineBook(plantilla));
    const { result, rerender } = renderHook(
      ({ version }) => useCellTrace(plantilla, () => graph, "Tablas", "J14", {}, version),
      { initialProps: { version: 0 } },
    );
    expect(result.current.dependents).toEqual([{ sheet: "Resumen", ref: "A1" }]);

    graph.dependents.set("Tablas!J14", new Set());
    rerender({ version: 1 });

    expect(result.current.dependents).toEqual([]);
  });
});
