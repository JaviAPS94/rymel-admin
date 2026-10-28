import { useMemo } from "react";
import type { DepGraph } from "@rymel/formula-engine";
import {
  templateCellLookup,
  traceCell,
  type CellTrace,
  type TemplateDocument,
  type TraceOptions,
} from "@rymel/design-template";

/**
 * De qué se alimenta una celda y a quién alimenta.
 *
 * La lógica vive en `@rymel/design-template`, compartida con el diseñador del
 * cliente: las dos pantallas tienen que explicar una celda igual. Aquí solo se
 * le da la plantilla y el grafo con el que el editor recalcula, y no otro: el
 * rastreo existe para entender ese recálculo.
 */
export type {
  CellTrace,
  DesignCall,
  TraceNode,
  TraceOptions,
  TraceOrigin,
  TraceRef,
} from "@rymel/design-template";

/**
 * El rastreo de la celda activa. `version` es cualquier valor que cambie cuando
 * cambia el grafo —los valores calculados lo hacen—, porque el grafo se
 * modifica en sitio y no avisa.
 */
export const useCellTrace = (
  document: TemplateDocument,
  getGraph: () => DepGraph,
  sheetName: string,
  ref: string,
  options: TraceOptions,
  version: unknown,
): CellTrace =>
  useMemo(
    () => traceCell(templateCellLookup(document), getGraph(), sheetName, ref, options),
    // `options` se desestructura para no depender de su identidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [document, getGraph, sheetName, ref, options.full, options.designFunctionCodes, version],
  );
