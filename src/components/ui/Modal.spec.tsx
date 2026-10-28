/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("regression: a tall modal scrolls with the overlay and keeps its header in view", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Importar libro">
        <div style={{ height: 5000 }}>Vista previa larga</div>
      </Modal>,
    );

    // The overlay scrolls; before, it was centered and cut the top off
    const overlay = document.querySelector("[data-modal-overlay]")!;
    expect(overlay.className).toContain("overflow-y-auto");
    const header = screen.getByRole("heading", { name: "Importar libro" }).parentElement!;
    expect(header.className).toContain("sticky");
    expect(screen.getByRole("dialog", { name: "Importar libro" })).toBeTruthy();
  });

  it("closes with its button", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Procesos">
        contenido
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes with Escape", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Procesos">
        contenido
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("with two modals open, Escape closes only the one on top", () => {
    const outer = vi.fn();
    const inner = vi.fn();
    render(
      <>
        <Modal isOpen onClose={outer} title="Menú de plantilla">
          menú
        </Modal>
        <Modal isOpen onClose={inner} title="Elegir ítem">
          selector
        </Modal>
      </>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
  });

  it("leaves Escape to whoever used it inside, like an autocomplete", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Editar fórmula">
        <input
          aria-label="Fórmula"
          onKeyDown={(event) => event.key === "Escape" && event.preventDefault()}
        />
      </Modal>,
    );

    fireEvent.keyDown(screen.getByLabelText("Fórmula"), { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does nothing when closed", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={false} onClose={onClose} title="Procesos">
        contenido
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});
