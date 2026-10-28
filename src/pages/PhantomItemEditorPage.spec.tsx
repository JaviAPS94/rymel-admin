/**
 * El editor de un fantasma con su proceso: familia, columnas propias de
 * cabecera (PLAN/MAYOR) y de línea, y lo que se envía al guardar.
 */

/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { COLUMNS } from "@components/phantom-item/columns";
import {
  ProcessColumnScope,
  type PhantomItemDetail,
  type PhantomProcess,
} from "@/types/phantom-item.types";

const mocks = vi.hoisted(() => ({
  getPhantomItem: vi.fn(),
  updatePhantomItem: vi.fn(),
  createPhantomItem: vi.fn(),
  deletePhantomItems: vi.fn(),
  listProcesses: vi.fn(),
}));

vi.mock("@services/phantomItemService", () => ({
  phantomItemService: {
    getPhantomItem: mocks.getPhantomItem,
    updatePhantomItem: mocks.updatePhantomItem,
    createPhantomItem: mocks.createPhantomItem,
    deletePhantomItems: mocks.deletePhantomItems,
  },
}));
vi.mock("@services/phantomProcessService", () => ({
  phantomProcessService: { list: mocks.listProcesses },
}));
vi.mock("@components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@store/authStore", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: { roles: ["ADMIN"] } }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { PhantomItemEditorPage } from "./PhantomItemEditorPage";

const catalog = COLUMNS.map((column) => ({
  key: column.field,
  header: column.header,
  scope: column.scope === "component" ? ProcessColumnScope.COMPONENT : ProcessColumnScope.HEADER,
}));

const PROCESSES: PhantomProcess[] = [
  { id: 1, name: "General", position: 0, referenceSeparator: "", columns: catalog, families: [], phantomItemsCount: 1 },
  {
    id: 3,
    name: "ALISTAMIENTO Y ENCUBE",
    position: 1,
    // Its sheet's formula: CONCATENATE("F-",C,"-",D,"-",E," ",F)
    referenceSeparator: " ",
    columns: [
      ...catalog,
      { key: "custom:plan1", header: "PLAN1", scope: ProcessColumnScope.HEADER },
      { key: "custom:lote", header: "LOTE", scope: ProcessColumnScope.COMPONENT },
    ],
    families: [{ id: 7, name: "F. Acc Alis", phantomItemsCount: 40 }],
    phantomItemsCount: 76,
  },
];

/** 500414 as the real workbook has it, with a lot on its first line */
const DETAIL: PhantomItemDetail = {
  id: 9,
  processId: 3,
  familyId: 7,
  familyName: "F. Acc Alis",
  extraValues: { "custom:plan1": "1 / CLASE DE ITEM" },
  finishedProductType: "1AU",
  workInProcessType: "EEN",
  phantomRootCode: "KIT ALIS",
  kvaRatingStandard: "0-75 KVA GT",
  itemCode: "500414",
  reference: "F-1AU-EEN-KIT ALIS 0-75 KVA GT",
  itemDescription: "F-1AU-EEN-KIT ALIS 0-75 KVA GT",
  shortDescription: "FANTASMA KIT ALIS",
  unitOfMeasure: "UND",
  referenceLengthLimit: 40,
  referenceLength: 30,
  itemDescriptionLength: 30,
  shortDescriptionLength: 17,
  formulaOverrides: {},
  componentsCount: 2,
  components: [
    {
      id: 1,
      sortOrder: 0,
      componentItemCode: "211",
      description: "PARARRAYO POLIMERICO 10 KV - 10KA",
      baseQuantity: 1,
      requiredQuantity: 1,
      formulaOverrides: {},
      extraValues: { "custom:lote": "L-77" },
    },
    {
      id: 2,
      sortOrder: 1,
      componentItemCode: "3045",
      baseQuantity: 1,
      requiredQuantity: 2,
      formulaOverrides: {},
      extraValues: {},
    },
  ],
};

let history: string[] = [];

const renderAt = (path: string) => {
  const { hook, searchHook, history: visited } = memoryLocation({ path, record: true });
  history = visited;
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <Router hook={hook} searchHook={searchHook}>
        <Route path="/phantom-items/:id" component={PhantomItemEditorPage} />
      </Router>
    </QueryClientProvider>,
  );
};

const save = async () => {
  fireEvent.click(screen.getByRole("button", { name: /Guardar/ }));
  await waitFor(() => expect(mocks.updatePhantomItem).toHaveBeenCalled());
  return mocks.updatePhantomItem.mock.calls[0][1];
};

beforeEach(() => {
  mocks.listProcesses.mockReset().mockResolvedValue(PROCESSES);
  mocks.getPhantomItem.mockReset().mockResolvedValue(DETAIL);
  mocks.updatePhantomItem.mockReset().mockResolvedValue(DETAIL);
  mocks.createPhantomItem.mockReset();
});

describe("PhantomItemEditorPage", () => {
  it("shows the process, the family and the own header columns", async () => {
    renderAt("/phantom-items/9");

    expect(((await screen.findByLabelText("PLAN1")) as HTMLInputElement).value).toBe("1 / CLASE DE ITEM");
    expect((screen.getByLabelText("Familia") as HTMLInputElement).value).toBe("F. Acc Alis");
    expect(screen.getByRole("button", { name: "ALISTAMIENTO Y ENCUBE" })).toBeTruthy();
  });

  it("shows the process's own line column in the grid, with its values", async () => {
    renderAt("/phantom-items/9");
    await screen.findByLabelText("PLAN1");

    expect(screen.getByTitle("LOTE").textContent).toBe("ULOTE");
    expect(screen.getByText("L-77")).toBeTruthy();
  });

  it("calculates the reference with the process's rule, as its sheet does", async () => {
    renderAt("/phantom-items/9");
    await screen.findByLabelText("PLAN1");

    expect(screen.getAllByText("F-1AU-EEN-KIT ALIS 0-75 KVA GT").length).toBeGreaterThan(0);
    const payload = await save();
    expect(payload.reference).toBe("F-1AU-EEN-KIT ALIS 0-75 KVA GT");
    // The process's rule, not an own formula of this phantom item
    expect(payload.formulaOverrides.reference).toBeUndefined();
  });

  it("saves the process, the family and the own values", async () => {
    renderAt("/phantom-items/9");
    fireEvent.change(await screen.findByLabelText("PLAN1"), { target: { value: "2 / CLASE DE ITEM" } });

    const payload = await save();

    expect(payload).toMatchObject({
      processId: 3,
      familyName: "F. Acc Alis",
      extraValues: { "custom:plan1": "2 / CLASE DE ITEM" },
    });
    expect(payload.components.map((component: { extraValues: unknown }) => component.extraValues)).toEqual([
      { "custom:lote": "L-77" },
      { "custom:lote": "" },
    ]);
  });

  it("clears the family when it is emptied", async () => {
    renderAt("/phantom-items/9");
    fireEvent.change(await screen.findByLabelText("Familia"), { target: { value: "  " } });

    const payload = await save();

    expect(payload.familyId).toBeNull();
    expect(payload.familyName).toBeUndefined();
  });

  it("moving to another process drops the family and the old process's columns", async () => {
    renderAt("/phantom-items/9");
    await screen.findByLabelText("PLAN1");

    fireEvent.click(screen.getByRole("button", { name: "ALISTAMIENTO Y ENCUBE" }));
    fireEvent.click(screen.getByRole("button", { name: "General" }));

    expect(screen.queryByLabelText("PLAN1")).toBeNull();
    expect(screen.queryByTitle("LOTE")).toBeNull();
    const payload = await save();
    expect(payload).toMatchObject({ processId: 1, familyId: null, extraValues: {} });
  });

  it("a new phantom item starts in the tab it was created from", async () => {
    renderAt("/phantom-items/new?process=3");

    expect(await screen.findByLabelText("PLAN1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "ALISTAMIENTO Y ENCUBE" })).toBeTruthy();
  });

  it("deletes the phantom item and goes back to the list", async () => {
    mocks.deletePhantomItems.mockResolvedValue({ deleted: 1 });
    renderAt("/phantom-items/9");
    await screen.findByLabelText("PLAN1");

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));
    const dialog = screen.getByRole("dialog", { name: "Eliminar fantasma" });
    expect(dialog.textContent).toContain("500414");
    fireEvent.click(within(dialog).getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(mocks.deletePhantomItems).toHaveBeenCalledWith([9]));
    await waitFor(() => expect(history.at(-1)).toBe("/phantom-items"));
  });

  it("offers no delete for a phantom item not saved yet", async () => {
    renderAt("/phantom-items/new?process=3");
    await screen.findByLabelText("PLAN1");

    expect(screen.queryByRole("button", { name: "Eliminar" })).toBeNull();
  });
});
