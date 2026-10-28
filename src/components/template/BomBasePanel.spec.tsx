/**
 * La lista de materiales base en el editor de plantillas: el panel que la
 * genera y la operación del documento que la pone.
 */

/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BOM_BASE_SHEET_NAME,
  bomBaseSheet,
  emptySheetStyles,
  type TemplateDocument,
  type TemplateSheet,
} from "@rymel/design-template";

const mocks = vi.hoisted(() => ({ getBoms: vi.fn(), getBom: vi.fn() }));
vi.mock("@services/bomService", () => ({ bomService: { getBoms: mocks.getBoms, getBom: mocks.getBom } }));

import { BomBasePanel } from "./BomBasePanel";
import { useTemplateDocument } from "@hooks/useTemplateDocument";

/** Hoja1 vincula L5 al ítem 240 del catálogo, dentro de la zona del semielaborado 1. */
const HOJA: TemplateSheet = {
  name: "Hoja1",
  position: 0,
  cells: {
    B2: { content: "Item" },
    B3: { content: "240" },
    C3: { content: "Fibra de 2 mm" },
    D3: { content: "KLS" },
    L5: { content: "3", itemLink: { catalogSheetName: "Hoja1", catalogTableId: "cat", itemId: "240" } },
  },
  styles: {
    ...emptySheetStyles(),
    semiFinishedZones: [
      { id: "z1", semiFinishedId: 1, semiFinishedCode: "SF1", semiFinishedName: "SF 1", startCell: "L5", endCell: "L5" },
    ],
    itemCatalogTables: [
      { id: "cat", name: "Catálogo", startCell: "B2", endCell: "D3", headerRows: 1, idColumnOffset: 0, descriptionColumnOffset: 1, umColumnOffset: 2 },
    ],
  },
};
const STRUCTURE = {
  id: 2,
  code: "1-25-220-120",
  name: "Estructura de prueba",
  createdAt: "",
  updatedAt: "",
  nodes: [{ id: 10, semiFinished: { id: 1, name: "SF 1", code: "SF1" }, children: [] }],
};
const doc = (sheets: TemplateSheet[]): TemplateDocument => ({
  name: "Plantilla",
  code: "P_0001",
  type: "DESIGN",
  status: "DRAFT",
  version: 0,
  sheets,
});

beforeEach(() => {
  mocks.getBoms.mockReset().mockResolvedValue({ data: [STRUCTURE], total: 1, page: 1, limit: 200 });
  mocks.getBom.mockReset().mockResolvedValue(STRUCTURE);
});

const renderPanel = (document: TemplateDocument) => {
  const onSetBomSheet = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <BomBasePanel document={document} onSetBomSheet={onSetBomSheet} onOpenSheet={vi.fn()} />
    </QueryClientProvider>,
  );
  return onSetBomSheet;
};

describe("BomBasePanel", () => {
  it("genera la hoja base con la estructura elegida y las fórmulas de la plantilla", async () => {
    const onSetBomSheet = renderPanel(doc([HOJA]));
    expect(screen.getByText(/todavía no tiene lista de materiales/)).toBeTruthy();
    await screen.findByRole("option", { name: /1-25-220-120/ });
    fireEvent.change(screen.getByLabelText("Estructura BOM"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Generar lista de materiales" }));

    await waitFor(() => expect(onSetBomSheet).toHaveBeenCalled());
    expect(mocks.getBom).toHaveBeenCalledWith(2);
    const sheet: TemplateSheet = onSetBomSheet.mock.lastCall![0];
    expect(sheet.styles.billOfMaterials?.structureCode).toBe("1-25-220-120");
    expect(Object.values(sheet.cells).some((cell) => cell.content === "=Hoja1!L5")).toBe(true);
  });

  it("regenerar pide confirmación y, si se cancela, no toca nada", async () => {
    const base = { ...HOJA, name: BOM_BASE_SHEET_NAME, styles: { ...emptySheetStyles(), billOfMaterials: { structureId: 2, structureCode: "1-25-220-120", structureName: "Estructura de prueba" } } };
    const onSetBomSheet = renderPanel(doc([HOJA, base]));
    await screen.findByRole("option", { name: /1-25-220-120/ });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Regenerar lista de materiales" }));
    expect(confirm).toHaveBeenCalled();
    expect(onSetBomSheet).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Regenerar lista de materiales" }));
    await waitFor(() => expect(onSetBomSheet).toHaveBeenCalled());
    // La base se arma con las demás hojas, no consigo misma
    expect(mocks.getBom).toHaveBeenCalledWith(2);
  });
});

describe("setBomSheet", () => {
  const generated: TemplateSheet = {
    name: BOM_BASE_SHEET_NAME,
    position: 9,
    cells: { B3: { content: "=Hoja1!L5" } },
    styles: { ...emptySheetStyles(), billOfMaterials: { structureId: 2, structureCode: "X", structureName: "X" } },
  };

  it("la añade al final, marcada, con su fórmula calculada y como hoja activa", () => {
    const { result } = renderHook(() => useTemplateDocument(doc([HOJA])));
    act(() => result.current.setBomSheet(generated));
    const base = bomBaseSheet(result.current.document.sheets)!;
    expect(base.name).toBe(BOM_BASE_SHEET_NAME);
    expect(base.position).toBe(1);
    expect(result.current.activeSheetName).toBe(BOM_BASE_SHEET_NAME);
    expect(result.current.dirtySheets.has(BOM_BASE_SHEET_NAME)).toBe(true);
    expect(result.current.getValue(BOM_BASE_SHEET_NAME, "B3")).toBe(3);
  });

  it("al regenerar conserva el nombre que le dio el autor, y se deshace en un paso", () => {
    const renamed = { ...generated, name: "Materiales", position: 0, cells: { A1: { content: "editado" } } };
    const { result } = renderHook(() => useTemplateDocument(doc([renamed, { ...HOJA, position: 1 }])));
    act(() => result.current.setBomSheet(generated));
    const sheets = result.current.document.sheets;
    expect(sheets.map((sheet) => sheet.name)).toEqual(["Materiales", "Hoja1"]);
    expect(sheets[0]!.cells.B3?.content).toBe("=Hoja1!L5");
    act(() => result.current.undo());
    expect(result.current.document.sheets[0]!.cells.A1?.content).toBe("editado");
  });

  it("no pisa una hoja normal que se llame igual", () => {
    const { result } = renderHook(() => useTemplateDocument(doc([HOJA, { ...HOJA, name: BOM_BASE_SHEET_NAME, position: 1, styles: emptySheetStyles() }])));
    act(() => result.current.setBomSheet(generated));
    expect(result.current.document.sheets.map((sheet) => sheet.name)).toEqual([
      "Hoja1",
      BOM_BASE_SHEET_NAME,
      `${BOM_BASE_SHEET_NAME} (2)`,
    ]);
  });
});
