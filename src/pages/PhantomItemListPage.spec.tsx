/**
 * El listado de fantasmas, una pestaña por proceso como las hojas del libro.
 */

/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PhantomProcess } from "@/types/phantom-item.types";

const mocks = vi.hoisted(() => ({
  getPhantomItems: vi.fn(),
  exportPhantomItems: vi.fn(),
  downloadTemplate: vi.fn(),
  deletePhantomItems: vi.fn(),
  listProcesses: vi.fn(),
}));

vi.mock("@services/phantomItemService", () => ({
  phantomItemService: {
    getPhantomItems: mocks.getPhantomItems,
    exportPhantomItems: mocks.exportPhantomItems,
    downloadTemplate: mocks.downloadTemplate,
    deletePhantomItems: mocks.deletePhantomItems,
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@services/phantomProcessService", () => ({
  phantomProcessService: { list: mocks.listProcesses },
}));
vi.mock("@components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@store/authStore", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: { roles: ["ADMIN"] } }),
}));

import { PhantomItemListPage } from "./PhantomItemListPage";

const PROCESSES: PhantomProcess[] = [
  { id: 2, name: "EMBLEMADO", position: 0, referenceSeparator: "", columns: [], families: [], phantomItemsCount: 31 },
  {
    id: 3,
    name: "ALISTAMIENTO Y ENCUBE",
    position: 1,
    referenceSeparator: "",
    columns: [],
    families: [
      { id: 7, name: "F. Acc Alis", phantomItemsCount: 40 },
      { id: 8, name: "F.Acc Enc", phantomItemsCount: 36 },
    ],
    phantomItemsCount: 76,
  },
];

const item = (id: number, itemCode: string, familyName: string | null) => ({
  id,
  itemCode,
  familyName,
  reference: `F-${itemCode}`,
  shortDescription: "FANTASMA KIT ALIS",
  finishedProductType: "1CV",
  workInProcessType: "EEN",
  phantomRootCode: "KIT ALIS",
  componentsCount: 8,
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PhantomItemListPage />
    </QueryClientProvider>,
  );

const lastFilters = () => mocks.getPhantomItems.mock.calls.at(-1)?.[0];

beforeEach(() => {
  mocks.listProcesses.mockReset().mockResolvedValue(PROCESSES);
  mocks.getPhantomItems.mockReset().mockImplementation(async (filters: { processId?: number }) => ({
    data:
      filters.processId === 3
        ? [item(1, "500414", "F. Acc Alis"), item(3, "500415", "F. Acc Alis"), item(4, "500478", "F.Acc Enc")]
        : [item(2, "500190", null)],
    total: 1,
    page: 1,
    limit: 10,
  }));
  mocks.exportPhantomItems.mockReset().mockResolvedValue(undefined);
  mocks.deletePhantomItems.mockReset().mockImplementation(async (ids: number[]) => ({ deleted: ids.length }));
});

const openAlistamiento = async () => {
  renderPage();
  fireEvent.click(await screen.findByRole("tab", { name: /ALISTAMIENTO/ }));
  await screen.findByText("500414");
};

describe("PhantomItemListPage", () => {
  it("shows one tab per process, in order, with its count, and opens on the first", async () => {
    renderPage();

    const tabs = await screen.findAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["EMBLEMADO31", "ALISTAMIENTO Y ENCUBE76"]);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    await waitFor(() => expect(lastFilters()).toMatchObject({ processId: 2 }));
  });

  it("lists the chosen process's phantom items with their family", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("tab", { name: /ALISTAMIENTO/ }));

    await screen.findByText("500414");
    expect(lastFilters()).toMatchObject({ processId: 3, page: 1 });
    const row = screen.getByText("500414").closest("tr")!;
    expect(within(row).getByText("F. Acc Alis")).toBeTruthy();
  });

  it("filters by a family of the process", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("tab", { name: /ALISTAMIENTO/ }));
    await screen.findByText("500414");

    fireEvent.click(screen.getByRole("button", { name: "Todas las familias" }));
    fireEvent.click(screen.getByRole("button", { name: "F.Acc Enc (36)" }));

    await waitFor(() => expect(lastFilters()).toMatchObject({ processId: 3, familyId: 8 }));
  });

  it("forgets the family when switching process", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("tab", { name: /ALISTAMIENTO/ }));
    await screen.findByText("500414");
    fireEvent.click(screen.getByRole("button", { name: "Todas las familias" }));
    fireEvent.click(screen.getByRole("button", { name: "F.Acc Enc (36)" }));
    await waitFor(() => expect(lastFilters()).toMatchObject({ familyId: 8 }));

    fireEvent.click(screen.getByRole("tab", { name: /EMBLEMADO/ }));

    await waitFor(() => expect(lastFilters()).toMatchObject({ processId: 2 }));
    expect(lastFilters().familyId).toBeUndefined();
  });

  it("exports the whole workbook, or only the process on screen", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("tab", { name: /ALISTAMIENTO/ }));
    await screen.findByText("500414");

    fireEvent.click(screen.getByRole("button", { name: /Exportar libro/ }));
    await waitFor(() => expect(mocks.exportPhantomItems).toHaveBeenCalledTimes(1));
    expect(mocks.exportPhantomItems.mock.calls[0][0]).toEqual({});

    fireEvent.click(screen.getByRole("button", { name: /Exportar proceso/ }));
    await waitFor(() => expect(mocks.exportPhantomItems).toHaveBeenCalledTimes(2));
    expect(mocks.exportPhantomItems.mock.calls[1][0]).toMatchObject({ processId: 3 });
    expect(mocks.exportPhantomItems.mock.calls[1][2]).toBe("fantasmas-ALISTAMIENTO Y ENCUBE.xlsx");
  });

  describe("deleting", () => {
    it("deletes one from its row, after naming it", async () => {
      await openAlistamiento();

      fireEvent.click(screen.getByRole("button", { name: "Eliminar 500415" }));
      const dialog = screen.getByRole("dialog", { name: "Eliminar fantasma" });
      expect(dialog.textContent).toContain("500415");
      expect(mocks.deletePhantomItems).not.toHaveBeenCalled();

      fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" }));

      await waitFor(() => expect(mocks.deletePhantomItems).toHaveBeenCalledWith([3]));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("the row's delete button does not open the editor", async () => {
      await openAlistamiento();

      fireEvent.click(screen.getByRole("button", { name: "Eliminar 500415" }));

      expect(window.location.pathname).not.toContain("/phantom-items/3");
    });

    it("deletes the selected ones together", async () => {
      await openAlistamiento();

      fireEvent.click(screen.getByLabelText("Seleccionar 500414"));
      fireEvent.click(screen.getByLabelText("Seleccionar 500478"));
      expect(screen.getByText("2 fantasmas seleccionados")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: /Eliminar seleccionados/ }));
      const dialog = screen.getByRole("dialog", { name: "Eliminar 2 fantasmas" });
      expect(dialog.textContent).toContain("500414, 500478");

      fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar 2" }));

      await waitFor(() => expect(mocks.deletePhantomItems).toHaveBeenCalledWith([1, 4]));
      await waitFor(() => expect(screen.queryByText(/seleccionados/)).toBeNull());
    });

    it("selects the whole page at once", async () => {
      await openAlistamiento();

      fireEvent.click(screen.getByLabelText("Seleccionar todos los de esta página"));

      expect(screen.getByText("3 fantasmas seleccionados")).toBeTruthy();
      fireEvent.click(screen.getByLabelText("Seleccionar todos los de esta página"));
      expect(screen.queryByText(/seleccionados/)).toBeNull();
    });

    it("forgets the selection when switching process, so nothing off screen is deleted", async () => {
      await openAlistamiento();
      fireEvent.click(screen.getByLabelText("Seleccionar 500414"));

      fireEvent.click(screen.getByRole("tab", { name: /EMBLEMADO/ }));
      await screen.findByText("500190");
      fireEvent.click(screen.getByRole("tab", { name: /ALISTAMIENTO/ }));
      await screen.findByText("500414");

      expect(screen.queryByText(/seleccionado/)).toBeNull();
      expect((screen.getByLabelText("Seleccionar 500414") as HTMLInputElement).checked).toBe(false);
    });

    it("keeps the dialog open if the server refuses", async () => {
      mocks.deletePhantomItems.mockRejectedValueOnce(new Error("404"));
      await openAlistamiento();

      fireEvent.click(screen.getByRole("button", { name: "Eliminar 500415" }));
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));

      await waitFor(() => expect(mocks.deletePhantomItems).toHaveBeenCalled());
      expect(screen.getByRole("dialog", { name: "Eliminar fantasma" })).toBeTruthy();
    });
  });
});
