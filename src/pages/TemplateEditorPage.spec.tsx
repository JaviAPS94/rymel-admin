/**
 * El modo fórmula se enciende al teclear el `=`, no al salir de la celda.
 *
 * Se prueba sobre la página montada y no sobre el hook, porque el fallo no
 * estaba en el hook: estaba en que la celda guardaba lo que se escribía en un
 * estado propio y el constructor de fórmulas nunca se enteraba. Un `=` tecleado
 * dentro de la celda no encendía nada, y había que salir y volver a entrar para
 * que la barra apareciera.
 *
 * Una prueba del hook habría pasado con el fallo puesto.
 */

/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { emptySheetStyles } from "@rymel/design-template";
import { TemplateStatus, type TemplateDetail } from "@/types/template.types";

const detail: TemplateDetail = {
  id: 3,
  status: TemplateStatus.DRAFT,
  version: 0,
  hasDraft: true,
  designSubTypeId: 1,
  document: {
    id: 3,
    name: "Plantilla de prueba",
    code: "TEMPLATE_TEST",
    type: "DESIGN",
    designSubTypeId: 1,
    status: TemplateStatus.DRAFT,
    version: 0,
    sheets: [
      {
        name: "Hoja1",
        position: 0,
        cells: {
          A1: { content: "=SUMA(B1:B5)" },
          B1: { content: "1" },
        },
        styles: emptySheetStyles(),
      },
    ],
  },
  diagnostics: [],
};

vi.mock("wouter", () => ({
  useParams: () => ({ id: "3" }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock("@components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@hooks/useTemplates", () => ({
  useTemplateDetail: () => ({ data: detail, isLoading: false }),
  useElementFields: () => ({ data: [] }),
  usePublishTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDiscardDraft: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@hooks/useTemplateValidation", () => ({
  useTemplateValidation: () => ({
    diagnostics: [],
    bySheet: [],
    documentLevel: [],
    canPublish: true,
    designFunctions: [],
    designFunctionCatalog: [],
    isLoadingFunctions: false,
  }),
}));

vi.mock("@hooks/useTemplateSave", () => ({
  useTemplateSave: () => ({
    save: vi.fn(),
    isSaving: false,
    hasPendingChanges: false,
    error: undefined,
    savedAt: undefined,
  }),
}));

vi.mock("@hooks/useTemplatePreview", () => ({
  useTemplatePreview: () => ({ result: undefined, run: vi.fn(), isRunning: false }),
}));

import { TemplateEditorPage } from "./TemplateEditorPage";

beforeEach(() => {
  // La rejilla mide su viewport para decidir qué pinta.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
});

const cell = (ref: string): HTMLElement =>
  document.querySelector(`[data-cell="${ref}"]`) as HTMLElement;

/** El input que aparece dentro de la celda al editarla, no el de la barra. */
const cellInput = (ref: string): HTMLInputElement =>
  document.querySelector(`[data-cell="${ref}"] input`) as HTMLInputElement;

/** Las celdas que la rejilla pinta como seleccionadas. */
const selectedRefs = (): string[] =>
  [...document.querySelectorAll("[data-cell][data-selected='true']")]
    .map((node) => node.getAttribute("data-cell") as string)
    .sort();

const formulaBar = (): HTMLInputElement =>
  document.querySelector('[data-testid="formula-input"]') as HTMLInputElement;

describe("el modo fórmula al teclear", () => {
  it("aparece en cuanto se escribe un `=` dentro de la celda", () => {
    render(<TemplateEditorPage />);

    expect(screen.queryByText("Modo fórmula")).toBeNull();

    fireEvent.doubleClick(cell("A1"));
    fireEvent.change(cellInput("A1"), { target: { value: "=" } });

    expect(screen.queryByText("Modo fórmula")).not.toBeNull();
  });

  it("se apaga si se borra el `=`, sin salir de la celda", () => {
    render(<TemplateEditorPage />);

    fireEvent.doubleClick(cell("A1"));
    fireEvent.change(cellInput("A1"), { target: { value: "=A" } });
    expect(screen.queryByText("Modo fórmula")).not.toBeNull();

    fireEvent.change(cellInput("A1"), { target: { value: "A" } });
    expect(screen.queryByText("Modo fórmula")).toBeNull();
  });

  it("lo que se teclea en la celda es lo que ve la barra de fórmulas", () => {
    // Un solo dueño del borrador: si fueran dos estados, aquí es donde se
    // vería que se han separado.
    render(<TemplateEditorPage />);

    fireEvent.doubleClick(cell("A1"));
    fireEvent.change(cellInput("A1"), { target: { value: "=SUMA(A1:A5)" } });

    expect(formulaBar().value).toBe("=SUMA(A1:A5)");
  });

});

describe("editar el contenido de una celda", () => {
  it("editar una celda con fórmula y cambiar de celda no la borra", () => {
    // El borrador vive en el constructor de fórmulas, y la selección también
    // lo reescribe al cambiar de celda. Si esa reescritura llega antes que la
    // confirmación, lo que se guarda en la celda editada es el contenido de la
    // celda nueva — es decir, se pierde la fórmula.
    render(<TemplateEditorPage />);

    fireEvent.doubleClick(cell("A1"));
    expect(cellInput("A1").value).toBe("=SUMA(B1:B5)");

    // Se cambia de celda: primero se mueve la selección, después suelta el foco.
    fireEvent.mouseDown(cell("C3"));
    fireEvent.blur(cellInput("A1"));

    fireEvent.mouseDown(cell("A1"));
    expect(formulaBar().value).toBe("=SUMA(B1:B5)");
  });

});

describe("la selección en la rejilla", () => {
  it("la barra al aparecer no arrastra la selección hacia arriba", () => {
    // Seleccionar una celda con fórmula hace aparecer la barra del modo
    // fórmula, la rejilla baja y las celdas desfilan por debajo de un puntero
    // que sigue pulsado pero no se ha movido. Eso no es un arrastre.
    render(<TemplateEditorPage />);

    fireEvent.mouseDown(cell("A5"));
    fireEvent.mouseEnter(cell("A4"));
    fireEvent.mouseEnter(cell("A3"));
    fireEvent.mouseEnter(cell("A2"));

    expect(selectedRefs()).toEqual(["A5"]);
  });

  it("arrastrar con el puntero sí extiende la selección", () => {
    render(<TemplateEditorPage />);

    fireEvent.mouseDown(cell("A5"));
    fireEvent.mouseMove(cell("A5"));
    fireEvent.mouseEnter(cell("A4"));

    expect(selectedRefs()).toEqual(["A4", "A5"]);
  });
});
