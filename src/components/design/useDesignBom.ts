import { useMemo, useState } from "react";
import {
  BOM_SUMMARY_COLUMN_WIDTHS,
  bomFingerprint,
  buildBomSummaryCells,
  type BomSummaryCell,
} from "@rymel/design-template";
import { useBomAdjustment, useBomForReference } from "@hooks/useDesigns";
import type { BomAdjustment, DesignDetail, SavedSheet } from "@/types/design.types";

export const BOM_SHEET_NAME = "Lista de materiales";

export type DesignBomState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "unavailable"; message: string }
  | {
      status: "ready";
      sheet: SavedSheet;
      /** La guardó el cliente, o se generó ahora desde la estructura. */
      adjustment: BomAdjustment | null;
      structure?: { code: string; name: string };
      /** La lista generada cambió desde que el cliente la ajustó. */
      changedSinceAdjustment: boolean;
    };

const asSheet = (cells: Record<string, BomSummaryCell>): SavedSheet => ({
  id: "bom",
  name: BOM_SHEET_NAME,
  cells,
  columnWidths: { ...BOM_SUMMARY_COLUMN_WIDTHS },
});

/** Las hojas del diseño, no las de costos: las mismas que usa el cliente. */
const designSheets = (design: DesignDetail): SavedSheet[] =>
  design.subDesigns
    .map((subDesign) => subDesign.data)
    .filter((data): data is SavedSheet => data !== null && typeof data === "object");

/**
 * La lista de materiales que ve el cliente en este diseño: la que ajustó, si
 * la ajustó, o si no la generada con su plantilla y su primer elemento, como
 * la genera él. La regla es la del paquete compartido.
 */
export const useDesignBom = (design: DesignDetail) => {
  const adjustment = useBomAdjustment(design.id);
  const element = design.designElements[0]?.element;
  const reference = element?.sapReference?.trim() || null;
  const structure = useBomForReference(reference);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const sheets = useMemo(() => designSheets(design), [design]);

  const generated = useMemo(() => {
    if (!structure.data || !element) return null;
    try {
      const nodes = adjustment.data ? new Set(adjustment.data.expandedNodes) : expanded;
      return buildBomSummaryCells(structure.data, nodes, sheets, element);
    } catch {
      return undefined;
    }
  }, [structure.data, element, sheets, adjustment.data, expanded]);

  const state = useMemo<DesignBomState>(() => {
    if (adjustment.isLoading || (reference !== null && structure.isLoading)) return { status: "loading" };
    if (adjustment.isError) return { status: "error", message: "No se pudo cargar la lista ajustada." };
    const structureInfo = structure.data ? { code: structure.data.code, name: structure.data.name } : undefined;
    if (adjustment.data) {
      const changed =
        !structure.data ||
        structure.data.id !== adjustment.data.bomId ||
        (generated ? bomFingerprint(generated) !== adjustment.data.baseFingerprint : false);
      return {
        status: "ready",
        sheet: asSheet(adjustment.data.cells),
        adjustment: adjustment.data,
        structure: structureInfo,
        changedSinceAdjustment: changed,
      };
    }
    if (!element) return { status: "unavailable", message: "El diseño no tiene elemento asociado." };
    if (reference === null) {
      return { status: "unavailable", message: "El elemento no tiene referencia ERP: no se puede generar la lista." };
    }
    if (structure.isError) return { status: "error", message: "No se pudo consultar la estructura BOM." };
    if (structure.data === null) {
      return { status: "unavailable", message: `No hay estructura BOM para la referencia ERP ${reference}.` };
    }
    if (generated === undefined) {
      return { status: "error", message: "No se pudo armar la lista con los datos de este diseño." };
    }
    if (!generated) return { status: "loading" };
    return { status: "ready", sheet: asSheet(generated), adjustment: null, structure: structureInfo, changedSinceAdjustment: false };
  }, [adjustment, element, reference, structure, generated]);

  /** Desplegar o plegar un semielaborado hijo; solo en la lista generada. */
  const toggle = (nodeId: number) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });

  return { state, reference, toggle };
};
