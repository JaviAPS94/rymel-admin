export type FormulaOverrides = Record<string, string>;

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
}

export type UpdatePhantomItemDto = Partial<CreatePhantomItemDto>;

export const PhantomItemImportMode = {
  CREATE: "create",
  UPSERT: "upsert",
} as const;

export type PhantomItemImportMode =
  (typeof PhantomItemImportMode)[keyof typeof PhantomItemImportMode];

export interface ImportIssue {
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
}

export interface PhantomItemExpectedColumn {
  letter: string;
  header: string;
  field: string;
  derived: boolean;
}
