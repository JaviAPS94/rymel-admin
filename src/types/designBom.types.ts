/**
 * Lo que la lista de materiales lee de un diseño guardado.
 *
 * Es la forma en que `project-front` guarda cada hoja en `sub_design.data`, y
 * solo los campos que la lista usa. No es el modelo de la plantilla
 * (`@rymel/design-template`): un diseño guarda su copia runtime de la hoja,
 * con `value`/`formula`/`computed`, no `content`.
 */

export interface SavedCell {
  value?: string;
  formula?: string;
  computed?: string | number | null;
  itemLink?: { catalogSheetId?: string; catalogTableId: string; itemId: string };
  /** Solo en las celdas de la lista armada: qué semielaborado hijo despliega. */
  bomToggleNodeId?: number;
  bold?: boolean;
  textColor?: string;
  backgroundColor?: string;
}

export interface SavedItemCatalogTable {
  id: string;
  name: string;
  tags?: string[];
  startCell: string;
  endCell: string;
  headerRows: number;
  idColumnOffset: number;
  descriptionColumnOffset: number;
  umColumnOffset: number;
}

export interface SavedSemiFinishedZone {
  id: string;
  semiFinishedId: number;
  semiFinishedCode?: string;
  startCell: string;
  endCell: string;
}

export interface SavedSheet {
  id: string;
  name: string;
  cells: Record<string, SavedCell>;
  semiFinishedZones?: SavedSemiFinishedZone[];
  itemCatalogTables?: SavedItemCatalogTable[];
}

/** Un accesorio del elemento, dentro de `values` con la clave `accesories`. */
export interface Accessory {
  id: number;
  reference?: string;
  description: string;
  unitMeasurement?: string;
  unitOfMeasurement?: string;
  averageCost?: number;
  lastCost?: number;
  value?: number;
  semiFinished?: { id: number; name?: string };
}

export interface DesignElement {
  id: number;
  /** Texto JSON o arreglo, según de dónde venga el elemento. */
  values: unknown;
  sapReference?: string | null;
  norm?: { id: number; name: string } | null;
}

export interface DesignSummary {
  id: number;
  name: string;
  code: string;
  createdAt: string;
  designSubType?: { id: number; name: string } | null;
  designElements: { id: number; element: DesignElement }[];
}

export interface DesignDetail extends DesignSummary {
  subDesigns: { id: number; name: string; code: string; data: SavedSheet }[];
}


/** Estado de la lista de un diseño en el listado de revisión. */
export type BomReviewStatus = 'adjusted' | 'generable' | 'no-structure' | 'no-reference';

export interface BomReviewFilters {
  page: number;
  limit: number;
  normId?: number;
  sapReference?: string;
  status?: BomReviewStatus;
  dateField?: 'created' | 'adjusted';
  from?: string;
  to?: string;
}

export interface BomReviewRow {
  id: number;
  code: string;
  name: string;
  createdAt: string;
  country?: string;
  elements: { id: number; sapReference?: string; normId?: number; normName?: string }[];
  status: BomReviewStatus;
  adjustment: { updatedBy?: string; updatedAt: string } | null;
}

export interface BomReviewPage {
  data: BomReviewRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  norms: { id: number; name: string }[];
}

/** La lista tal como la guardó el cliente (`design_bom_adjustment`). */
export interface BomAdjustment {
  designId: number;
  bomId: number;
  baseFingerprint: string;
  cells: Record<string, SavedCell>;
  expandedNodes: number[];
  updatedBy?: string;
  updatedAt: string;
}
