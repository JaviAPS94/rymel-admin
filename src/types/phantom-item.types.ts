export type FormulaOverrides = Record<string, string>;

/** Values of a process's own columns, by key (`custom:plan1`…) */
export type ExtraValues = Record<string, string>;

export interface PhantomItemComponent {
  id: number;
  sortOrder: number;
  componentItemCode: string;
  description?: string;
  baseQuantity: number;
  requiredQuantity: number;
  requiredQuantityPerUnit?: number;
  componentUnitOfMeasure?: string;
  wastePercentage?: number;
  consumptionWarehouse?: string;
  formulaOverrides: FormulaOverrides;
  extraValues: ExtraValues;
}

export interface PhantomItem {
  id: number;
  finishedProductType: string;
  workInProcessType: string;
  phantomRootCode: string;
  kvaRatingStandard?: string;
  itemCode: string;
  reference: string;
  itemDescription: string;
  shortDescription: string;
  unitOfMeasure?: string;
  referenceLengthLimit: number;
  referenceLength: number;
  itemDescriptionLength: number;
  shortDescriptionLength: number;
  formulaOverrides: FormulaOverrides;
  componentsCount: number;
  processId: number;
  familyId: number | null;
  familyName: string | null;
  extraValues: ExtraValues;
}

export interface PhantomItemDetail extends PhantomItem {
  components: PhantomItemComponent[];
}

export interface PhantomItemListResponse {
  data: PhantomItem[];
  total: number;
  page: number;
  limit: number;
}

export interface PhantomItemsFilters {
  page?: number;
  limit?: number;
  search?: string;
  finishedProductType?: string;
  workInProcessType?: string;
  phantomRootCode?: string;
  processId?: number;
  familyId?: number;
}

export interface CreatePhantomItemComponentDto {
  componentItemCode: string;
  description?: string;
  baseQuantity: number;
  requiredQuantity: number;
  requiredQuantityPerUnit?: number;
  componentUnitOfMeasure?: string;
  wastePercentage?: number;
  consumptionWarehouse?: string;
  sortOrder?: number;
  formulaOverrides?: FormulaOverrides;
  extraValues?: ExtraValues;
}

export interface CreatePhantomItemDto {
  finishedProductType: string;
  workInProcessType: string;
  phantomRootCode: string;
  kvaRatingStandard?: string;
  itemCode: string;
  reference?: string;
  itemDescription?: string;
  shortDescription?: string;
  unitOfMeasure?: string;
  referenceLengthLimit?: number;
  formulaOverrides?: FormulaOverrides;
  components?: CreatePhantomItemComponentDto[];
  processId?: number;
  /** Found or created in the process by name; empty clears the family */
  familyName?: string;
  familyId?: number | null;
  extraValues?: ExtraValues;
}

export type UpdatePhantomItemDto = Partial<CreatePhantomItemDto>;

export const PhantomItemImportMode = {
  CREATE: "create",
  UPSERT: "upsert",
} as const;

export type PhantomItemImportMode =
  (typeof PhantomItemImportMode)[keyof typeof PhantomItemImportMode];

export interface ImportIssue {
  /** Sheet of the workbook; absent for a paste */
  sheet?: string;
  row: number;
  column?: string;
  message: string;
}

export interface ImportResult {
  dryRun: boolean;
  created: number;
  updated: number;
  skipped: number;
  rowsRead: number;
  phantomItemsDetected: number;
  errors: ImportIssue[];
  warnings: ImportIssue[];
  sheets: SheetImportSummary[];
}

/** What happened with one sheet of the workbook */
export interface SheetImportSummary {
  sheet: string;
  /** Absent for a new process in a preview */
  processId?: number;
  processName: string;
  newProcess: boolean;
  hidden: boolean;
  /** The process's reference rule; inferred from the sheet for a new one */
  referenceSeparator?: string;
  phantomItemsDetected: number;
  created: number;
  updated: number;
  skipped: number;
  /** Existing items that come from another process and move to this one */
  moved: number;
  ignoredColumns: string[];
  /** Columns a new process would be created with */
  columns: ProcessColumn[];
}

export const ProcessColumnScope = {
  HEADER: "HEADER",
  COMPONENT: "COMPONENT",
} as const;

export type ProcessColumnScope =
  (typeof ProcessColumnScope)[keyof typeof ProcessColumnScope];

/**
 * A column of a process: a catalog field (`requiredQuantity`) with the header
 * the process uses for it, or an own column (`custom:plan1`).
 */
export interface ProcessColumn {
  key: string;
  header: string;
  scope: ProcessColumnScope;
}

export interface PhantomFamily {
  id: number;
  name: string;
  phantomItemsCount: number;
}

export interface PhantomProcess {
  id: number;
  name: string;
  position: number;
  /**
   * What goes between «Raiz Fantasma» and «R kVA + Norma / Otros» in the
   * reference: "" (the kVA brings its own) or " " (the formula adds a space).
   */
  referenceSeparator: string;
  columns: ProcessColumn[];
  families: PhantomFamily[];
  phantomItemsCount: number;
}

export interface PhantomItemExpectedColumn {
  letter: string;
  header: string;
  field: string;
  derived: boolean;
}
