/**
 * Tipos de la plantilla de diseño.
 *
 * El modelo **no se define aquí**: se reexporta de `@rymel/design-template`.
 * Es la regla que este cambio existe para imponer — mientras cada consumidor
 * declaraba su propia versión de la plantilla, un lado escribía
 * `templateHiddenRows` y el otro leía `hiddenRows`, y las filas que un autor
 * ocultaba reaparecían en la pantalla del diseñador.
 *
 * Lo propio de este repositorio es solo la forma de las peticiones y las
 * respuestas de la API de administración.
 */

export type {
  CellFormat,
  CellItemLink,
  CellKind,
  ConditionalFormat,
  DiagnosticCode,
  GoToConfig,
  ItemCatalogTable,
  MaterialTag,
  MergedCell,
  NamedRange,
  SemiFinishedZone,
  SheetStyles,
  TemplateCell,
  TemplateDiagnostic,
  TemplateDocument,
  TemplateSheet,
} from "@rymel/design-template";

export {
  emptySheetStyles,
  GRID_COLUMNS,
  GRID_ROWS,
  TemplateStatus,
  TemplateType,
} from "@rymel/design-template";

import type {
  TemplateDiagnostic,
  TemplateDocument,
} from "@rymel/design-template";
import type { TemplateStatus, TemplateType } from "@rymel/design-template";

export interface ListTemplatesParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: TemplateType;
  status?: TemplateStatus;
  designSubTypeId?: number;
  includeDeleted?: boolean;
}

/**
 * Una plantilla en el listado.
 *
 * `sheetCount` y `cellCount` están aquí para que una plantilla vacía se
 * distinga de una completa sin abrirla. No es un adorno: tres de las cuatro
 * plantillas que había en producción no tenían una sola hoja y se ofrecían a
 * los diseñadores como si sirvieran.
 */
export interface TemplateListItem {
  id: number;
  name: string;
  code: string;
  description?: string;
  type: TemplateType;
  status: TemplateStatus;
  version: number;
  designSubTypeId?: number;
  designSubTypeName?: string;
  sheetCount: number;
  cellCount: number;
  hasDraft: boolean;
  contractVersion?: string;
  updatedAt: string;
}

export interface PaginatedTemplates {
  items: TemplateListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface TemplateDetail {
  id: number;
  status: TemplateStatus;
  version: number;
  /** Si lo que se recibió son cambios sin publicar. */
  hasDraft: boolean;
  designSubTypeId?: number;
  document: TemplateDocument;
  /**
   * Marca de la última escritura del borrador. Se devuelve al guardar para
   * que el servidor pueda rechazar una escritura basada en una versión que ya
   * quedó atrás.
   */
  draftUpdatedAt?: string;
  diagnostics: TemplateDiagnostic[];
}

export interface CreateTemplateDto {
  name: string;
  code: string;
  description?: string;
  type: TemplateType;
  designSubTypeId: number;
}

export interface UpdateTemplateDto {
  name?: string;
  code?: string;
  description?: string;
  type?: TemplateType;
  designSubTypeId?: number;
}

export interface SaveSheetDto {
  name: string;
  cells: Record<string, unknown>;
  styles?: Record<string, unknown>;
  expectedUpdatedAt?: string;
}

export interface CreateSheetDto {
  name: string;
  expectedUpdatedAt?: string;
}

export interface ReorderSheetsDto {
  names: string[];
  expectedUpdatedAt?: string;
}

export interface DuplicateTemplateDto {
  code: string;
  name?: string;
  designSubTypeId?: number;
}

export interface PublishTemplateDto {
  reason?: string;
  expectedUpdatedAt?: string;
}

export interface PublishResult {
  published: boolean;
  version: number;
  diagnostics: TemplateDiagnostic[];
}

export interface TemplateRevision {
  id: number;
  version: number;
  author?: string;
  reason?: string;
  contractVersion?: string;
  createdAt: string;
}

/** Un campo del elemento que una celda puede declarar como `elementKey`. */
export interface ElementField {
  key: string;
  label: string;
  type: string;
  description?: string;
}
