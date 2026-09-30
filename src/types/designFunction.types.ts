/**
 * Tipos de la administración de fórmulas de diseño.
 *
 * Las fórmulas son el activo intelectual del negocio: se guardan cifradas y
 * solo el motor cifrado puede evaluarlas. La expresión en claro llega
 * únicamente en el detalle de edición, y solo para administradores.
 */

export const DesignFunctionType = {
  DESIGN: "DESIGN",
  COST: "COST",
} as const;
export type DesignFunctionType =
  (typeof DesignFunctionType)[keyof typeof DesignFunctionType];

/** Fila del listado. Deliberadamente sin la expresión. */
export interface DesignFunctionListItem {
  id: number;
  name: string;
  code: string;
  type: DesignFunctionType;
  description?: string;
  version: number;
  variables: string;
  versionCount: number;
  subTypeCount: number;
  deleted: boolean;
  /** Motivo por el que su código choca con el de otra fórmula activa. */
  codeConflict?: string;
}

export interface PaginatedDesignFunctions {
  items: DesignFunctionListItem[];
  total: number;
  page: number;
  limit: number;
  /** Conflictos heredados entre códigos, para mostrarlos como aviso global. */
  codeConflicts: string[];
}

/** Detalle de edición: incluye la expresión en claro. */
export interface DesignFunctionDetail {
  id: number;
  name: string;
  code: string;
  type: DesignFunctionType;
  description?: string;
  /** Ausente si el motor cifrado no respondió. */
  expression?: string;
  expressionUnavailable?: string;
  variables: string;
  constants: Record<string, number>;
  version: number;
  versionId: number;
  designSubTypeIds: number[];
  /** Fórmulas que invoca su versión vigente. */
  invokes?: FunctionSummary[];
  /** Fórmulas cuya versión vigente la invoca. */
  invokedBy?: FunctionSummary[];
}

/** Una fórmula nombrada, para listarla junto a otra. */
export interface FunctionSummary {
  id: number;
  code: string;
  name: string;
}

export interface DesignFunctionVersion {
  id: number;
  version: number;
  isCurrent: boolean;
  variables: string;
  constants: Record<string, number>;
  createdBy?: string;
  createdAt: string;
}

export interface DesignFunctionImpact {
  designFunctionId: number;
  subTypeCount: number;
  subTypeNames: string[];
  subDesignCount: number;
  designCount: number;
  staleSubDesignCount: number;
  /** Fórmulas que la invocan, directa o indirectamente: sus diseños cuentan como afectados. */
  invokedBy?: FunctionSummary[];
}

export interface ListDesignFunctionsParams {
  page?: number;
  limit?: number;
  type?: DesignFunctionType;
  search?: string;
  designSubTypeId?: number;
  includeDeleted?: boolean;
}

export interface CreateDesignFunctionDto {
  name: string;
  code: string;
  expression: string;
  variables: string;
  constants?: Record<string, number>;
  description?: string;
  type?: DesignFunctionType;
}

/** Cambios de identidad. No publican versión. */
export interface UpdateDesignFunctionDto {
  name?: string;
  code?: string;
  description?: string;
  type?: DesignFunctionType;
}

export interface PublishVersionDto {
  expression: string;
  variables: string;
  constants?: Record<string, number>;
  /** Confirma un cambio que altera el significado de las hojas ya guardadas. */
  acceptWarnings?: boolean;
}

export interface PublishVersionResult {
  version: number;
  versionId: number;
  warnings: string[];
}

export interface TestExpressionDto {
  expression: string;
  parameters: Record<string, number>;
  constants?: Record<string, number>;
  /** Para resolver las fórmulas que invoca, que tienen que ser de su tipo. */
  type?: DesignFunctionType;
}

export interface TestExpressionResult {
  ok: boolean;
  result?: number;
  error?: string;
  missingVariables: string[];
}

export interface StaleSubDesign {
  id: number;
  name: string;
  designId?: number;
  designName?: string;
}

export interface CellChange {
  ref: string;
  formula: string;
  before: unknown;
  after: unknown;
}

export interface RecalculationOutcome {
  subDesignId: number;
  status: "recalculado" | "sin-cambios" | "omitido" | "fallido";
  changedCells: CellChange[];
  reason?: string;
}

export interface RecalculationReport {
  recalculated: number;
  unchanged: number;
  skipped: number;
  failed: number;
  outcomes: RecalculationOutcome[];
}

/** Una constante tal como se edita en el formulario. */
export interface ConstantEntry {
  name: string;
  value: string;
}

export const constantsToEntries = (
  constants: Record<string, number>
): ConstantEntry[] =>
  Object.entries(constants).map(([name, value]) => ({
    name,
    value: String(value),
  }));

export const entriesToConstants = (
  entries: ConstantEntry[]
): Record<string, number> => {
  const constants: Record<string, number> = {};
  for (const entry of entries) {
    const name = entry.name.trim();
    if (name === "") continue;
    constants[name] = Number(entry.value);
  }
  return constants;
};

/**
 * Evaluación por lotes de fórmulas de diseño.
 *
 * El endpoint siempre aceptó un arreglo; es lo que permite que una hoja con
 * cuarenta invocaciones independientes haga una sola petición en vez de
 * cuarenta.
 */
export interface CalculateFunctionsDto {
  functions: { designFunctionId: number; parameters: Record<string, number> }[];
}

export interface CalculateFunctionsResult {
  results: { designFunctionId: number; result: number }[];
}
