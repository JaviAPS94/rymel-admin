/**
 * Los diseños del cliente, tal como los lee el admin.
 *
 * Las hojas son la copia de ejecución que guarda `project-front` en
 * `sub_design.data` (y en `sub_cost.data` las de costos): `value`, `formula`,
 * `computed` y estilos, no el `content` de la plantilla.
 */

import type { BomSourceSheet, BomSummaryCell } from "@rymel/design-template";

export interface NamedOption {
  id: number;
  name: string;
}

export interface SavedCell {
  value?: string;
  formula?: string;
  computed?: string | number | null;
  bold?: boolean;
  textColor?: string;
  backgroundColor?: string;
  border?: string;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  decimals?: number;
  itemLink?: { catalogSheetId?: string; catalogTableId: string; itemId: string };
}

export interface SavedSheet extends BomSourceSheet {
  cells: Record<string, SavedCell>;
  columnWidths?: Record<number, number>;
  rowHeights?: Record<number, number>;
  templateHiddenRows?: number[];
  templateHiddenColumns?: number[];
  freezeRow?: number;
  freezeColumn?: number;
  mergedCells?: { startCell: string; endCell: string; rowSpan: number; colSpan: number }[];
}

export interface DesignElement {
  id: number;
  /** Texto JSON o arreglo, según de dónde venga el elemento. */
  values: unknown;
  sapReference?: string | null;
  norm?: (NamedOption & { country?: NamedOption | null }) | null;
}

export interface DesignDetail {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  designSubType?: (NamedOption & { designType?: NamedOption | null }) | null;
  designElements: { id: number; element: DesignElement }[];
  subDesigns: { id: number; name: string; code: string; data: SavedSheet }[];
  cost: {
    id: number;
    name: string;
    subCosts: { id: number; name: string; code: string; data: SavedSheet }[];
  } | null;
}

export interface DesignFilters {
  page: number;
  limit: number;
  search?: string;
  normId?: number;
  countryId?: number;
  designTypeId?: number;
  designSubtypeId?: number;
  sapReference?: string;
  dateField?: "created" | "updated";
  from?: string;
  to?: string;
  stale?: boolean;
  adjusted?: boolean;
}

export interface DesignRow {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  designType?: NamedOption;
  designSubType?: NamedOption;
  elements: { id: number; sapReference?: string; norm?: NamedOption; country?: NamedOption }[];
  stale: boolean;
  bomAdjustment: { updatedBy?: string; updatedAt: string } | null;
}

export interface DesignPage {
  data: DesignRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  options: {
    norms: NamedOption[];
    countries: NamedOption[];
    designTypes: NamedOption[];
    designSubTypes: (NamedOption & { designTypeId?: number })[];
  };
}

export interface SubDesignVersions {
  subDesignId: number;
  name: string;
  stale: boolean;
  functions: {
    functionId: number;
    code?: string;
    name?: string;
    usedVersion?: number;
    currentVersion?: number;
  }[];
}

export interface RecalculationReport {
  recalculated: number;
  unchanged: number;
  skipped: number;
  failed: number;
  outcomes: {
    subDesignId: number;
    status: "recalculado" | "sin-cambios" | "omitido" | "fallido";
    changedCells: { ref: string; formula: string; before: unknown; after: unknown }[];
    reason?: string;
  }[];
}

/** La lista de materiales que guardó el cliente (`design_bom_adjustment`). */
export interface BomAdjustment {
  designId: number;
  bomId: number;
  baseFingerprint: string;
  cells: Record<string, BomSummaryCell>;
  expandedNodes: number[];
  updatedBy?: string;
  updatedAt: string;
}
