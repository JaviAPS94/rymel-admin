/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ImportPreview } from "./ImportPreview";
import type { ImportResult, SheetImportSummary } from "@/types/phantom-item.types";

const sheet = (overrides: Partial<SheetImportSummary>): SheetImportSummary => ({
  sheet: "",
  processName: "",
  newProcess: false,
  hidden: false,
  phantomItemsDetected: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  moved: 0,
  ignoredColumns: [],
  columns: [],
  ...overrides,
});

/** The shape of the real workbook's preview against a database with only «General» */
const PREVIEW: ImportResult = {
  dryRun: true,
  created: 532,
  updated: 1,
  skipped: 0,
  rowsRead: 5235,
  phantomItemsDetected: 533,
  errors: [],
  warnings: [
    { sheet: "SEF-SEH", row: 0, message: "Hidden sheet: not imported." },
    { sheet: "EMBLEMADO", row: 3, column: "Item", message: 'Item 500190 is in another process and moves to "EMBLEMADO".' },
  ],
  sheets: [
    sheet({ sheet: "SEF-SEH", processName: "SEF-SEH", hidden: true }),
    sheet({
      sheet: "EMBLEMADO",
      processName: "EMBLEMADO",
      newProcess: true,
      phantomItemsDetected: 31,
      created: 30,
      updated: 1,
      moved: 1,
      ignoredColumns: ["Estructura LM", "Plantillas Diseño"],
    }),
    sheet({ sheet: "METALMECANICA", processName: "METALMECANICA", newProcess: true, phantomItemsDetected: 208, created: 208 }),
  ],
};

const rowOf = (name: string) => document.querySelector(`[data-sheet="${name}"]`) as HTMLElement;

describe("ImportPreview", () => {
  it("summarizes the workbook and names the processes it will create", () => {
    render(<ImportPreview result={PREVIEW} bySheet />);

    expect(screen.getByText(/Se crearían/).textContent).toContain("5235 filas leídas, 533 ítems detectados");
    expect(screen.getByText(/Se crearán los procesos/).textContent).toContain("«EMBLEMADO», «METALMECANICA»");
  });

  it("shows each sheet with its process, counts, moves and ignored columns", () => {
    render(<ImportPreview result={PREVIEW} bySheet />);

    const emblemado = within(rowOf("EMBLEMADO"));
    expect(emblemado.getByText("nuevo")).toBeTruthy();
    expect(emblemado.getByText("(1 cambian de proceso)")).toBeTruthy();
    expect(emblemado.getByText("Estructura LM, Plantillas Diseño")).toBeTruthy();
    expect(within(rowOf("SEF-SEH")).getByText("Oculta, no se importa")).toBeTruthy();
  });

  it("lists the issues with their sheet", () => {
    render(<ImportPreview result={PREVIEW} bySheet />);

    const issues = within(screen.getByRole("table", { name: "Errores y avisos" }));
    const moved = issues.getByText(/moves to "EMBLEMADO"/).closest("tr")!;
    expect(moved.textContent).toContain("EMBLEMADO");
    expect(moved.textContent).toContain("Item");
  });
});
