/**
 * La guía del editor enseña el flujo completo de la lista de materiales —el
 * que antes tenía el diseñador— y los pasos de «Ir a».
 */

/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TemplateGuideModal } from "./TemplateGuideModal";

describe("guía de la plantilla", () => {
  it("recorre los pasos de la lista de materiales con las acciones del menú", () => {
    render(<TemplateGuideModal onClose={() => {}} />);
    expect(screen.getByText("Lista de materiales en 5 pasos")).toBeTruthy();

    const titles: string[] = [];
    for (let step = 0; step < 6; step++) {
      fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
      titles.push(screen.getByRole("heading", { level: 3 }).textContent ?? "");
    }
    expect(titles).toEqual([
      "Paso 1 · Marcar la tabla catálogo (con tags)",
      "Paso 2 · Asignar zona semi-terminado",
      "Paso 3 · Configurar condiciones de la celda",
      "Paso 4 · Vincular item (modal viewer)",
      "Paso 5 · Generar la lista de materiales",
      "¡Listo!",
    ]);
  });

  it("enseña las tablas etiquetadas e Ir a", () => {
    render(<TemplateGuideModal onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Tablas e Ir a" }));
    expect(screen.getByText("Paso 1: Etiquetar rango como tabla")).toBeTruthy();
    expect(screen.getByText("Paso 2: Configurar Ir a en una celda")).toBeTruthy();
  });
});
