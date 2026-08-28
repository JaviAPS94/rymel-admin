/**
 * El hook montado de verdad, no una réplica de su lógica.
 *
 * Existe porque los dos fallos que llegaron al usuario —las hojas que no se
 * guardaban y el publicar que decía «no hay cambios»— se colaron entre pruebas
 * que pasaban: probaban funciones puras y el servicio, y ninguna ejercitaba la
 * secuencia real del editor.
 *
 * Aquí se hace lo que hace la interfaz —escribir en una celda, aplicar
 * formato, redimensionar, renombrar— y se comprueba **lo que sale por el
 * serializador**, que es lo único que llega al servidor y de ahí al diseñador.
 */

/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { emptySheetStyles, writeSheet } from "@rymel/design-template";
import type { TemplateDocument } from "@rymel/design-template";
import { useTemplateDocument } from "./useTemplateDocument";

const document = (): TemplateDocument => ({
  name: "Plantilla",
  code: "P_0001",
  type: "DESIGN",
  status: "DRAFT",
  version: 0,
  sheets: [
    { name: "Hoja1", position: 0, cells: {}, styles: emptySheetStyles() },
  ],
});

/** Lo que el guardado enviaría para la hoja activa. */
const payload = (state: ReturnType<typeof useTemplateDocument>) =>
  writeSheet(state.document.sheets.find((sheet) => sheet.name === "Hoja1")!);

describe("lo que el editor acaba enviando", () => {
  it("el formato de una celda llega plano, como lo espera el diseñador", () => {
    const { result } = renderHook(() => useTemplateDocument(document()));

    act(() => result.current.setCellContent("Hoja1", "A1", "Título"));
    act(() =>
      result.current.updateCell("Hoja1", "A1", {
        format: { bold: true, textColor: "#2d6ef0" },
      }),
    );

    // La forma es la de `TEMPLATE_1F_0001`: las propiedades de estilo van
    // sueltas en la celda, no anidadas.
    expect(payload(result.current).cells.A1).toEqual({
      formula: "Título",
      bold: true,
      textColor: "#2d6ef0",
    });
  });

  it("escribir después de dar formato no se lleva el formato por delante", () => {
    // `setCellContent` y `updateCell` escriben sobre el mismo documento; si uno
    // partiera de una copia vieja, el otro desaparecería.
    const { result } = renderHook(() => useTemplateDocument(document()));

    act(() =>
      result.current.updateCell("Hoja1", "B2", {
        format: { border: "1px solid #000" },
      }),
    );
    act(() => result.current.setCellContent("Hoja1", "B2", "10"));

    expect(payload(result.current).cells.B2).toEqual({
      formula: "10",
      border: "1px solid #000",
    });
  });

  it("dar formato después de escribir conserva el contenido", () => {
    const { result } = renderHook(() => useTemplateDocument(document()));

    act(() => result.current.setCellContent("Hoja1", "C3", "=1+1"));
    act(() =>
      result.current.updateCell("Hoja1", "C3", { format: { bold: true } }),
    );

    expect(payload(result.current).cells.C3).toEqual({
      formula: "=1+1",
      bold: true,
    });
  });

  it("el formato aplicado a varias celdas de una selección llega entero", () => {
    // La barra de formato recorre la selección llamando a `updateCell` una vez
    // por celda, todas en el mismo evento.
    const { result } = renderHook(() => useTemplateDocument(document()));

    act(() => {
      for (const ref of ["A1", "B1", "C1"]) {
        result.current.updateCell("Hoja1", ref, {
          format: { border: "1px solid #000" },
        });
      }
    });

    const cells = payload(result.current).cells;
    for (const ref of ["A1", "B1", "C1"]) {
      expect(cells[ref], ref).toEqual({ formula: "", border: "1px solid #000" });
    }
  });

  it("una celda con solo formato no se descarta al guardar", () => {
    const { result } = renderHook(() => useTemplateDocument(document()));

    act(() =>
      result.current.updateCell("Hoja1", "D4", {
        format: { border: "1px solid #000" },
      }),
    );

    expect(payload(result.current).cells.D4).toBeDefined();
  });

  it("los anchos y altos llegan indexados por posición", () => {
    const { result } = renderHook(() => useTemplateDocument(document()));

    act(() =>
      result.current.setSheetStyles("Hoja1", {
        ...emptySheetStyles(),
        columnWidths: { 0: 140 },
        rowHeights: { 2: 40 },
      }),
    );

    const styles = payload(result.current).cellsStyles!;
    expect(styles.columnWidths).toEqual({ 0: 140 });
    expect(styles.rowHeights).toEqual({ 2: 40 });
  });

  it("las celdas combinadas y la inmovilización llegan", () => {
    const { result } = renderHook(() => useTemplateDocument(document()));

    act(() =>
      result.current.setSheetStyles("Hoja1", {
        ...emptySheetStyles(),
        freezeRow: 1,
        mergedCells: [
          { startCell: "A1", endCell: "C1", rowSpan: 1, colSpan: 3 },
        ],
      }),
    );

    const styles = payload(result.current).cellsStyles!;
    expect(styles.freezeRow).toBe(1);
    expect(styles.mergedCells).toHaveLength(1);
  });

  it("varios cambios seguidos se acumulan en lugar de pisarse", () => {
    // Es el caso que más se parece a usar el editor: contenido, formato,
    // estilos de hoja y más contenido, uno detrás de otro.
    const { result } = renderHook(() => useTemplateDocument(document()));

    act(() => result.current.setCellContent("Hoja1", "A1", "Uno"));
    act(() =>
      result.current.updateCell("Hoja1", "A1", { format: { bold: true } }),
    );
    act(() =>
      result.current.setSheetStyles("Hoja1", {
        ...emptySheetStyles(),
        columnWidths: { 0: 200 },
      }),
    );
    act(() => result.current.setCellContent("Hoja1", "A2", "Dos"));

    const persisted = payload(result.current);
    expect(persisted.cells.A1).toEqual({ formula: "Uno", bold: true });
    expect(persisted.cells.A2).toEqual({ formula: "Dos" });
    expect(persisted.cellsStyles!.columnWidths).toEqual({ 0: 200 });
  });

  it("las hojas nuevas quedan en el documento con su posición", () => {
    const { result } = renderHook(() => useTemplateDocument(document()));

    act(() => result.current.addSheet("Tablas"));
    act(() => result.current.setCellContent("Tablas", "A1", "42"));

    expect(result.current.document.sheets.map((sheet) => sheet.name)).toEqual([
      "Hoja1",
      "Tablas",
    ]);
    expect(result.current.dirtySheets.has("Tablas")).toBe(true);
  });

  it("deshacer devuelve el formato anterior", () => {
    const { result } = renderHook(() => useTemplateDocument(document()));

    act(() => result.current.setCellContent("Hoja1", "A1", "Título"));
    act(() =>
      result.current.updateCell("Hoja1", "A1", { format: { bold: true } }),
    );
    act(() => result.current.undo());

    expect(payload(result.current).cells.A1).toEqual({ formula: "Título" });
  });
});
