/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProcessColumnsEditor } from "./ProcessColumnsEditor";
import { COLUMNS } from "./columns";
import { ProcessColumnScope, type ProcessColumn } from "@/types/phantom-item.types";

const catalog = (): ProcessColumn[] =>
  COLUMNS.map((column) => ({
    key: column.field,
    header: column.header,
    scope: column.scope === "component" ? ProcessColumnScope.COMPONENT : ProcessColumnScope.HEADER,
  }));

const renderEditor = (columns = catalog()) => {
  const onSave = vi.fn();
  render(<ProcessColumnsEditor columns={columns} onSave={onSave} />);
  return onSave;
};

const save = () => screen.getByRole("button", { name: "Guardar columnas" });

describe("ProcessColumnsEditor", () => {
  it("saves nothing until something changes", () => {
    renderEditor();
    expect((save() as HTMLButtonElement).disabled).toBe(true);
  });

  it("renames the header a process uses for a catalog field", () => {
    const onSave = renderEditor();

    fireEvent.change(screen.getByLabelText("Encabezado de requiredQuantity"), {
      target: { value: "CANT. REQUERIDA LMS" },
    });
    fireEvent.click(save());

    const saved: ProcessColumn[] = onSave.mock.calls[0][0];
    expect(saved.find((column) => column.key === "requiredQuantity")?.header).toBe("CANT. REQUERIDA LMS");
    expect(saved).toHaveLength(COLUMNS.length);
  });

  it("adds an own header column at the end, keyed like the server", () => {
    const onSave = renderEditor();

    fireEvent.change(screen.getByPlaceholderText("Ej. PLAN1"), { target: { value: "PLAN 1" } });
    fireEvent.keyDown(screen.getByPlaceholderText("Ej. PLAN1"), { key: "Enter" });
    fireEvent.click(save());

    expect(onSave.mock.calls[0][0].at(-1)).toEqual({
      key: "custom:plan_1",
      header: "PLAN 1",
      scope: ProcessColumnScope.HEADER,
    });
  });

  it("does not let a required column be removed", () => {
    renderEditor();

    expect((screen.getByRole("button", { name: "Quitar Item" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Quitar UM" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("offers a removed catalog column back", () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Quitar UM" }));

    const select = screen.getByLabelText("Columna del catálogo") as HTMLSelectElement;
    expect([...select.options].map((option) => option.textContent)).toContain("UM");
  });

  it("blocks saving with a problem and says which", () => {
    renderEditor();

    fireEvent.change(screen.getByLabelText("Encabezado de unitOfMeasure"), { target: { value: "Fantasma" } });

    expect(screen.getByText("«Fantasma» está reservado para la columna de familia.")).toBeTruthy();
    expect((save() as HTMLButtonElement).disabled).toBe(true);
  });
});
