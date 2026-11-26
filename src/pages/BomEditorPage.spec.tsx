/**
 * Las familias de fantasmas en el árbol de la estructura y los tipos de
 * equipo que filtran lo que ofrecen.
 */

/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import type { BillOfMaterials, BomNodePhantomFamily } from "@/types/bom.types";
import type { PhantomProcess } from "@/types/phantom-item.types";

const mocks = vi.hoisted(() => ({
  getBom: vi.fn(),
  addPhantomFamilies: vi.fn(),
  removePhantomFamily: vi.fn(),
  setProductTypes: vi.fn(),
  getPhantomProductTypes: vi.fn(),
  getOfferedPhantomItems: vi.fn(),
  deleteNode: vi.fn(),
  listProcesses: vi.fn(),
}));

vi.mock("@services/bomService", () => ({ bomService: mocks }));
vi.mock("@services/phantomProcessService", () => ({
  phantomProcessService: { list: mocks.listProcesses },
}));
vi.mock("@services/semiFinishedService", () => ({ semiFinishedService: { getAll: vi.fn(async () => []) } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { BomEditorPage } from "./BomEditorPage";

const PROCESSES: PhantomProcess[] = [
  {
    id: 2,
    name: "EMBLEMADO",
    position: 0,
    referenceSeparator: "",
    columns: [],
    families: [{ id: 20, name: "F. Emblemas", phantomItemsCount: 106 }],
    phantomItemsCount: 106,
  },
  {
    id: 3,
    name: "ALISTAMIENTO Y ENCUBE",
    position: 1,
    referenceSeparator: "",
    columns: [],
    families: [
      { id: 30, name: "F. Acc Alis", phantomItemsCount: 31 },
      { id: 31, name: "F- Acc Ar", phantomItemsCount: 17 },
    ],
    phantomItemsCount: 48,
  },
  {
    id: 4,
    name: "ARMADO Y CONEXIÓN",
    position: 2,
    referenceSeparator: "",
    columns: [],
    families: [{ id: 40, name: "F- Acc Ar", phantomItemsCount: 13 }],
    phantomItemsCount: 13,
  },
];

const link = (id: number, familyId: number, offered: number): BomNodePhantomFamily => {
  const process = PROCESSES.find((p) => p.families.some((f) => f.id === familyId))!;
  const family = process.families.find((f) => f.id === familyId)!;
  return { id, family: { id: family.id, name: family.name }, process: { id: process.id, name: process.name }, offered };
};

/** BOBINA › ENSAMBLEFINAL, con las familias que se pidan en ENSAMBLEFINAL. */
const structure = (families: BomNodePhantomFamily[], productTypes: string[] = ["1CA", "3CATC"]): BillOfMaterials => ({
  id: 2,
  code: "1-25-220-120",
  name: "Estructura de prueba",
  createdAt: "",
  updatedAt: "",
  productTypes,
  nodes: [
    {
      id: 9,
      semiFinished: { id: 1, code: "BOBINA", name: "Bobina" },
      type: "STANDARD",
      parentId: null,
      phantomFamilies: [],
      children: [
        {
          id: 14,
          semiFinished: { id: 5, code: "ENSAMBLEFINAL", name: "EnsambleFinal" },
          type: "REFERENCE",
          parentId: 9,
          phantomFamilies: families,
          children: [],
        },
      ],
    },
  ],
});

const renderPage = () => {
  const location = memoryLocation({ path: "/bom/2" });
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Router hook={location.hook}>
        <Route path="/bom/:id" component={BomEditorPage} />
      </Router>
    </QueryClientProvider>,
  );
};

/** Despliega BOBINA y, si se pide, ENSAMBLEFINAL. */
const expand = async (both = true) => {
  fireEvent.click(await screen.findByRole("button", { name: "Expandir" }));
  if (both) fireEvent.click(await screen.findByRole("button", { name: "Expandir" }));
};

let current: BillOfMaterials;

beforeEach(() => {
  current = structure([link(100, 20, 22)]);
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.getBom.mockImplementation(async () => current);
  mocks.listProcesses.mockResolvedValue(PROCESSES);
  mocks.addPhantomFamilies.mockResolvedValue(undefined);
  mocks.removePhantomFamily.mockResolvedValue(undefined);
  mocks.getOfferedPhantomItems.mockResolvedValue([
    { id: 1, itemCode: "500190", reference: "F-1CA-TPI-KIT EMBLE", finishedProductType: "1CA", componentsCount: 12 },
    { id: 2, itemCode: "500235", reference: "F-3CATC-TPI-KIT EMBLE", finishedProductType: "3CATC", componentsCount: 11 },
  ]);
  mocks.getPhantomProductTypes.mockResolvedValue([
    { code: "1CA", count: 16 },
    { code: "1CV", count: 112 },
    { code: "3CATC", count: 6 },
  ]);
  mocks.setProductTypes.mockImplementation(async (_id: number, codes: string[]) => codes);
});

describe("familias de fantasmas en el árbol", () => {
  it("muestra la familia bajo su semielaborado, con su proceso y lo que ofrece", async () => {
    renderPage();
    await expand();
    const leaf = await screen.findByTestId("phantom-family-100");
    expect(leaf.textContent).toContain("F. Emblemas");
    expect(leaf.textContent).toContain("EMBLEMADO");
    expect(leaf.textContent).toContain("22 fantasmas");
  });

  it("marca la familia que no ofrece ningún fantasma", async () => {
    current = structure([link(101, 30, 0)]);
    renderPage();
    await expand();
    expect((await screen.findByTestId("phantom-family-101")).textContent).toContain(
      "sin fantasmas para los tipos de la estructura",
    );
  });

  it("agrega varias familias de una vez y deshabilita las ya agregadas", async () => {
    renderPage();
    await expand();
    fireEvent.click(await screen.findByText("ENSAMBLEFINAL"));
    fireEvent.click(screen.getByRole("button", { name: /Agregar fantasmas/ }));

    const already = await screen.findByLabelText("F. Emblemas · EMBLEMADO");
    expect((already as HTMLInputElement).disabled).toBe(true);
    expect((already as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByLabelText("F. Acc Alis · ALISTAMIENTO Y ENCUBE"));
    fireEvent.click(screen.getByLabelText("F- Acc Ar · ARMADO Y CONEXIÓN"));
    fireEvent.click(screen.getByRole("button", { name: "Agregar 2 familias" }));

    await waitFor(() => expect(mocks.addPhantomFamilies).toHaveBeenCalledWith(14, [30, 40]));
  });

  it("distingue la misma familia en dos procesos", async () => {
    renderPage();
    await expand();
    fireEvent.click(await screen.findByText("ENSAMBLEFINAL"));
    fireEvent.click(screen.getByRole("button", { name: /Agregar fantasmas/ }));
    fireEvent.change(await screen.findByPlaceholderText("Buscar familia o proceso..."), {
      target: { value: "acc ar" },
    });

    expect(screen.getByLabelText("F- Acc Ar · ALISTAMIENTO Y ENCUBE")).toBeTruthy();
    expect(screen.getByLabelText("F- Acc Ar · ARMADO Y CONEXIÓN")).toBeTruthy();
    expect(screen.queryByLabelText("F. Emblemas · EMBLEMADO")).toBeNull();
  });

  it("al seleccionar la familia muestra sus fantasmas y la deja quitar", async () => {
    renderPage();
    await expand();
    fireEvent.click(await screen.findByTestId("phantom-family-100"));

    expect(await screen.findByText("500190")).toBeTruthy();
    expect(mocks.getOfferedPhantomItems).toHaveBeenCalledWith(2, 20);
    expect(screen.getByText("Fantasmas que ofrece (2)")).toBeTruthy();
    // Una familia no tiene acciones de semielaborado
    expect(screen.queryByRole("button", { name: /Agregar hijo/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Ver en Fantasmas/ }).getAttribute("href")).toBe(
      "/phantom-items?process=2&family=20",
    );

    fireEvent.click(screen.getByRole("button", { name: /Quitar del árbol/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Quitar" }));
    await waitFor(() => expect(mocks.removePhantomFamily).toHaveBeenCalledWith(100));
  });

  it("al eliminar el semielaborado avisa de las familias que se van", async () => {
    renderPage();
    await expand(false);
    fireEvent.click(await screen.findByText("BOBINA"));
    fireEvent.click(screen.getByRole("button", { name: /Eliminar nodo/ }));
    expect((await screen.findByText(/Se quitarán 1 familia/)).textContent).toContain("BOBINA");
  });
});

describe("tipos de equipo de la estructura", () => {
  it("se ven en la cabecera y se cambian con los tipos que existen", async () => {
    renderPage();
    expect(await screen.findByText("3CATC")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Editar tipos de equipo" }));
    const dialog = (await screen.findByText("Tipos de equipo de la estructura")).closest("div")!.parentElement!;
    await within(dialog).findByLabelText("1CV");
    fireEvent.click(within(dialog).getByLabelText("3CATC"));
    fireEvent.click(within(dialog).getByLabelText("1CV"));
    fireEvent.click(within(dialog).getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(mocks.setProductTypes).toHaveBeenCalledWith(2, ["1CA", "1CV"]));
  });

  it("cambiar los tipos actualiza los contadores del árbol sin recargar", async () => {
    renderPage();
    await expand();
    expect((await screen.findByTestId("phantom-family-100")).textContent).toContain("22 fantasmas");

    current = structure([link(100, 20, 16)], ["1CA"]);
    fireEvent.click(screen.getByRole("button", { name: "Editar tipos de equipo" }));
    fireEvent.click(await screen.findByLabelText("3CATC"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(screen.getByTestId("phantom-family-100").textContent).toContain("16 fantasmas"));
  });

  it("sin tipos avisa que se ofrecen todos", async () => {
    current = structure([], []);
    renderPage();
    expect(await screen.findByText("Sin tipos de equipo: se ofrecen todos los fantasmas")).toBeTruthy();
  });

  it("un tipo de la estructura que ya ningún fantasma tiene se conserva y se marca", async () => {
    current = structure([], ["1CA", "3SEH-1,2"]);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Editar tipos de equipo" }));

    const orphan = await screen.findByLabelText("3SEH-1,2");
    expect((orphan as HTMLInputElement).checked).toBe(true);
    expect(orphan.closest("label")!.textContent).toContain("sin fantasmas");
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(mocks.setProductTypes).toHaveBeenCalledWith(2, ["1CA", "3SEH-1,2"]));
  });
});
