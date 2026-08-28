/**
 * Las columnas de longitud del fantasma.
 *
 * La reproducción usa lo que había guardado de verdad en R345343: cabecera
 * completa, cero componentes y ningún override propio.
 */

/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePhantomItemGrid } from "./usePhantomItemGrid";
import type { PhantomItemDetail } from "@/types/phantom-item.types";

const detail = (
  formulaOverrides: Record<string, string> = {},
): PhantomItemDetail =>
  ({
    id: 1,
    finishedProductType: "1V",
    workInProcessType: "YU",
    phantomRootCode: "RT",
    kvaRatingStandard: "15",
    itemCode: "R345343",
    reference: "F-1V-YU-RT15",
    itemDescription: "F-1V-YU-RT15",
    shortDescription: "FANTASMA RT",
    unitOfMeasure: "U",
    referenceLengthLimit: 40,
    formulaOverrides,
    components: [],
  }) as unknown as PhantomItemDetail;

const lengths = (grid: ReturnType<typeof usePhantomItemGrid>, row: number) => ({
  G: grid.getCell("G", row).computed,
  I: grid.getCell("I", row).computed,
  K: grid.getCell("K", row).computed,
});

describe("las columnas de longitud", () => {
  it("la fila cargada calcula igual que una fila nueva", () => {
    // Era el fallo: la fila 1 venía del servidor y las siguientes del editor,
    // y solo la primera daba `#ERROR` en G, I y K.
    const { result } = renderHook(() => usePhantomItemGrid(detail()));

    act(() => result.current.addRow());

    expect(lengths(result.current, 1)).toEqual({ G: 12, I: 12, K: 11 });
    expect(lengths(result.current, 2)).toEqual(lengths(result.current, 1));
  });

  it("una fórmula guardada en el dialecto del servidor se traduce", () => {
    // El servidor mide campos por su nombre porque calcula sin rejilla.
    // `=LARGO(reference)` no es evaluable aquí: hay que llevarlo a la celda.
    const { result } = renderHook(() =>
      usePhantomItemGrid(
        detail({
          referenceLength: "=LARGO(reference)",
          itemDescriptionLength: "=LARGO(itemDescription)",
          shortDescriptionLength: "=LARGO(shortDescription)",
        }),
      ),
    );

    expect(result.current.getCell("G", 1).formula).toBe("=LARGO(F1)");
    expect(lengths(result.current, 1)).toEqual({ G: 12, I: 12, K: 11 });
  });

  it("una fórmula que ya venga en referencias de celda se respeta", () => {
    const { result } = renderHook(() =>
      usePhantomItemGrid(detail({ referenceLength: "=LARGO(J1)" })),
    );

    expect(result.current.getCell("G", 1).formula).toBe("=LARGO(J1)");
    expect(result.current.getCell("G", 1).computed).toBe(11);
  });
});
