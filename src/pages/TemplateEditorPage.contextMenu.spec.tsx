/**
 * El menú contextual, sobre la página montada.
 *
 * Lo que se comprueba es el documento que el guardado recibiría —lo único
 * que llega al servidor y de ahí al diseñador—, no lo que se pinta. Cada
 * acción del menú tiene que escribir lo mismo que su equivalente en la barra
 * o en el panel, y tiene que poder deshacerse.
 */

/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { emptySheetStyles, writeSheet, type TemplateDocument } from "@rymel/design-template";
import { TemplateStatus, type TemplateDetail } from "@/types/template.types";

const saved = vi.hoisted(() => ({ document: undefined as TemplateDocument | undefined }));

const detail = (): TemplateDetail => ({
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
          A1: { content: "Espesor" },
          B5: { content: "Aluminio" },
          B7: { content: "3" },
          C2: { content: "=B7*2" },
          D2: { content: "=C2+Tablas!A2" },
        },
        styles: emptySheetStyles(),
      },
      {
        name: "Tablas",
        position: 1,
        cells: {
          A1: { content: "ID" },
          B1: { content: "Descripción" },
          A2: { content: "AL-001" },
          B2: { content: "Platina 3 mm" },
          A3: { content: "AL-003" },
          B3: { content: "Platina 5 mm" },
          E1: { content: "ID" },
          E2: { content: "CU-001" },
          F2: { content: "Pletina de cobre" },
        },
        styles: {
          ...emptySheetStyles(),
          itemCatalogTables: [
            {
              id: "tbl-al",
              name: "Aluminio",
              tags: ["aluminio"],
              startCell: "A1",
              endCell: "C3",
              headerRows: 1,
              idColumnOffset: 0,
              descriptionColumnOffset: 1,
              umColumnOffset: 2,
            },
            {
              id: "tbl-cu",
              name: "Cobre",
              tags: ["cobre"],
              startCell: "E1",
              endCell: "G2",
              headerRows: 1,
              idColumnOffset: 0,
              descriptionColumnOffset: 1,
              umColumnOffset: 2,
            },
          ],
        },
      },
    ],
  },
  diagnostics: [],
});

const fixture = detail();

vi.mock("wouter", () => ({
  useParams: () => ({ id: "3" }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock("@components/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@hooks/useTemplates", () => ({
  useTemplateDetail: () => ({ data: fixture, isLoading: false }),
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
  useTemplateSave: (_id: number, document: TemplateDocument) => {
    saved.document = document;
    return {
      save: vi.fn(),
      isSaving: false,
      hasPendingChanges: false,
      error: undefined,
      savedAt: undefined,
    };
  },
}));

// La protección se prueba encendida: con la bandera apagada el menú no la ofrece.
vi.mock("@/config/features", () => ({ READ_ONLY_ZONES_ENABLED: true }));

vi.mock("@hooks/useTemplatePreview", () => ({
  useTemplatePreview: () => ({ result: undefined, run: vi.fn(), isRunning: false }),
}));

import { TemplateEditorPage } from "./TemplateEditorPage";

beforeEach(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
});

const cell = (ref: string): HTMLElement =>
  document.querySelector(`[data-cell="${ref}"]`) as HTMLElement;

const selectedRefs = (): string[] =>
  [...document.querySelectorAll("[data-cell][data-selected='true']")]
    .map((node) => node.getAttribute("data-cell") as string)
    .sort();

/** Lo que el guardado enviaría para una hoja. */
const sent = (sheet = "Hoja1") => {
  const written = writeSheet(saved.document!.sheets.find((item) => item.name === sheet)!);
  // El serializador siempre escribe los estilos; el tipo los admite ausentes.
  return { ...written, cellsStyles: written.cellsStyles! };
};

const select = (from: string, to?: string) => {
  fireEvent.mouseDown(cell(from));
  fireEvent.mouseUp(window);
  if (to) {
    fireEvent.mouseDown(cell(to), { shiftKey: true });
    fireEvent.mouseUp(window);
  }
};

const openMenu = (ref: string) => fireEvent.contextMenu(cell(ref), { clientX: 100, clientY: 100 });

const choose = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole("menuitem", { name }));

const undo = () => fireEvent.click(screen.getByTitle("Deshacer"));

/** Envía el formulario del diálogo que contiene el campo, no el «Guardar» de la cabecera. */
const submit = (label: string) =>
  fireEvent.submit(screen.getByLabelText(label).closest("form") as HTMLFormElement);

const setConditions = (value: string) => {
  fireEvent.change(screen.getByLabelText("Celdas de condición"), { target: { value } });
  submit("Celdas de condición");
};

describe("el clic derecho y la selección", () => {
  it("fuera de la selección, la selección pasa a la celda", () => {
    render(<TemplateEditorPage />);
    select("A1", "B2");
    openMenu("D4");
    expect(selectedRefs()).toEqual(["D4"]);
  });

  it("dentro de la selección, la selección se conserva", () => {
    render(<TemplateEditorPage />);
    select("A1", "B2");
    openMenu("B1");
    expect(selectedRefs()).toEqual(["A1", "A2", "B1", "B2"]);
  });

  it("se cierra con Escape sin tocar nada", () => {
    render(<TemplateEditorPage />);
    openMenu("A1");
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("cada acción escribe lo mismo que su equivalente", () => {
  it("combinar desde el menú deja lo mismo que la barra, y se deshace", () => {
    const { unmount } = render(<TemplateEditorPage />);
    select("A1", "B2");
    fireEvent.click(screen.getByTitle("Combinar celdas"));
    const fromToolbar = sent().cellsStyles.mergedCells;
    unmount();

    render(<TemplateEditorPage />);
    select("A1", "B2");
    openMenu("A1");
    choose("Combinar celdas");
    expect(sent().cellsStyles.mergedCells).toEqual(fromToolbar);
    expect(fromToolbar).toEqual([{ startCell: "A1", endCell: "B2", rowSpan: 2, colSpan: 2 }]);

    undo();
    expect(sent().cellsStyles.mergedCells).toEqual([]);
  });

  it("separar desde el menú quita la combinación que contiene la celda", () => {
    render(<TemplateEditorPage />);
    select("A1", "B2");
    openMenu("A1");
    choose("Combinar celdas");
    // B2 queda tapada por la combinación: se abre sobre su origen.
    openMenu("A1");
    choose("Separar celdas");
    expect(sent().cellsStyles.mergedCells).toEqual([]);
  });

  it("inmovilizar aquí deja lo mismo que la barra", () => {
    render(<TemplateEditorPage />);
    select("C4");
    openMenu("C4");
    choose("Inmovilizar paneles aquí");
    expect(sent().cellsStyles).toMatchObject({ freezeRow: 3, freezeColumn: 2 });

    openMenu("C4");
    choose("Movilizar paneles");
    expect(sent().cellsStyles).toMatchObject({ freezeRow: 0, freezeColumn: 0 });
  });

  it("la nota se agrega, se edita y se quita, y el menú lo refleja", () => {
    render(<TemplateEditorPage />);
    openMenu("A1");
    choose("Agregar nota");
    fireEvent.change(screen.getByLabelText("Nota"), { target: { value: "Espesor en mm" } });
    fireEvent.click(screen.getByText("Guardar nota"));
    expect(sent().cells.A1).toEqual({ formula: "Espesor", note: "Espesor en mm" });

    openMenu("A1");
    expect(screen.queryByRole("menuitem", { name: "Agregar nota" })).toBeNull();
    choose("Quitar nota");
    expect(sent().cells.A1).toEqual({ formula: "Espesor" });
  });

  it("etiquetar MO desde el menú es exclusivo y se deshace en un paso", () => {
    render(<TemplateEditorPage />);
    openMenu("A1");
    choose("Etiquetar celda como Material del Núcleo (MO)");
    openMenu("B7");
    choose("Etiquetar celda como Material del Núcleo (MO)");
    expect(sent().cells.A1).toEqual({ formula: "Espesor" });
    expect(sent().cells.B7).toEqual({ formula: "3", materialTag: "MO" });

    undo();
    expect(sent().cells.A1).toEqual({ formula: "Espesor", materialTag: "MO" });
    expect(sent().cells.B7).toEqual({ formula: "3" });
  });

  it("la etiqueta que ya tiene la celda aparece deshabilitada", () => {
    render(<TemplateEditorPage />);
    openMenu("A1");
    choose("Etiquetar celda como Material del Núcleo (MO)");
    openMenu("A1");
    const entry = screen.getByRole("menuitem", {
      name: "Celda etiquetada como Material del Núcleo",
    }) as HTMLButtonElement;
    expect(entry.disabled).toBe(true);
    expect(screen.getByRole("menuitem", { name: "Quitar etiqueta MO" })).toBeTruthy();
  });

  it("etiquetar rango como tabla propone la selección", () => {
    render(<TemplateEditorPage />);
    select("B3", "C5");
    openMenu("C4");
    choose("Etiquetar rango como tabla");
    fireEvent.change(screen.getByLabelText("Nombre del rango"), { target: { value: "Aluminio" } });
    fireEvent.change(screen.getByLabelText("Etiquetas"), { target: { value: "aluminio, rect" } });
    fireEvent.click(screen.getByText("Etiquetar rango"));

    expect(sent().cellsStyles.namedRanges).toMatchObject([
      { name: "Aluminio", tags: ["aluminio", "rect"], startCell: "B3", endCell: "C5" },
    ]);
  });

  it("configurar Ir a guarda las condiciones y se quita desde el menú", () => {
    render(<TemplateEditorPage />);
    openMenu("B7");
    choose("Configurar Ir a…");
    setConditions("b5");
    expect(sent().cells.B7).toEqual({ formula: "3", goTo: { conditionCells: ["B5"] } });

    openMenu("B7");
    choose("Quitar Ir a");
    expect(sent().cells.B7).toEqual({ formula: "3" });
  });
});

describe("configurar vínculo al catálogo", () => {
  it("normaliza las referencias", () => {
    render(<TemplateEditorPage />);
    openMenu("B7");
    choose("Configurar vínculo al catálogo");
    setConditions("b5, a1");
    expect(sent().cells.B7).toEqual({ formula: "3", catalogConditionCells: ["B5", "A1"] });
  });

  it("rechaza una referencia inválida sin guardar la lista a medias", () => {
    render(<TemplateEditorPage />);
    openMenu("B7");
    choose("Configurar vínculo al catálogo");
    setConditions("B5, XX");
    expect(screen.getByRole("alert").textContent).toContain("XX");
    expect(sent().cells.B7).toEqual({ formula: "3" });
  });

  it("dejar la lista vacía quita las condiciones", () => {
    render(<TemplateEditorPage />);
    openMenu("B7");
    choose("Configurar vínculo al catálogo");
    setConditions("B5");
    openMenu("B7");
    choose("Configurar vínculo al catálogo (1)");
    setConditions("");
    expect(sent().cells.B7).toEqual({ formula: "3" });
  });
});

describe("selector de ítem", () => {
  const conCondicion = () => {
    openMenu("B7");
    choose("Configurar vínculo al catálogo");
    setConditions("B5");
  };

  it("ofrece solo la tabla cuyas etiquetas coinciden con la condición", () => {
    render(<TemplateEditorPage />);
    conCondicion();
    openMenu("B7");
    choose("Vincular a item del catálogo");

    const dialog = screen.getByRole("table");
    expect(within(dialog).getByText("AL-001")).toBeTruthy();
    expect(within(dialog).queryByText("CU-001")).toBeNull();
    expect(screen.getByText(/B5 = «Aluminio»/)).toBeTruthy();
  });

  it("«ver todas» ofrece también las demás tablas", () => {
    render(<TemplateEditorPage />);
    conCondicion();
    openMenu("B7");
    choose("Vincular a item del catálogo");
    fireEvent.click(screen.getByLabelText("Ver todas las tablas"));
    expect(within(screen.getByRole("table")).getByText("CU-001")).toBeTruthy();
  });

  it("elegir una fila guarda el vínculo y el menú lo muestra", () => {
    render(<TemplateEditorPage />);
    conCondicion();
    openMenu("B7");
    choose("Vincular a item del catálogo");
    fireEvent.click(screen.getByText("AL-003"));

    expect(sent().cells.B7).toEqual({
      formula: "3",
      catalogConditionCells: ["B5"],
      itemLink: { catalogSheetName: "Tablas", catalogTableId: "tbl-al", itemId: "AL-003" },
    });

    openMenu("B7");
    choose("Quitar vínculo");
    expect(sent().cells.B7).toEqual({ formula: "3", catalogConditionCells: ["B5"] });
  });

  it("busca por descripción", () => {
    render(<TemplateEditorPage />);
    openMenu("B7");
    choose("Vincular a item del catálogo");
    fireEvent.change(screen.getByLabelText("Buscar ítem"), { target: { value: "cobre" } });
    const rows = within(screen.getByRole("table")).getAllByRole("row");
    // Encabezado y la única fila que coincide.
    expect(rows).toHaveLength(2);
    expect(within(rows[1]).getByText("CU-001")).toBeTruthy();
  });

  it("sin coincidencias lo dice y ofrece ver todas", () => {
    render(<TemplateEditorPage />);
    openMenu("B7");
    choose("Configurar vínculo al catálogo");
    setConditions("A1");
    openMenu("B7");
    choose("Vincular a item del catálogo");
    expect(screen.getByText(/Ninguna tabla tiene todas las etiquetas/)).toBeTruthy();
  });
});

describe("menú de cabecera", () => {
  const header = (label: string) =>
    [...document.querySelectorAll("div")].find(
      (node) => node.firstChild?.textContent === label && node.className.includes("absolute flex"),
    ) as HTMLElement;

  it("oculta una fila y las vuelve a mostrar", () => {
    render(<TemplateEditorPage />);
    fireEvent.contextMenu(header("4"), { clientX: 10, clientY: 10 });
    choose("Ocultar fila 4");
    expect(sent().cellsStyles.hiddenRows).toEqual([3]);

    fireEvent.contextMenu(header("5"), { clientX: 10, clientY: 10 });
    choose("Mostrar todas las filas");
    expect(sent().cellsStyles.hiddenRows).toEqual([]);
  });

  it("inmoviliza columnas hasta la pulsada", () => {
    render(<TemplateEditorPage />);
    fireEvent.contextMenu(header("C"), { clientX: 10, clientY: 10 });
    choose("Inmovilizar columnas hasta columna C");
    expect(sent().cellsStyles).toMatchObject({ freezeColumn: 3, freezeRow: 0 });
  });
});

describe("zonas de solo lectura", () => {
  it("protege la selección, la señala y se quita desde el menú", () => {
    render(<TemplateEditorPage />);
    select("A1", "B3");
    openMenu("B2");
    choose("Proteger como solo lectura");

    expect(sent().cellsStyles.readOnlyZones).toMatchObject([{ startCell: "A1", endCell: "B3" }]);
    expect(cell("B2").getAttribute("data-read-only")).toBe("true");
    expect(cell("C2").getAttribute("data-read-only")).toBeNull();

    openMenu("A2");
    choose("Quitar solo lectura (A1:B3)");
    expect(sent().cellsStyles.readOnlyZones).toEqual([]);
  });

  it("el autor sigue editando dentro de la zona", () => {
    render(<TemplateEditorPage />);
    select("A1");
    openMenu("A1");
    choose("Proteger como solo lectura");
    fireEvent.doubleClick(cell("A1"));
    const input = document.querySelector('[data-cell="A1"] input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Grosor" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(sent().cells.A1).toEqual({ formula: "Grosor" });
  });
});

describe("rastreo de celdas", () => {
  it("al seleccionar una fórmula resalta de qué se alimenta y quién la usa", () => {
    render(<TemplateEditorPage />);
    select("C2");
    expect(cell("B7").getAttribute("data-trace")).toBe("precedent");
    expect(cell("D2").getAttribute("data-trace")).toBe("dependent");
    expect(cell("A1").getAttribute("data-trace")).toBeNull();
  });

  it("el panel lista los de otras hojas y lleva a ellos", () => {
    render(<TemplateEditorPage />);
    select("D2");
    fireEvent.click(screen.getByText("Rastreo"));
    expect(screen.getByText("Se alimenta de (2)")).toBeTruthy();
    expect(cell("C2").getAttribute("data-trace")).toBe("precedent");

    fireEvent.click(screen.getByText("Tablas!A2"));
    expect(selectedRefs()).toEqual(["A2"]);
    expect(cell("A2").textContent).toContain("AL-001");
  });
});
