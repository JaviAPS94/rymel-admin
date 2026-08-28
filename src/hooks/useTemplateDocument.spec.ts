/**
 * Estas pruebas cubren lo que distingue este hook de recalcular hoja por hoja:
 * que el grafo sea uno solo para toda la plantilla. Es la diferencia entre
 * que editar `Tablas!J14` actualice el `BUSCARV` de `Resumen` o no lo haga.
 *
 * No montan React: el hook se ejerce con `renderHook` de `@testing-library`
 * cuando hace falta, pero la lógica que importa —el libro plano, el grafo y el
 * recálculo— está en funciones puras que se pueden probar directamente.
 */

import { describe, expect, it } from "vitest";
import {
  buildGraph,
  buildRegistry,
  evaluateCell,
  evaluateFormula,
  getRecalcOrder,
  splitRef,
  updateCellInGraph,
  FORMULA_CIRCULAR,
  type CellValueMap,
} from "@rymel/formula-engine";
import { bookRef, emptySheetStyles } from "@rymel/design-template";
import { renameInFormula } from "./useTemplateDocument";
import { normalizeDecimalComma } from "@rymel/design-template";
import type { TemplateDocument, TemplateSheet } from "@rymel/design-template";

const sheet = (
  name: string,
  cells: Record<string, string>,
  position = 0,
): TemplateSheet => ({
  name,
  position,
  cells: Object.fromEntries(
    Object.entries(cells).map(([ref, content]) => [ref, { content }]),
  ),
  styles: emptySheetStyles(),
});

const doc = (sheets: TemplateSheet[]): TemplateDocument => ({
  name: "Plantilla",
  code: "P_0001",
  type: "DESIGN",
  status: "DRAFT",
  version: 0,
  sheets: sheets.map((s, position) => ({ ...s, position })),
});

/** El mismo aplanado que usa el hook. */
const toBook = (template: TemplateDocument): Record<string, { formula: string }> => {
  const book: Record<string, { formula: string }> = {};
  for (const s of template.sheets) {
    for (const [ref, cell] of Object.entries(s.cells)) {
      book[bookRef(s.name, ref)] = { formula: cell.content };
    }
  }
  return book;
};

const calculate = (
  template: TemplateDocument,
  designFunctions: { code: string; variables: string[] }[] = [],
): CellValueMap => {
  const book = toBook(template);
  const graph = buildGraph(book);
  const { order, circular } = getRecalcOrder(graph, Object.keys(book));
  const registry = buildRegistry(designFunctions);
  const values: CellValueMap = {};

  const knownSheets = new Set(
    Object.keys(book)
      .map((ref) => splitRef(ref).sheet)
      .filter((name): name is string => name !== undefined),
  );

  const evaluate = (ref: string) => {
    const evaluation = evaluateCell(book[ref]?.formula ?? "", values, {
      sheet: splitRef(ref).sheet,
      knownSheets,
      customFunctions: registry,
    });
    values[ref] = evaluation.status === "ok" ? evaluation.value : "…";
  };

  const ordered = new Set(order);
  for (const ref of Object.keys(book)) if (!ordered.has(ref)) evaluate(ref);
  for (const ref of order) evaluate(ref);
  for (const ref of circular) values[ref] = FORMULA_CIRCULAR;

  return values;
};

describe("libro plano de toda la plantilla", () => {
  it("una edición en una hoja recalcula la dependiente de otra hoja", () => {
    const template = doc([
      sheet("Tablas", { B2: "1000", C2: "5", B3: "3000", C3: "9" }),
      sheet("Resumen", {
        G13: "3000",
        G17: "=BUSCARV(G13;Tablas!B2:Tablas!C3;2;TRUE)",
      }),
    ]);

    const book = toBook(template);
    const graph = buildGraph(book);

    // Es la comprobación que separa un grafo por plantilla de uno por hoja.
    const { order } = getRecalcOrder(graph, [bookRef("Tablas", "C3")]);
    expect(order).toContain(bookRef("Resumen", "G17"));
  });

  it("calcula el valor a través de las hojas", () => {
    const values = calculate(
      doc([
        sheet("Tablas", { B2: "1000", C2: "5", B3: "3000", C3: "9" }),
        sheet("Resumen", {
          G13: "3000",
          G17: "=BUSCARV(G13;Tablas!B2:Tablas!C3;2;TRUE)",
        }),
      ]),
    );

    expect(values[bookRef("Resumen", "G17")]).toBe(9);
  });

  it("un cambio en una celda interior del rango arrastra el recálculo", () => {
    const template = doc([
      sheet("Tablas", { B45: "1", C45: "2", B46: "3", C46: "4", B47: "5", C47: "6" }),
      sheet("Resumen", { A1: "=SUMA(Tablas!B45:Tablas!C47)" }),
    ]);

    const graph = buildGraph(toBook(template));
    const { order } = getRecalcOrder(graph, [bookRef("Tablas", "C46")]);

    expect(order).toContain(bookRef("Resumen", "A1"));
  });

  it("actualiza el grafo al reescribir una fórmula", () => {
    const template = doc([
      sheet("Tablas", { A1: "1", A2: "2" }),
      sheet("Resumen", { B1: "=Tablas!A1" }),
    ]);

    const graph = buildGraph(toBook(template));
    updateCellInGraph(graph, bookRef("Resumen", "B1"), "=Tablas!A2");

    expect(getRecalcOrder(graph, [bookRef("Tablas", "A2")]).order).toContain(
      bookRef("Resumen", "B1"),
    );
    expect(getRecalcOrder(graph, [bookRef("Tablas", "A1")]).order).not.toContain(
      bookRef("Resumen", "B1"),
    );
  });
});

describe("ciclos entre hojas", () => {
  it("marca como circulares las celdas de un ciclo que cruza hojas", () => {
    const values = calculate(
      doc([
        sheet("Resumen", { A1: "=Tablas!B1+1" }),
        sheet("Tablas", { B1: "=Resumen!A1+1" }),
      ]),
    );

    expect(values[bookRef("Resumen", "A1")]).toBe(FORMULA_CIRCULAR);
    expect(values[bookRef("Tablas", "B1")]).toBe(FORMULA_CIRCULAR);
  });
});

describe("fórmulas de diseño", () => {
  it("las deja pendientes en vez de darlas por erróneas", () => {
    // El editor calcula en local; solo el servidor puede resolverlas. Si se
    // marcaran como error, una plantilla correcta se vería llena de `#ERROR`
    // mientras se escribe.
    const values = calculate(
      doc([sheet("Resumen", { A1: "5", A2: "=QUADRATIC(A1)" })]),
      [{ code: "QUADRATIC", variables: ["x"] }],
    );

    expect(values[bookRef("Resumen", "A2")]).toBe("…");
    expect(values[bookRef("Resumen", "A1")]).toBe(5);
  });
});

describe("celdas de gráfico", () => {
  it("conservan su directiva y no aportan dependencias", () => {
    const template = doc([
      sheet("Resumen", { D56: "10", K73: "DRAW:BOBINADO:D56:D59,D60" }),
    ]);

    const values = calculate(template);
    expect(values[bookRef("Resumen", "K73")]).toBe("DRAW:BOBINADO:D56:D59,D60");

    const graph = buildGraph(toBook(template));
    expect(graph.precedents.has(bookRef("Resumen", "K73"))).toBe(false);
  });
});

describe("renombrado de hoja", () => {
  /**
   * El renombrado deja el rango en su forma canónica: `Tablas!B2:Tablas!C3`
   * pasa a `Datos!B2:C3` y no a `Datos!B2:Datos!C3`. Son equivalentes —el
   * motor entiende las dos, y la prueba de abajo lo comprueba en vez de
   * afirmarlo—, y ya que la fórmula se reescribe, se reescribe una sola vez y
   * bien.
   */
  it("reescribe las referencias a la hoja renombrada", () => {
    expect(
      renameInFormula("=BUSCARV(G13;Tablas!B2:Tablas!C3;2;TRUE)", "Tablas", "Datos"),
    ).toBe("=BUSCARV(G13;Datos!B2:C3;2;TRUE)");
  });

  it("la forma canónica del rango da el mismo resultado que la original", () => {
    const valores = {
      "Datos!B2": 1000,
      "Datos!C2": 5,
      "Datos!B3": 3000,
      "Datos!C3": 9,
    };

    expect(evaluateFormula("=BUSCARV(3000;Datos!B2:Datos!C3;2;TRUE)", valores)).toBe(
      evaluateFormula("=BUSCARV(3000;Datos!B2:C3;2;TRUE)", valores),
    );
  });

  it("entrecomilla el nombre nuevo cuando lo necesita", () => {
    expect(renameInFormula("=Tablas!A1", "Tablas", "Tabla de datos")).toBe(
      "='Tabla de datos'!A1",
    );
  });

  it("lee el nombre viejo aunque venga entrecomillado", () => {
    expect(renameInFormula("='Template 1F'!A11", "Template 1F", "Datos")).toBe(
      "=Datos!A11",
    );
  });

  it("no toca las referencias a otras hojas", () => {
    expect(renameInFormula("=Otra!A1+Tablas!B1", "Tablas", "Datos")).toBe(
      "=Otra!A1+Datos!B1",
    );
  });

  it("deja en paz los literales", () => {
    expect(renameInFormula("Tablas!A1 no es una fórmula", "Tablas", "Datos")).toBe(
      "Tablas!A1 no es una fórmula",
    );
  });

  it("conserva el rango entero al renombrar sus dos extremos", () => {
    expect(renameInFormula("=SUMA(Tablas!B2:Tablas!C3)", "Tablas", "Datos")).toBe(
      "=SUMA(Datos!B2:C3)",
    );
  });
});

describe("decimales escritos con coma", () => {
  it("se convierten al escribirlos", () => {
    // Es el mismo `normalizeDecimalComma` que aplica `setCellContent`.
    expect(normalizeDecimalComma("3,36")).toBe("3.36");
    expect(normalizeDecimalComma("0,022")).toBe("0.022");
  });

  it("no se toca lo que no es un número con coma", () => {
    // Escribir una fórmula con separador regional, o un texto con coma, no
    // puede reescribirse: sería corromper lo que el autor quiso decir.
    for (const content of [
      "=BUSCARV(A1;B1:C2;2;FALSO)",
      "=SUMA(1,2)",
      "Aislamiento (0,25 mm)",
      "DRAW:FRONTAL:NUCLEO:H53,H54",
      "Aluminio, Cobre",
    ]) {
      expect(normalizeDecimalComma(content), content).toBe(content);
    }
  });

  it("una vez convertido, el motor sí lo calcula", () => {
    const values = calculate(
      doc([
        sheet("Resumen", {
          A1: normalizeDecimalComma("3,36"),
          A2: normalizeDecimalComma("1,64"),
          A3: "=A1+A2",
        }),
      ]),
    );

    expect(values[bookRef("Resumen", "A3")]).toBe(5);
  });

  /**
   * Esto es lo que de verdad justifica la normalización, y es peor de lo que
   * parece: sin convertir, las fórmulas **no fallan, calculan mal**.
   *
   * El operador `+` coacciona el texto a número truncando en la coma, igual
   * que hacía el evaluador anterior. Y no todas las funciones se comportan
   * igual: `SUMA` ignora lo no numérico y devuelve cero. La misma celda da un
   * número distinto según qué la lea, y ninguno es el correcto.
   */
  it("sin convertir, las fórmulas calculan mal en silencio", () => {
    const values = calculate(
      doc([
        sheet("Resumen", {
          A1: "3,36",
          A2: "1,64",
          A3: "=A1+A2",
          A4: "=SUMA(A1:A2)",
          A5: "=A1*2",
        }),
      ]),
    );

    // 3,36 + 1,64 son 5. El `+` trunca a 3 y 1.
    expect(values[bookRef("Resumen", "A3")]).toBe(4);
    // `SUMA` ni siquiera trunca: los ignora.
    expect(values[bookRef("Resumen", "A4")]).toBe(0);
    // 3,36 × 2 son 6.72.
    expect(values[bookRef("Resumen", "A5")]).toBe(6);
  });

  it("convertidos, dan el número que el autor escribió", () => {
    const values = calculate(
      doc([
        sheet("Resumen", {
          A1: normalizeDecimalComma("3,36"),
          A2: normalizeDecimalComma("1,64"),
          A3: "=A1+A2",
          A4: "=SUMA(A1:A2)",
          A5: "=A1*2",
        }),
      ]),
    );

    expect(values[bookRef("Resumen", "A3")]).toBe(5);
    expect(values[bookRef("Resumen", "A4")]).toBe(5);
    expect(values[bookRef("Resumen", "A5")]).toBe(6.72);
  });
});
