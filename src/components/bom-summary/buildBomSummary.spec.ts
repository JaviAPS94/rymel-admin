/**
 * La lista del admin es la del cliente, celda a celda.
 *
 * `client-bom-cases.json` lo generó el `buildBomSummary` de project-front
 * antes de retirarlo, sobre los dos diseños reales con configuración de BOM
 * (`sub_design` 90 y 91): con los semielaborados hijos plegados y
 * desplegados, accesorios del elemento, un ítem que ya no existe y un
 * catálogo borrado; y un caso de accesorios de la norma (completo con costos,
 * sin cantidad ni unidad, y con la unidad en `unitMeasurement`). Se regenera
 * con `check-bom-parity.ts --write` en project-front. Si esta prueba falla, la lista dejó de ser la que veía el
 * diseñador.
 */

import { describe, expect, it } from "vitest";
import cases from "./__fixtures__/client-bom-cases.json";
import { buildBomSummaryCells, parseElementValues } from "./buildBomSummary";

type Case = {
  sheets: never[];
  expanded: number[];
  bom: never;
  element: never;
  cells: Record<string, unknown>;
};

describe("paridad con el cliente", () => {
  for (const [name, value] of Object.entries(cases as unknown as Record<string, Case>)) {
    it(name, () => {
      const cells = buildBomSummaryCells(value.bom, new Set(value.expanded), value.sheets, value.element);
      expect(cells).toEqual(value.cells);
    });
  }

  it("los casos cubren lo que importa", () => {
    const all = JSON.stringify(cases);
    expect(all).toContain("(item no encontrado)");
    expect(all).toContain("(catálogo borrado)");
    expect(all).toContain("Pasatapas");
    expect(all).toContain("▼");
    expect(all).toContain("sin cantidad en la norma");
    expect(all).toContain("29552.27");
  });
});

describe("parseElementValues", () => {
  it("acepta arreglo, texto JSON y cualquier otra cosa", () => {
    expect(parseElementValues([{ key: "a" }])).toEqual([{ key: "a" }]);
    expect(parseElementValues('[{"key":"a"}]')).toEqual([{ key: "a" }]);
    expect(parseElementValues("{roto")).toEqual([]);
    expect(parseElementValues(null)).toEqual([]);
  });
});
