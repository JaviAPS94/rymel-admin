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

export interface PaginatedDesigns {
  data: DesignSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
