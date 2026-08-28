/**
 * El buscador de funciones de la expresión.
 *
 * Lo que se comprueba es lo que motivó rehacerlo: que no empuje el contenido
 * del modal, y que con cuarenta entradas se llegue a una sin recorrerlas.
 */

/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MathFunctionPicker } from "./MathFunctionPicker";

const renderPicker = () => {
  const onInsert = vi.fn();
  const onClose = vi.fn();

  const anchor = window.document.createElement("button");
  window.document.body.appendChild(anchor);

  const view = render(
    <MathFunctionPicker
      anchor={anchor}
      onInsert={onInsert}
      onClose={onClose}
    />,
  );

  const panel = () =>
    window.document.querySelector(
      '[data-testid="math-function-picker"]',
    ) as HTMLElement;

  const search = () => screen.getByPlaceholderText("Buscar función…");

  const highlighted = () =>
    window.document.querySelector('[data-highlighted="true"] code')
      ?.textContent;

  return { ...view, onInsert, onClose, anchor, panel, search, highlighted };
};

describe("el buscador de funciones", () => {
  it("flota sobre el contenido en vez de empujarlo", () => {
    // Era el problema: en línea, cuarenta entradas desplazaban hacia abajo las
    // variables, las constantes y el probador dentro de un modal que ya tiene
    // su propio scroll.
    const { panel } = renderPicker();
    expect(panel().style.position).toBe("fixed");
  });

  it("filtra por nombre y por descripción", () => {
    const { search } = renderPicker();

    fireEvent.change(search(), { target: { value: "raíz" } });

    expect(screen.getByText("sqrt(x)")).toBeTruthy();
    expect(screen.getByText("cbrt(x)")).toBeTruthy();
    expect(screen.queryByText("sin(x)")).toBeNull();
  });

  it("inserta con Enter la función resaltada", () => {
    const { search, onInsert } = renderPicker();

    fireEvent.change(search(), { target: { value: "log10" } });
    fireEvent.keyDown(search(), { key: "Enter" });

    expect(onInsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "log10", insert: "log10(" }),
    );
  });

  it("las flechas recorren solo lo insertable", () => {
    // Los títulos de grupo y la notación —los operadores— no se seleccionan:
    // pararse en ellos obliga a pulsar de más para nada.
    const { search, highlighted } = renderPicker();

    fireEvent.change(search(), { target: { value: "logaritmo" } });
    expect(highlighted()).toBe("log(x)");

    fireEvent.keyDown(search(), { key: "ArrowDown" });
    expect(highlighted()).toBe("log10(x)");
  });

  it("la selección da la vuelta al llegar al final", () => {
    const { search, highlighted } = renderPicker();

    fireEvent.change(search(), { target: { value: "hiperbólic" } });
    fireEvent.keyDown(search(), { key: "ArrowUp" });

    expect(highlighted()).toBe("tanh(x)");
  });

  it("cierra con Escape sin dejar que la tecla suba", () => {
    // El modal no la escucha hoy, así que esto no arregla nada visible: fija
    // que un panel anidado no filtre su `Escape` hacia arriba, para el día en
    // que el formulario cierre con esa tecla.
    const { search, onClose } = renderPicker();

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    const reachedDocument = vi.fn();
    window.document.addEventListener("keydown", reachedDocument);

    search().dispatchEvent(event);

    expect(onClose).toHaveBeenCalled();
    expect(reachedDocument).not.toHaveBeenCalled();

    window.document.removeEventListener("keydown", reachedDocument);
  });

  it("cierra al pulsar fuera, pero no al pulsar dentro", () => {
    const { panel, onClose } = renderPicker();

    fireEvent.mouseDown(panel());
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(window.document.body);
    expect(onClose).toHaveBeenCalled();
  });

  it("dice qué hacer cuando no hay coincidencias", () => {
    const { search } = renderPicker();

    fireEvent.change(search(), { target: { value: "buscarv" } });

    expect(screen.getByText(/Ninguna función coincide/)).toBeTruthy();
  });

  it("avisa de que este no es el motor de las plantillas", () => {
    // Es la confusión que el panel existe para evitar.
    renderPicker();
    expect(screen.getByText("SUMA")).toBeTruthy();
    expect(screen.getByText(/no es el de las plantillas/)).toBeTruthy();
  });
});
