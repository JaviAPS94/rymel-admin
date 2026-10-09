/**
 * La sección de lista de materiales, montada, con los servicios simulados y
 * los datos reales del diseño 28 (`sub_design` 90).
 */

/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import cases from "@components/bom-summary/__fixtures__/client-bom-cases.json";

const real = (cases as Record<string, { sheets: unknown[]; bom: { nodes: unknown[] }; element: { values: string } }>)[
  "sub_design 90 · plegado"
];

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  getById: vi.fn(),
  searchByCode: vi.fn(),
}));

vi.mock("@services/designService", () => ({
  designService: { list: mocks.list, getById: mocks.getById },
}));
vi.mock("@services/bomService", () => ({
  bomService: { searchByCode: mocks.searchByCode },
}));
vi.mock("@components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { DesignBomPage } from "./DesignBomPage";

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

beforeEach(() => {
  mocks.list.mockReset().mockResolvedValue({
    data: [DESIGN_28, SIN_REFERENCIA],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
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
