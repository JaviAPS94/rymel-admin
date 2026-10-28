/**
 * La sección «Diseños», montada con los servicios simulados: el listado con
 * sus filtros y el detalle con sus hojas, su lista de materiales y sus
 * acciones.
 */

/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  getById: vi.fn(),
  getVersions: vi.fn(),
  getBomAdjustment: vi.fn(),
  recalculate: vi.fn(),
  deactivate: vi.fn(),
  searchByCode: vi.fn(),
  download: vi.fn(),
}));

vi.mock("@services/designService", () => ({
  designService: {
    list: mocks.list,
    getById: mocks.getById,
    getVersions: mocks.getVersions,
    getBomAdjustment: mocks.getBomAdjustment,
    recalculate: mocks.recalculate,
    deactivate: mocks.deactivate,
  },
}));
vi.mock("@services/bomService", () => ({ bomService: { searchByCode: mocks.searchByCode } }));
vi.mock("@components/design/exportDesign", () => ({ downloadDesignWorkbook: mocks.download }));
vi.mock("@components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { DesignListPage } from "./DesignListPage";
import { DesignDetailPage } from "./DesignDetailPage";

// La rejilla mide su ventana para decidir qué pinta: jsdom no mide nada.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as never;
for (const [prop, value] of [
  ["clientHeight", 900],
  ["clientWidth", 1200],
] as const) {
  Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, value });
}

/** Una hoja con un ítem vinculado dentro de la zona del semielaborado 1. */
const SHEET = {
  id: "s1",
  name: "Hoja1",
  cells: {
    A1: { value: "Espesor", bold: true },
    B2: { value: "=1+2", formula: "=1+2", computed: 3, itemLink: { catalogTableId: "t1", itemId: "240" } },
    H2: { value: "240" },
    I2: { value: "Fibra de 2 mm" },
    J2: { value: "KLS" },
  },
  semiFinishedZones: [{ semiFinishedId: 1, startCell: "A1", endCell: "C5" }],
  itemCatalogTables: [
    { id: "t1", startCell: "H1", endCell: "J3", headerRows: 1, idColumnOffset: 0, descriptionColumnOffset: 1, umColumnOffset: 2 },
  ],
};
const STRUCTURE = {
  id: 2,
  code: "1-25-220-120",
  name: "Estructura de prueba",
  createdAt: "",
  updatedAt: "",
  nodes: [
    {
      id: 10,
      semiFinished: { id: 1, name: "Bobina", code: "SF1" },
      children: [{ id: 11, semiFinished: { id: 2, name: "Núcleo", code: "SF2" }, children: [] }],
    },
  ],
};
const DESIGN = {
  id: 28,
  code: "1DAA26A54-CO CV",
  name: "Diseño 28",
  createdAt: "2026-10-01T10:00:00Z",
  updatedAt: "2026-10-02T10:00:00Z",
  designSubType: { id: 1, name: "1F", designType: { id: 1, name: "Convencionales" } },
  designElements: [
    {
      id: 1,
      element: {
        id: 1,
        sapReference: "1-25-220-120-CV-CT-NTCA-CO-ST",
        norm: { id: 3, name: "NTE INEN 2120", country: { id: 1, name: "Ecuador" } },
        values: JSON.stringify([
          { key: "potencia", name: "Potencia", value: 25 },
          {
            key: "accesories",
            value: [{ id: 601, reference: "06010504", description: "Indicador nivel aceite", value: 2, unitOfMeasurement: "UND", semiFinished: { id: 1, name: "Bobina" } }],
          },
        ]),
      },
    },
  ],
  subDesigns: [{ id: 90, name: "Hoja1", code: "h", data: SHEET }],
  cost: { id: 1, name: "Costos", subCosts: [{ id: 5, name: "Costos1", code: "c", data: { ...SHEET, name: "Costos1", cells: { A1: { value: "100" } } } }] },
};
const ROW = {
  id: 28,
  code: DESIGN.code,
  name: DESIGN.name,
  createdAt: DESIGN.createdAt,
  updatedAt: DESIGN.updatedAt,
  designType: { id: 1, name: "Convencionales" },
  designSubType: { id: 1, name: "1F" },
  elements: [{ id: 1, sapReference: "1-25-220-120-CV-CT-NTCA-CO-ST", norm: { id: 3, name: "NTE INEN 2120" }, country: { id: 1, name: "Ecuador" } }],
  stale: true,
  bomAdjustment: null,
};
const VERSIONS = [
  { subDesignId: 90, name: "Hoja1", stale: true, functions: [{ functionId: 10, code: "QUADRATIC", name: "Cuadrática", usedVersion: 2, currentVersion: 3 }] },
];
const REPORT = {
  recalculated: 1,
  unchanged: 0,
  skipped: 0,
  failed: 0,
  outcomes: [{ subDesignId: 90, status: "recalculado", changedCells: [{ ref: "B2", formula: "=1+2", before: 3, after: 4 }] }],
};

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.list.mockResolvedValue({
    data: [ROW],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
    options: {
      norms: [{ id: 3, name: "NTE INEN 2120" }],
      countries: [{ id: 1, name: "Ecuador" }],
      designTypes: [{ id: 1, name: "Convencionales" }],
      designSubTypes: [{ id: 1, name: "1F", designTypeId: 1 }],
    },
  });
  mocks.getById.mockResolvedValue(DESIGN);
  mocks.getVersions.mockResolvedValue(VERSIONS);
  mocks.getBomAdjustment.mockResolvedValue(null);
  mocks.searchByCode.mockResolvedValue(STRUCTURE);
  mocks.recalculate.mockResolvedValue(REPORT);
  mocks.deactivate.mockResolvedValue(undefined);
  mocks.download.mockResolvedValue(undefined);
});

const renderAt = (path: string) => {
  const location = memoryLocation({ path, record: true });
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Router hook={location.hook}>
        <Route path="/designs" component={DesignListPage} />
        <Route path="/designs/:id" component={DesignDetailPage} />
      </Router>
    </QueryClientProvider>,
  );
  return location.history;
};

const cellsWith = (text: string) =>
  [...document.querySelectorAll("[data-cell]")].filter((node) => node.textContent?.trim() === text);

describe("listado de diseños", () => {
  it("muestra cada diseño con su tipo, norma, elementos y estado", async () => {
    renderAt("/designs");
    const row = (await screen.findByText("1DAA26A54-CO CV")).closest("tr")!;
    expect(row.textContent).toContain("Convencionales · 1F");
    expect(row.textContent).toContain("NTE INEN 2120");
    expect(row.textContent).toContain("Ecuador");
    expect(row.textContent).toContain("1-25-220-120-CV-CT-NTCA-CO-ST");
    expect(row.textContent).toContain("Desactualizado");
  });

  it("combina filtros y cada cambio vuelve a la página 1", async () => {
    renderAt("/designs");
    await screen.findByText("1DAA26A54-CO CV");
    fireEvent.change(screen.getByLabelText("Norma"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Desactualizado"), { target: { value: "true" } });
    fireEvent.change(screen.getByLabelText("Lista de materiales"), { target: { value: "false" } });
    fireEvent.change(screen.getByLabelText("Código o nombre"), { target: { value: "1DAA" } });
    await waitFor(() =>
      expect(mocks.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1, normId: 3, stale: true, adjusted: false, search: "1DAA" }),
      ),
    );
    fireEvent.change(screen.getByLabelText("Desactualizado"), { target: { value: "" } });
    await waitFor(() => expect(mocks.list.mock.lastCall![0].stale).toBeUndefined());
  });

  it("abre el detalle al elegir un diseño", async () => {
    const history = renderAt("/designs");
    fireEvent.click(await screen.findByText("1DAA26A54-CO CV"));
    await waitFor(() => expect(history.at(-1)).toBe("/designs/28"));
  });
});

describe("detalle de un diseño", () => {
  it("resumen: elementos con norma, características y accesorios, y versiones de fórmulas", async () => {
    renderAt("/designs/28");
    expect(await screen.findByText("1-25-220-120-CV-CT-NTCA-CO-ST")).toBeTruthy();
    expect(screen.getByText("Potencia")).toBeTruthy();
    expect(within(screen.getByRole("table", { name: "Accesorios" })).getByText("06010504")).toBeTruthy();
    await waitFor(() => expect(screen.getByText(/calculada con v2 · vigente v3/)).toBeTruthy());
    expect(screen.getByText("— no es la vigente")).toBeTruthy();
  });

  it("las hojas se ven con sus valores calculados y no se pueden editar", async () => {
    renderAt("/designs/28");
    fireEvent.click(await screen.findByRole("tab", { name: "Hojas de diseño" }));
    await waitFor(() => expect(cellsWith("3").length).toBeGreaterThan(0));
    const cell = cellsWith("3")[0]!;
    fireEvent.mouseDown(cell);
    fireEvent.doubleClick(cell);
    expect(document.querySelector("[data-cell] input, [data-cell] textarea")).toBeNull();
    expect(screen.getByLabelText("Celda elegida").textContent).toContain("=1+2");
  });

  it("los costos tienen su propia pestaña", async () => {
    renderAt("/designs/28");
    fireEvent.click(await screen.findByRole("tab", { name: "Costos" }));
    await waitFor(() => expect(cellsWith("100").length).toBe(1));
  });

  it("sin ajuste, la lista se genera como la ve el cliente y despliega sus hijos", async () => {
    renderAt("/designs/28");
    fireEvent.click(await screen.findByRole("tab", { name: "Lista de materiales" }));
    await waitFor(() => expect(cellsWith("Fibra de 2 mm").length).toBe(1));
    expect(mocks.searchByCode).toHaveBeenCalledWith("1-25-220-120-CV-CT-NTCA-CO-ST");
    expect(screen.getByText(/Generada desde la plantilla/)).toBeTruthy();
    expect(cellsWith("Indicador nivel aceite").length).toBe(1);
    fireEvent.mouseDown(cellsWith("▶")[0]!);
    await waitFor(() => expect(cellsWith("▼").length).toBe(1));
  });

  it("con ajuste, muestra la del cliente marcada y avisa si la generada cambió", async () => {
    mocks.getBomAdjustment.mockResolvedValue({
      designId: 28,
      bomId: 2,
      baseFingerprint: "a".repeat(64),
      cells: { B1: { value: "Semielaborado : Bobina", formula: "", computed: "" }, B3: { value: "999", formula: "999", computed: "999" } },
      expandedNodes: [],
      updatedBy: "disenador@rymel",
      updatedAt: "2026-10-27T15:00:00Z",
    });
    renderAt("/designs/28");
    fireEvent.click(await screen.findByRole("tab", { name: "Lista de materiales" }));
    expect(await screen.findByText(/Ajustada por el cliente \(disenador@rymel\)/)).toBeTruthy();
    expect(screen.getByText(/La lista generada cambió/)).toBeTruthy();
    await waitFor(() => expect(cellsWith("999").length).toBe(1));
    expect(screen.queryByText(/Guardar|Borrar ajuste|Descartar/)).toBeNull();
  });

  it("desactivar pide confirmación: cancelar no hace nada, confirmar vuelve al listado", async () => {
    const history = renderAt("/designs/28");
    fireEvent.click(await screen.findByRole("button", { name: /Desactivar/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(mocks.deactivate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Desactivar/ }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Desactivar" }));
    await waitFor(() => expect(mocks.deactivate).toHaveBeenCalledWith(28));
    await waitFor(() => expect(history.at(-1)).toBe("/designs"));
  });

  it("recalcular solo se aplica después de simular", async () => {
    renderAt("/designs/28");
    fireEvent.click(await screen.findByRole("button", { name: /Recalcular/ }));
    expect(screen.queryByRole("button", { name: "Aplicar" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Simular" }));
    await waitFor(() => expect(mocks.recalculate).toHaveBeenLastCalledWith(28, true));
    expect(await screen.findByText(/B2: 3 → 4/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));
    await waitFor(() => expect(mocks.recalculate).toHaveBeenLastCalledWith(28, false));
    expect(await screen.findByText(/^Recalculado\./)).toBeTruthy();
  });

  it("sin hojas desactualizadas no se ofrece recalcular", async () => {
    mocks.getVersions.mockResolvedValue([{ ...VERSIONS[0], stale: false }]);
    renderAt("/designs/28");
    await screen.findByText(/Al día/);
    expect(screen.queryByRole("button", { name: /Recalcular/ })).toBeNull();
  });

  it("exporta con las hojas del diseño, los costos y la lista de materiales", async () => {
    renderAt("/designs/28");
    fireEvent.click(await screen.findByRole("tab", { name: "Lista de materiales" }));
    await waitFor(() => expect(cellsWith("Fibra de 2 mm").length).toBe(1));
    fireEvent.click(screen.getByRole("button", { name: /Exportar a Excel/ }));
    await waitFor(() => expect(mocks.download).toHaveBeenCalled());
    const [design, bom] = mocks.download.mock.lastCall!;
    expect(design.id).toBe(28);
    expect(bom.name).toBe("Lista de materiales");
    expect(JSON.stringify(bom.sheet.cells)).toContain("Fibra de 2 mm");
  });
});
