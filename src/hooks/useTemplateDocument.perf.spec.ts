/**
 * Presupuesto de rendimiento del editor.
 *
 * A la escala de la plantilla real: `Resumen` con 440 celdas y `Tablas` con
 * 1598, hasta la fila 232 y la columna `AH`. El documento se genera con esa
 * forma en vez de incrustar los 141 KB reales, porque lo que aquí se mide es
 * la escala, no el contenido —de la corrección sobre datos reales se encargan
 * las pruebas del motor y las del contrato—.
 *
 * Los umbrales son deliberadamente holgados: no persiguen un número bonito,
 * sino detectar el día en que una edición pase de milisegundos a segundos.
 */

import { describe, expect, it } from "vitest";
import {
  buildGraph,
  buildRegistry,
  evaluateCell,
  getRecalcOrder,
  splitRef,
  updateCellInGraph,
  type CellValueMap,
} from "@rymel/formula-engine";
import { columnIndexToLabel } from "@rymel/formula-engine";

const RESUMEN_CELLS = 440;
const TABLAS_CELLS = 1598;

type Book = Record<string, { formula: string }>;

/** Un libro con la forma y el tamaño de la plantilla real. */
const buildRealisticBook = (): Book => {
  const book: Book = {};

  // `Tablas`: una tabla de consulta, casi toda literales, hasta la fila 232.
  let written = 0;
  for (let row = 1; row <= 232 && written < TABLAS_CELLS; row++) {
    for (let column = 0; column < 8 && written < TABLAS_CELLS; column++) {
      const ref = `${columnIndexToLabel(column)}${row}`;
      book[`Tablas!${ref}`] = { formula: String(row * 10 + column) };
      written++;
    }
  }
  book["Tablas!B10"] = { formula: "=SUMA(B2:B9)" };

  // `Resumen`: literales, formato y ocho fórmulas, dos de ellas contra
  // `Tablas` con rango calificado en los dos extremos, como las reales.
  written = 0;
  for (let row = 1; row <= 73 && written < RESUMEN_CELLS; row++) {
    for (let column = 0; column < 34 && written < RESUMEN_CELLS; column++) {
      const ref = `${columnIndexToLabel(column)}${row}`;
      book[`Resumen!${ref}`] = { formula: String(row + column) };
      written++;
    }
  }
  book["Resumen!C6"] = {
    formula: "=AE42*(BUSCARV(I39;Tablas!B45:Tablas!C156;2;FALSE))",
  };
  book["Resumen!G17"] = {
    formula: "=G14*(BUSCARV(G13;Tablas!B3:Tablas!C10;2;FALSE))",
  };
  book["Resumen!T28"] = { formula: "=Tablas!C231" };
  book["Resumen!AE30"] = { formula: "=AE28*AE29+I22/100+8.3" };
  book["Resumen!AH29"] = { formula: "=AE28*AE29" };
  book["Resumen!I39"] = { formula: "=Q14*10^6/(2.22*I34*I35*I36)" };
  book["Resumen!K73"] = { formula: "DRAW:BOBINADO:D56:D59,D60,D61,D62" };

  return book;
};

const recalculate = (
  graph: ReturnType<typeof buildGraph>,
  book: Book,
  dirty: string[],
  previous: CellValueMap,
): CellValueMap => {
  const { order, circular } = getRecalcOrder(graph, dirty);
  const values: CellValueMap = { ...previous };
  const registry = buildRegistry([]);
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
  for (const ref of dirty) if (!ordered.has(ref)) evaluate(ref);
  for (const ref of order) evaluate(ref);
  for (const ref of circular) values[ref] = "#CIRCULAR";

  return values;
};

describe("rendimiento a la escala de la plantilla real", () => {
  const book = buildRealisticBook();

  it("el libro tiene el tamaño de la plantilla real", () => {
    expect(Object.keys(book).length).toBeGreaterThan(2000);
  });

  it("construye el grafo del libro completo en menos de 250 ms", () => {
    const started = performance.now();
    buildGraph(book);
    const elapsed = performance.now() - started;

    expect(elapsed).toBeLessThan(250);
  });

  it("calcula el libro entero al abrirlo en menos de 1 s", () => {
    const graph = buildGraph(book);

    const started = performance.now();
    recalculate(graph, book, Object.keys(book), {});
    const elapsed = performance.now() - started;

    expect(elapsed).toBeLessThan(1000);
  });

  it("recalcula una edición suelta en menos de 50 ms", () => {
    // Es lo que decide si se puede teclear: en una edición solo entran la
    // celda tocada y sus dependientes, no las 2000.
    const graph = buildGraph(book);
    const values = recalculate(graph, book, Object.keys(book), {});

    const target = "Tablas!C5";
    book[target] = { formula: "999" };
    updateCellInGraph(graph, target, "999");

    const started = performance.now();
    recalculate(graph, book, [target], values);
    const elapsed = performance.now() - started;

    expect(elapsed).toBeLessThan(50);
  });

  it("una edición dentro de un rango consultado sigue siendo barata", () => {
    // `Tablas!C100` está dentro de `Tablas!B45:Tablas!C156`, que `Resumen!C6`
    // consulta: el recálculo la arrastra, y aun así no puede costar caro.
    const graph = buildGraph(book);
    const values = recalculate(graph, book, Object.keys(book), {});

    const target = "Tablas!C100";
    updateCellInGraph(graph, target, "42");
    book[target] = { formula: "42" };

    const started = performance.now();
    const updated = recalculate(graph, book, [target], values);
    const elapsed = performance.now() - started;

    expect(elapsed).toBeLessThan(50);
    expect(updated["Resumen!C6"]).toBeDefined();
  });
});
