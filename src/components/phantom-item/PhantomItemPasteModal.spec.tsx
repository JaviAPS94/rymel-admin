/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProcessColumnScope, type ImportResult, type PhantomProcess } from "@/types/phantom-item.types";

const mocks = vi.hoisted(() => ({ importPasted: vi.fn() }));

vi.mock("@services/phantomItemService", () => ({
  phantomItemService: { importPasted: mocks.importPasted },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { PhantomItemPasteModal } from "./PhantomItemPasteModal";

const PROCESS: PhantomProcess = {
  id: 3,
  name: "ALISTAMIENTO Y ENCUBE",
  position: 1,
  referenceSeparator: "",
  families: [],
  phantomItemsCount: 76,
  columns: [
    { key: "itemCode", header: "Item", scope: ProcessColumnScope.HEADER },
    { key: "custom:plan1", header: "PLAN1", scope: ProcessColumnScope.HEADER },
    { key: "componentItemCode", header: "ÍTEM - COMPONENTE", scope: ProcessColumnScope.COMPONENT },
    { key: "baseQuantity", header: "CANT. BASE", scope: ProcessColumnScope.COMPONENT },
    { key: "requiredQuantity", header: "CANT. REQUERIDA", scope: ProcessColumnScope.COMPONENT },
  ],
};

const result = (dryRun: boolean): ImportResult => ({
  dryRun,
  created: 1,
  updated: 0,
  skipped: 0,
  rowsRead: 2,
  phantomItemsDetected: 1,
  errors: [],
  warnings: [{ sheet: PROCESS.name, row: 2, column: "PLAN1", message: "The header differs within the group." }],
  sheets: [],
});

const TEXT = "F. Acc Alis\t599001\t1 / CLASE DE ITEM\t211\t1\t2\nF. Acc Alis\t599001\t1 / CLASE DE ITEM\t3045\t1\t1";

const renderModal = (onClose = vi.fn()) => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <PhantomItemPasteModal process={PROCESS} onClose={onClose} />
    </QueryClientProvider>,
  );
  return onClose;
};

beforeEach(() => {
  mocks.importPasted.mockReset().mockImplementation(async (_id, _text, _mode, dryRun: boolean) => result(dryRun));
});

describe("PhantomItemPasteModal", () => {
  it("tells the column order expected without a header, family first", () => {
    renderModal();

    expect(screen.getByLabelText("Orden de columnas").textContent).toBe(
      "1. Fantasma2. Item3. PLAN14. ÍTEM - COMPONENTE5. CANT. BASE6. CANT. REQUERIDA",
    );
  });

  it("previews, then imports the same text into the process", async () => {
    const onClose = renderModal();

    fireEvent.change(screen.getByLabelText("Filas copiadas de Excel"), { target: { value: TEXT } });
    fireEvent.click(screen.getByRole("button", { name: "Previsualizar" }));

    await screen.findByText(/Se crearían/);
    expect(screen.getByText("The header differs within the group.")).toBeTruthy();
    expect(mocks.importPasted).toHaveBeenLastCalledWith(3, TEXT, "create", true);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mocks.importPasted).toHaveBeenLastCalledWith(3, TEXT, "create", false);
  });

  it("asks for a new preview when the text changes", async () => {
    renderModal();
    fireEvent.change(screen.getByLabelText("Filas copiadas de Excel"), { target: { value: TEXT } });
    fireEvent.click(screen.getByRole("button", { name: "Previsualizar" }));
    await screen.findByRole("button", { name: "Confirmar" });

    fireEvent.change(screen.getByLabelText("Filas copiadas de Excel"), { target: { value: `${TEXT}\n` } });

    expect(screen.queryByRole("button", { name: "Confirmar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Previsualizar" })).toBeTruthy();
  });

  it("shows why the server could not read the rows", async () => {
    mocks.importPasted.mockRejectedValueOnce({
      response: { data: { message: "Validation failed", errors: { text: ["The required columns are missing."] } } },
    });
    renderModal();

    fireEvent.change(screen.getByLabelText("Filas copiadas de Excel"), { target: { value: "hola" } });
    fireEvent.click(screen.getByRole("button", { name: "Previsualizar" }));

    expect(await screen.findByText("The required columns are missing.")).toBeTruthy();
  });
});
