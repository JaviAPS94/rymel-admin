/**
 * La barra de formato, montada.
 *
 * El color de texto no se aplicaba y el resto sí, así que la diferencia estaba
 * en el propio control, no en el estado ni en el dibujo.
 */

/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { emptySheetStyles } from "@rymel/design-template";
import type { CellFormat, TemplateCell } from "@rymel/design-template";
import { FormatToolbar } from "./FormatToolbar";

const renderToolbar = (activeCell?: TemplateCell) => {
  const onApplyFormat = vi.fn<(patch: Partial<CellFormat>) => void>();

  const view = render(
    <FormatToolbar
      activeCell={activeCell}
      selectedRefs={["A1"]}
      rect={{ top: 0, left: 0, bottom: 0, right: 0 }}
      styles={emptySheetStyles()}
      onApplyFormat={onApplyFormat}
      onClearFormat={() => {}}
      onSetStyles={() => {}}
      onMerge={() => {}}
      onUnmerge={() => {}}
    />,
  );

  return { ...view, onApplyFormat };
};

describe("color de texto", () => {
  it("aplica el color que se elige", () => {
    const { container, onApplyFormat } = renderToolbar();
    const input = container.querySelector(
      'input[data-format="textColor"]',
    ) as HTMLInputElement;

    expect(input, "el selector de color de texto tiene que existir").not.toBeNull();
    fireEvent.change(input, { target: { value: "#ff0000" } });

    expect(onApplyFormat).toHaveBeenCalledWith({ textColor: "#ff0000" });
  });

  it("parte del color que la celda ya tiene", () => {
    const { container } = renderToolbar({
      content: "x",
      format: { textColor: "#2d6ef0" },
    });
    const input = container.querySelector(
      'input[data-format="textColor"]',
    ) as HTMLInputElement;

    expect(input.value).toBe("#2d6ef0");
  });
});

describe("color de fondo", () => {
  it("aplica el color que se elige", () => {
    const { container, onApplyFormat } = renderToolbar();
    const input = container.querySelector(
      'input[data-format="backgroundColor"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "#a70606" } });

    expect(onApplyFormat).toHaveBeenCalledWith({ backgroundColor: "#a70606" });
  });
});

describe("el resto de controles", () => {
  it("alterna la negrita", () => {
    const { container, onApplyFormat } = renderToolbar();

    fireEvent.click(container.querySelector('[data-action="bold"]')!);

    expect(onApplyFormat).toHaveBeenCalledWith({ bold: true });
  });

  it("quita la negrita si la celda ya la tiene", () => {
    const { container, onApplyFormat } = renderToolbar({
      content: "x",
      format: { bold: true },
    });

    fireEvent.click(container.querySelector('[data-action="bold"]')!);

    expect(onApplyFormat).toHaveBeenCalledWith({ bold: false });
  });

  it("pone el borde completo", () => {
    const { container, onApplyFormat } = renderToolbar();

    fireEvent.click(container.querySelector('[data-action="border"]')!);

    expect(onApplyFormat).toHaveBeenCalledWith({ border: "1px solid #000" });
  });

  it("aplica los decimales", () => {
    const { container, onApplyFormat } = renderToolbar();

    fireEvent.change(container.querySelector('[data-format="decimals"]')!, {
      target: { value: "2" },
    });

    expect(onApplyFormat).toHaveBeenCalledWith({ decimals: 2 });
  });
});
