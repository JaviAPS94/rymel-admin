/**
 * La sección de lista de materiales, montada, con los servicios simulados y
 * los datos reales del diseño 28 (`sub_design` 90).
 */

/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import cases from "@components/bom-summary/__fixtures__/client-bom-cases.json";

type Case = {
  sheets: unknown[];
  bom: { nodes: unknown[] };
  element: { values: string };
  cells: Record<string, { value?: string }>;
};
const real = (cases as unknown as Record<string, Case>)["sub_design 90 · plegado"]!;

const mocks = vi.hoisted(() => ({
  bomReview: vi.fn(),
  getById: vi.fn(),
  getBomAdjustment: vi.fn(),
  searchByCode: vi.fn(),
}));

vi.mock("@services/designService", () => ({
  designService: {
    bomReview: mocks.bomReview,
    getById: mocks.getById,
    getBomAdjustment: mocks.getBomAdjustment,
  },
}));
vi.mock("@services/bomService", () => ({
  bomService: { searchByCode: mocks.searchByCode },
}));
vi.mock("@components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { DesignBomPage } from "./DesignBomPage";
import { bomFingerprint } from "@components/bom-summary/bomFingerprint";

const element = (id: number, sapReference: string | null) => ({
  id,
  element: { id, sapReference, values: real.element.values },
});

const DESIGN_28 = {
  id: 28,
  code: "1DAA26A54-CO CV",
  name: "28",
  createdAt: "",
  designSubType: { id: 1, name: "1F" },
  designElements: [element(1, "1-25-220-120-CV-CT-NTCA-CO-ST"), element(2, "3-100-100-100-CV-CVT-NTCA-CO-ST")],
  subDesigns: [{ id: 90, name: "Hoja1", code: "h", data: real.sheets[0] }],
};
const SIN_REFERENCIA = { ...DESIGN_28, id: 5, code: "SIN-REF", designElements: [element(3, null)] };

const BOM = { id: 2, code: "1-25-220-120", name: "Estructura de prueba", nodes: real.bom.nodes };

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

/** Las celdas pintadas con ese texto. */
const cellsWith = (text: string) =>
  [...document.querySelectorAll("[data-cell]")].filter((node) => node.textContent?.trim() === text);
const cellAt = (ref: string) => document.querySelector(`[data-cell="${ref}"]`) as HTMLElement;
const sheetReady = () => waitFor(() => expect(cellsWith("Fibra de 2 mm").length).toBeGreaterThan(0));

const reviewRow = (design: typeof DESIGN_28, status: string, adjustment: unknown = null) => ({
  id: design.id,
  code: design.code,
  name: design.name,
  createdAt: "2026-10-01T00:00:00Z",
  country: "Ecuador",
  elements: design.designElements.map(({ element: e }) => ({
    id: e.id,
    sapReference: e.sapReference ?? undefined,
    normId: 1,
    normName: "NTE INEN 2120",
  })),
  status,
  adjustment,
});

beforeEach(() => {
  mocks.bomReview.mockReset().mockResolvedValue({
    data: [reviewRow(DESIGN_28, "generable"), reviewRow(SIN_REFERENCIA, "no-reference")],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
    norms: [{ id: 1, name: "NTE INEN 2120" }],
  });
  mocks.getBomAdjustment.mockReset().mockResolvedValue(null);
  mocks.getById.mockReset().mockImplementation(async (id: number) => (id === 28 ? DESIGN_28 : SIN_REFERENCIA));
  mocks.searchByCode
    .mockReset()
    .mockImplementation(async (code: string) => (code.startsWith("1-25-220-120") ? BOM : null));
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <DesignBomPage />
    </QueryClientProvider>,
  );

const choose = async (code: string) => fireEvent.click(await screen.findByText(code));

describe("lista de materiales por diseño", () => {
  it("arma la lista del diseño elegido con la estructura de su referencia", async () => {
    renderPage();
    await choose("1DAA26A54-CO CV");

    await sheetReady();
    expect(mocks.searchByCode).toHaveBeenCalledWith("1-25-220-120-CV-CT-NTCA-CO-ST");
    expect(screen.getByText(/Estructura/).textContent).toContain("1-25-220-120");
  });

  it("despliega y pliega un semielaborado hijo pulsando su celda ▶/▼", async () => {
    renderPage();
    await choose("1DAA26A54-CO CV");
    await sheetReady();

    const before = cellsWith("Fibra de 2 mm").length;
    fireEvent.mouseDown(cellsWith("▶")[0]!);
    await waitFor(() => expect(cellsWith("Fibra de 2 mm").length).toBe(before + 1));
    fireEvent.mouseDown(cellsWith("▼")[0]!);
    await waitFor(() => expect(cellsWith("Fibra de 2 mm").length).toBe(before));
  });

  it("se edita como una hoja, con fórmulas, y la exportación lleva lo editado", async () => {
    renderPage();
    await choose("1DAA26A54-CO CV");
    await sheetReady();

    // D3 es la cantidad del ítem vinculado: se cambia por una fórmula.
    fireEvent.doubleClick(cellAt("D3"));
    const input = cellAt("D3").querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "=3*4" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(cellAt("D3").textContent).toContain("12"));

    let csv = "";
    URL.createObjectURL = vi.fn((blob: Blob) => {
      void blob.text().then((text) => (csv = text));
      return "blob:lista";
    }) as never;
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByText("Exportar CSV"));
    await waitFor(() => expect(csv).toContain(";240;Fibra de 2 mm;12;"));
  });

  it("con varios elementos usa el primero y deja elegir otro", async () => {
    renderPage();
    await choose("1DAA26A54-CO CV");
    await sheetReady();
    fireEvent.change(screen.getByLabelText("Elemento"), { target: { value: "1" } });
    expect(
      await screen.findByText(/No se encontró estructura BOM para la referencia ERP/),
    ).toBeTruthy();
    expect(mocks.searchByCode).toHaveBeenLastCalledWith("3-100-100-100-CV-CVT-NTCA-CO-ST");
  });

  it("explica que un elemento sin referencia ERP no puede generarla", async () => {
    renderPage();
    await choose("SIN-REF");
    expect(await screen.findByText(/no tiene referencia ERP configurada/)).toBeTruthy();
    expect(mocks.searchByCode).not.toHaveBeenCalled();
  });

  it("desplegar rearma la hoja: lo editado se pierde, como en el cliente", async () => {
    renderPage();
    await choose("1DAA26A54-CO CV");
    await sheetReady();

    fireEvent.doubleClick(cellAt("D3"));
    const input = cellAt("D3").querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "99" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => expect(cellAt("D3").textContent).toContain("99"));

    fireEvent.mouseDown(cellsWith("▶")[0]!);
    await waitFor(() => expect(cellAt("D3").textContent).toContain("3"));
    expect(cellAt("D3").textContent).not.toContain("99");
  });
});

describe("listado para revisar", () => {
  it("sin búsqueda por código, con estado y norma por diseño", async () => {
    renderPage();
    expect(await screen.findByText("1DAA26A54-CO CV")).toBeTruthy();
    expect(screen.queryByPlaceholderText(/código/i)).toBeNull();
    expect(screen.getByRole("button", { name: /1DAA26A54-CO CV/ }).textContent).toContain("Generable");
    expect(screen.getAllByText(/NTE INEN 2120/).length).toBeGreaterThan(0);
  });

  it("filtra por estado y por norma, y vuelve a la primera página", async () => {
    renderPage();
    await screen.findByText("1DAA26A54-CO CV");
    fireEvent.change(screen.getByLabelText("Estado de la lista"), { target: { value: "adjusted" } });
    await waitFor(() =>
      expect(mocks.bomReview).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "adjusted", page: 1 }),
      ),
    );
    fireEvent.change(screen.getByLabelText("Norma"), { target: { value: "1" } });
    await waitFor(() =>
      expect(mocks.bomReview).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "adjusted", normId: 1 }),
      ),
    );
  });
});

describe("lista ajustada por el cliente", () => {
  /** La lista generada, con una cantidad cambiada, una fila añadida y un accesorio quitado. */
  const adjustedCells = () => {
    const cells: Record<string, { value?: string; computed?: string | number }> = JSON.parse(
      JSON.stringify(real.cells),
    );
    cells.D3 = { value: "5", computed: 5 };
    const accessoryRow = Object.entries(cells).find(([, cell]) => cell.value === "501")![0].slice(1);
    for (const column of "BCDEFGHI") delete cells[`${column}${accessoryRow}`];
    const last = Math.max(...Object.keys(cells).map((ref) => Number(ref.slice(1))));
    cells[`B${last + 1}`] = { value: "999" };
    cells[`C${last + 1}`] = { value: "Ítem nuevo" };
    return cells;
  };

  const withAdjustment = async (baseFingerprint?: string) => {
    mocks.getBomAdjustment.mockResolvedValue({
      designId: 28,
      bomId: BOM.id,
      baseFingerprint: baseFingerprint ?? (await bomFingerprint(real.cells as never)),
      cells: adjustedCells(),
      expandedNodes: [],
      updatedBy: "disenador@rymel",
      updatedAt: "2026-10-27T15:00:00Z",
    });
  };

  it("compara con la generada: cambiada, añadida y quitada, en solo lectura", async () => {
    await withAdjustment();
    renderPage();
    await choose("1DAA26A54-CO CV");

    expect(await screen.findByText(/Ajustada por el cliente \(disenador@rymel\)/)).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByLabelText("Resumen de cambios").textContent).toBe(
        "1 fila(s) cambiada(s) · 1 añadida(s) · 1 quitada(s)",
      ),
    );

    const adjusted = screen.getByRole("table", { name: "Ajustada por el cliente" });
    const changed = adjusted.querySelector('[data-status="changed"]')!;
    expect(changed.textContent).toContain("240");
    expect(changed.querySelector("[data-changed]")!.textContent).toBe("5");
    expect(adjusted.querySelector('[data-status="added"]')!.textContent).toContain("999");
    const generated = screen.getByRole("table", { name: "Generada ahora" });
    expect(generated.querySelector('[data-status="removed"]')!.textContent).toContain("501");

    // Nada que escribir ni que guardar o borrar: tablas, no la hoja editable
    expect(document.querySelector("[data-cell]")).toBeNull();
    for (const table of screen.getAllByRole("table")) {
      expect(table.querySelector("input, textarea, [contenteditable]")).toBeNull();
    }
    expect(screen.queryByText(/Guardar|Borrar|Descartar/)).toBeNull();
    expect(screen.queryByText(/cambió desde que el cliente/)).toBeNull();
  });

  it("avisa si la lista generada cambió desde el ajuste", async () => {
    await withAdjustment("a".repeat(64));
    renderPage();
    await choose("1DAA26A54-CO CV");
    expect(await screen.findByText(/La lista generada cambió desde que el cliente/)).toBeTruthy();
  });

  it("exporta la ajustada con lo que guardó el cliente", async () => {
    await withAdjustment();
    let csv = "";
    let name = "";
    URL.createObjectURL = vi.fn((blob: Blob) => {
      void blob.text().then((text) => (csv = text));
      return "blob:lista";
    }) as never;
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      name = this.download;
    });
    renderPage();
    await choose("1DAA26A54-CO CV");
    fireEvent.click(await screen.findByText("Exportar ajustada"));
    await waitFor(() => expect(csv).toContain(";240;Fibra de 2 mm;5;"));
    expect(name).toContain("ajustada");
  });
});
