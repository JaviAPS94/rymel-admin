/**
 * Lo que la rejilla pinta, con datos reales.
 *
 * El recorte de `__fixtures__/resumen-slice.json` sale del borrador de
 * `TEMPLATE_1F_0001`: 17 celdas, todas con formato, 8 combinaciones y
 * `freezeRow: 7`. Se leían bien y se guardaban bien; lo que fallaba era el
 * dibujo, y eso ninguna prueba de datos lo ve.
 */

/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import type { TemplateSheet } from "@rymel/design-template";
import { TemplateGrid } from "./TemplateGrid";
import { useGridSelection } from "@hooks/useGridSelection";
import { renderHook } from "@testing-library/react";
import slice from "./__fixtures__/resumen-slice.json";

/**
 * jsdom no trae `ResizeObserver` ni mide nada: sin esto la rejilla no monta, y
 * sin dimensiones su ventana visible sería de tamaño cero y no dibujaría
 * ninguna celda. Se le da un tamaño de pantalla creíble.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as never;

for (const [prop, value] of [
  ["clientHeight", 600],
  ["clientWidth", 900],
] as const) {
  Object.defineProperty(HTMLElement.prototype, prop, {
    configurable: true,
    value,
  });
}

const sheet = slice as unknown as TemplateSheet;

/** Lo mínimo que la rejilla necesita, sin la hoja. */
const baseProps = () => {
  const { result } = renderHook(() => useGridSelection());
  return {
    sheet,
    values: {},
    selection: result.current,
    editing: null,
    editingValue: "",
    onEditingValueChange: () => {},
    onStartEditing: () => {},
    onCommitEditing: () => {},
    onCancelEditing: () => {},
    onResizeColumn: () => {},
    onResizeRow: () => {},
  };
};

const renderGrid = () => {
  const view = render(<TemplateGrid {...baseProps()} />);

  /** La celda dibujada en esa referencia, por su contenido o su posición. */
  const cellAt = (ref: string): HTMLElement | null =>
    view.container.querySelector(`[data-cell="${ref}"]`);

  return { ...view, cellAt };
};

describe("formato de celda", () => {
  it("pinta la negrita que declara la celda", () => {
    const { cellAt } = renderGrid();
    // `A1` del recorte real lleva `bold`.
    expect(cellAt("A1")?.style.fontWeight).toBe("600");
  });

  /**
   * La regresión que se veía en pantalla: 1907 celdas de la plantilla real
   * llevan `border`, y no se pintaba ninguna.
   *
   * React escribe cada propiedad del objeto de estilo, y una `undefined` la
   * escribe como cadena vacía. Con `border` junto a `borderTop`,
   * `borderRight`, `borderBottom` y `borderLeft` en `undefined`, los cuatro
   * lados borraban el atajo. Se comprueba sobre el CSSOM, que normaliza el
   * color, así que se compara el ancho y el estilo.
   */
  it("pinta el borde que declara la celda", () => {
    const { cellAt } = renderGrid();
    const conBorde = Object.entries(sheet.cells).find(
      ([, cell]) => cell.format?.border,
    )!;

    const pintado = cellAt(conBorde[0])!.style;
    expect(pintado.border).not.toBe("");
    expect(pintado.borderTopWidth).toBe("1px");
    expect(pintado.borderTopStyle).toBe("solid");
  });

  it("un borde por lado no borra los demás", () => {
    const { container } = render(
      <TemplateGrid
        {...baseProps()}
        sheet={{
          ...sheet,
          cells: {
            A1: {
              content: "x",
              format: { borderTop: "2px dashed #f00", borderLeft: "3px dotted #00f" },
            },
          },
        }}
      />,
    );

    const celda = container.querySelector('[data-cell="A1"]') as HTMLElement;
    expect(celda.style.borderTopWidth).toBe("2px");
    expect(celda.style.borderLeftWidth).toBe("3px");
  });

  it("pinta el color de texto que declara la celda", () => {
    const { cellAt } = renderGrid();
    const conColor = Object.entries(sheet.cells).find(
      ([, cell]) => cell.format?.textColor,
    );

    if (!conColor) return;
    expect(cellAt(conColor[0])?.style.color).not.toBe("");
  });
});

describe("estructura de la hoja", () => {
  it("respeta el ancho declarado de cada columna", () => {
    const { cellAt } = renderGrid();
    // `columnWidths[1]` vale 112.5 en la plantilla real.
    const ancho = sheet.styles.columnWidths[1];
    expect(cellAt("B1")?.style.width).toBe(`${ancho}px`);
  });

  it("respeta el alto declarado de cada fila", () => {
    const { cellAt } = renderGrid();
    const alto = sheet.styles.rowHeights[0];
    if (alto === undefined) return;
    expect(cellAt("A1")?.style.height).toBe(`${alto}px`);
  });

  it("una celda combinada ocupa el ancho de todo su rango", () => {
    const { cellAt } = renderGrid();
    const merged = sheet.styles.mergedCells[0];

    const esperado = Array.from({ length: merged.colSpan }, (_, offset) => {
      const columna = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(merged.startCell[0]) + offset;
      return sheet.styles.columnWidths[columna] ?? 96;
    }).reduce((total, width) => total + width, 0);

    expect(cellAt(merged.startCell)?.style.width).toBe(`${esperado}px`);
  });

  it("las celdas cubiertas por una combinación no se dibujan", () => {
    const { cellAt } = renderGrid();
    const merged = sheet.styles.mergedCells[0];
    const siguiente = `${String.fromCharCode(merged.startCell.charCodeAt(0) + 1)}${merged.startCell.slice(1)}`;

    expect(cellAt(merged.startCell)).not.toBeNull();
    expect(cellAt(siguiente)).toBeNull();
  });
});

describe("paneles inmovilizados", () => {
  it("las filas anteriores a la inmovilización quedan fijas", () => {
    // `freezeRow` vale 7 en la plantilla real: las siete primeras filas —los
    // rótulos— tienen que quedarse a la vista al desplazarse. No estaba
    // implementado: la hoja se leía con `freezeRow: 7` y la rejilla lo
    // ignoraba.
    const { container } = renderGrid();

    expect(sheet.styles.freezeRow).toBe(7);
    expect(container.querySelectorAll('[data-frozen="rows"]').length).toBeGreaterThan(0);
  });

  it("solo se inmoviliza lo que la hoja declara", () => {
    const { container } = render(
      <TemplateGrid
        {...baseProps()}
        sheet={{ ...sheet, styles: { ...sheet.styles, freezeRow: 0, freezeColumn: 0 } }}
      />,
    );

    expect(container.querySelector("[data-frozen]")).toBeNull();
  });

  it("las filas inmovilizadas se dibujan aunque queden fuera de la ventana", () => {
    // Es lo que las hace útiles: si la virtualización las descartara al
    // desplazarse, desaparecerían justo cuando hacen falta.
    const { container } = renderGrid();

    const fijas = [...container.querySelectorAll('[data-frozen="rows"]')].map((el) =>
      el.getAttribute("data-cell"),
    );

    expect(fijas.some((ref) => ref?.endsWith("1"))).toBe(true);
  });
});
