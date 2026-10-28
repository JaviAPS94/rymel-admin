import { useEffect, useMemo, useState } from "react";
import {
  BOM_SUMMARY_COLUMN_WIDTHS,
  bomFingerprint,
  buildBomSummaryCells,
  evaluateBomBase,
  withAccessories,
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
export const designSheets = (design: DesignDetail): SavedSheet[] =>
  design.subDesigns
    .map((subDesign) => subDesign.data)
    .filter((data): data is SavedSheet => data !== null && typeof data === "object");

/**
 * La lista de materiales que ve el cliente en este diseño: la que ajustó, si
 * la ajustó; si no, la base que trajo su plantilla, calculada con los valores
 * del diseño y con los accesorios de su primer elemento; y para diseños sin
 * base, la generada desde la estructura de su referencia. Como el cliente, y
 * con la regla del paquete compartido.
 */
export const useDesignBom = (design: DesignDetail) => {
  const adjustment = useBomAdjustment(design.id);
  const element = design.designElements[0]?.element;
  const sheets = useMemo(() => designSheets(design), [design]);
  const baseSheet = useMemo(() => sheets.find((sheet) => sheet.billOfMaterials), [sheets]);
  const marker = baseSheet?.billOfMaterials;
  const reference = element?.sapReference?.trim() || null;
  // Con base, la estructura es la de la plantilla: no hace falta buscarla
  const structure = useBomForReference(baseSheet ? null : reference);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const [base, setBase] = useState<{ cells: Record<string, BomSummaryCell> } | { error: true } | null>(null);
  useEffect(() => {
    if (!baseSheet) return;
    let cancelled = false;
    evaluateBomBase(baseSheet, sheets)
      .then((cells) => {
        if (!cancelled) setBase({ cells: withAccessories(cells, element ?? { values: [] }) as Record<string, BomSummaryCell> });
      })
      .catch(() => {
        if (!cancelled) setBase({ error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [baseSheet, sheets, element]);

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
    if (adjustment.isLoading) return { status: "loading" };
    if (adjustment.isError) return { status: "error", message: "No se pudo cargar la lista ajustada." };
    if (marker) {
      const structureInfo = { code: marker.structureCode, name: marker.structureName };
      if (base && "error" in base) return { status: "error", message: "No se pudo calcular la lista base del diseño." };
      if (adjustment.data) {
        const changed =
          marker.structureId !== adjustment.data.bomId ||
          (base ? bomFingerprint(base.cells) !== adjustment.data.baseFingerprint : false);
        return {
          status: "ready",
          sheet: asSheet(adjustment.data.cells),
          adjustment: adjustment.data,
          structure: structureInfo,
          changedSinceAdjustment: changed,
        };
      }
      if (!base) return { status: "loading" };
      return { status: "ready", sheet: asSheet(base.cells), adjustment: null, structure: structureInfo, changedSinceAdjustment: false };
    }
    if (reference !== null && structure.isLoading) return { status: "loading" };
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
  }, [adjustment, element, reference, structure, generated, marker, base]);

  /** Desplegar o plegar un semielaborado hijo; solo en la lista generada. */
  const toggle = (nodeId: number) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });

  return { state, reference, toggle, fromTemplate: marker !== undefined };
};
