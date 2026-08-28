/**
 * La atadura con React del constructor de fórmulas.
 *
 * La lógica se prueba en el motor, que es donde vive. Aquí se comprueba lo
 * único que queda en el admin: que las acciones lleguen al reducer y que la
 * rejilla sepa cuándo el clic es para la fórmula y no para la selección.
 */

/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { useFormulaBuilder } from "./useFormulaBuilder";
import { FormulaModeBar } from "@components/template/FormulaModeBar";

describe("el estado que ve el editor", () => {
  it("se enciende al escribir un `=` y se apaga al quitarlo", () => {
    const { result } = renderHook(() => useFormulaBuilder());

    act(() => result.current.start("", "Resumen"));
    expect(result.current.isActive).toBe(false);

    act(() => result.current.setDraft("=A1"));
    expect(result.current.isActive).toBe(true);

    act(() => result.current.setDraft("texto"));
    expect(result.current.isActive).toBe(false);
  });

  it("el clic en una celda no se consume mientras no se pida", () => {
    const { result } = renderHook(() => useFormulaBuilder());

    act(() => result.current.start("=", "Resumen"));
    expect(result.current.consumesClick).toBe(false);

    let consumed = true;
    act(() => {
      consumed = result.current.pickCell("Resumen", "A1");
    });
    expect(consumed).toBe(false);
  });

  it("señalar una celda inserta su referencia y no la vuelve a esperar", () => {
    const { result } = renderHook(() => useFormulaBuilder());

    act(() => result.current.start("=", "Resumen"));
    act(() => result.current.togglePicking());
    expect(result.current.consumesClick).toBe(true);

    let consumed = false;
    act(() => {
      consumed = result.current.pickCell("Tablas", "C231");
    });

    expect(consumed).toBe(true);
    expect(result.current.draft).toBe("=Tablas!C231");
    expect(result.current.consumesClick).toBe(false);
  });

  it("un rango se forma con sus dos extremos", () => {
    const { result } = renderHook(() => useFormulaBuilder());

    act(() => result.current.start("=SUMA(", "Resumen"));
    act(() => result.current.toggleRange("B2"));
    act(() => {
      result.current.pickCell("Resumen", "B9");
    });

    expect(result.current.draft).toBe("=SUMA(B2:B9");
  });
});

describe("la barra del modo fórmula", () => {
  const renderBar = (overrides: Partial<Parameters<typeof FormulaModeBar>[0]> = {}) => {
    const handlers = {
      onTogglePicking: vi.fn(),
      onToggleRange: vi.fn(),
      onInsert: vi.fn(),
      onExit: vi.fn(),
    };

    const view = render(
      <FormulaModeBar
        cursor={3}
        isPicking={false}
        rangeStart={null}
        activeRef="A1"
        designFunctions={[
          {
            id: 8,
            name: "Análisis cuadrático",
            code: "QUADRATIC",
            variables: ["x"],
            description: "Evalúa ax² + bx + c",
          },
        ]}
        {...handlers}
        {...overrides}
      />,
    );

    return { ...view, ...handlers };
  };

  it("muestra dónde está el cursor", () => {
    const { getByText } = renderBar();
    expect(getByText("Cursor: 3")).toBeTruthy();
  });

  it("pide señalar una celda", () => {
    const { container, onTogglePicking } = renderBar();
    fireEvent.click(container.querySelector('[data-action="pick-cell"]')!);
    expect(onTogglePicking).toHaveBeenCalled();
  });

  it("empieza un rango", () => {
    const { container, onToggleRange } = renderBar();
    fireEvent.click(container.querySelector('[data-action="range"]')!);
    expect(onToggleRange).toHaveBeenCalled();
  });

  it("dice desde dónde va el rango que se está formando", () => {
    const { getByText } = renderBar({ rangeStart: "B2" });
    expect(getByText("Rango desde B2…")).toBeTruthy();
  });

  it("sale del modo", () => {
    const { container, onExit } = renderBar();
    fireEvent.click(container.querySelector('[data-action="exit"]')!);
    expect(onExit).toHaveBeenCalled();
  });

  it("inserta la función con sus variables como marcadores", () => {
    // Igual que el diseñador: se ve qué hay que rellenar y en qué orden, que
    // es contrato porque los argumentos van por posición.
    const { container, getByText, onInsert } = renderBar();

    fireEvent.click(container.querySelector('[data-action="functions"]')!);
    fireEvent.click(getByText("Insertar función"));

    expect(onInsert).toHaveBeenCalledWith("QUADRATIC(x)");
  });

  it("ofrece solo las fórmulas de diseño del subtipo, no las incorporadas", () => {
    // Las incorporadas se escriben; las de diseño son las del negocio, y son
    // las únicas que hace falta buscar.
    const { container, getByText, queryByText } = renderBar();

    fireEvent.click(container.querySelector('[data-action="functions"]')!);

    expect(getByText("Análisis cuadrático")).toBeTruthy();
    expect(getByText("Evalúa ax² + bx + c")).toBeTruthy();
    expect(queryByText("SUMA")).toBeNull();
    expect(queryByText("BUSCARV")).toBeNull();
  });

  it("busca por nombre, código, descripción y variables", () => {
    const { container, getByPlaceholderText, queryByText } = renderBar();

    fireEvent.click(container.querySelector('[data-action="functions"]')!);
    fireEvent.change(getByPlaceholderText(/Buscar por nombre/), {
      target: { value: "cuadr" },
    });

    expect(queryByText("Análisis cuadrático")).not.toBeNull();
  });

  it("dice qué hacer cuando el subtipo no tiene fórmulas asignadas", () => {
    const { container, getByText } = renderBar({ designFunctions: [] });

    fireEvent.click(container.querySelector('[data-action="functions"]')!);

    expect(getByText(/no tiene fórmulas asignadas/)).toBeTruthy();
  });
});
