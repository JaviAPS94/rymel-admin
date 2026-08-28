import { apiClient } from "./api";
import type {
  CreateSheetDto,
  CreateTemplateDto,
  DuplicateTemplateDto,
  ElementField,
  ListTemplatesParams,
  PaginatedTemplates,
  PublishResult,
  PublishTemplateDto,
  ReorderSheetsDto,
  SaveSheetDto,
  TemplateDetail,
  TemplateRevision,
  UpdateTemplateDto,
} from "@/types/template.types";

/**
 * Bajo `admin/`, separada de `design/templates/:subTypeId`, que es la que
 * consume la biblioteca del diseñador. La frontera es deliberada: aquí viven
 * las operaciones que cambian lo que los diseñadores acabarán cargando.
 */
const BASE = "/admin/templates";

export const templateService = {
  async list(params: ListTemplatesParams): Promise<PaginatedTemplates> {
    const response = await apiClient.get<PaginatedTemplates>(BASE, { params });
    return response.data;
  },

  async detail(id: number): Promise<TemplateDetail> {
    const response = await apiClient.get<TemplateDetail>(`${BASE}/${id}`);
    return response.data;
  },

  async create(dto: CreateTemplateDto): Promise<TemplateDetail> {
    const response = await apiClient.post<TemplateDetail>(BASE, dto);
    return response.data;
  },

  async update(id: number, dto: UpdateTemplateDto): Promise<TemplateDetail> {
    const response = await apiClient.put<TemplateDetail>(`${BASE}/${id}`, dto);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },

  async createSheet(id: number, dto: CreateSheetDto): Promise<TemplateDetail> {
    const response = await apiClient.post<TemplateDetail>(
      `${BASE}/${id}/sheets`,
      dto,
    );
    return response.data;
  },

  /**
   * Guarda una sola hoja.
   *
   * Se envía la hoja que se tocó y no el documento entero: la hoja más grande
   * que hay guardada son 236 KB, y reenviarla completa cada vez que se corrige
   * un rótulo es desperdicio en cada guardado.
   */
  async saveSheet(
    id: number,
    sheetName: string,
    dto: SaveSheetDto,
  ): Promise<TemplateDetail> {
    const response = await apiClient.put<TemplateDetail>(
      `${BASE}/${id}/sheets/${encodeURIComponent(sheetName)}`,
      dto,
    );
    return response.data;
  },

  async deleteSheet(id: number, sheetName: string): Promise<TemplateDetail> {
    const response = await apiClient.delete<TemplateDetail>(
      `${BASE}/${id}/sheets/${encodeURIComponent(sheetName)}`,
    );
    return response.data;
  },

  /**
   * Fija la lista de hojas del borrador: cuáles hay y en qué orden.
   *
   * `PUT` sobre la colección, no sobre una hoja. El editor añade, renombra,
   * elimina y reordena en memoria; esto es lo que lleva esa estructura al
   * servidor sin tener que mandar el contenido de todas.
   */
  async setSheets(id: number, dto: ReorderSheetsDto): Promise<TemplateDetail> {
    const response = await apiClient.put<TemplateDetail>(
      `${BASE}/${id}/sheets`,
      dto,
    );
    return response.data;
  },

  /**
   * Publica el borrador.
   *
   * Devuelve `published: false` con los diagnósticos cuando el servidor
   * rechaza: no es un error de red ni una excepción, es la respuesta normal a
   * una plantilla que todavía no está lista.
   */
  async publish(id: number, dto: PublishTemplateDto = {}): Promise<PublishResult> {
    const response = await apiClient.post<PublishResult>(
      `${BASE}/${id}/publish`,
      dto,
    );
    return response.data;
  },

  async discardDraft(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}/draft`);
  },

  async duplicate(
    id: number,
    dto: DuplicateTemplateDto,
  ): Promise<TemplateDetail> {
    const response = await apiClient.post<TemplateDetail>(
      `${BASE}/${id}/duplicate`,
      dto,
    );
    return response.data;
  },

  async revisions(id: number): Promise<TemplateRevision[]> {
    const response = await apiClient.get<TemplateRevision[]>(
      `${BASE}/${id}/revisions`,
    );
    return response.data;
  },

  async restoreRevision(
    id: number,
    revisionId: number,
  ): Promise<TemplateDetail> {
    const response = await apiClient.post<TemplateDetail>(
      `${BASE}/${id}/revisions/${revisionId}/restore`,
    );
    return response.data;
  },
};

/**
 * Claves de campo del elemento, para que el editor las ofrezca en vez de
 * pedirlas escritas a mano.
 */
export const listElementFields = async (
  designSubTypeId?: number,
): Promise<ElementField[]> => {
  const url =
    designSubTypeId === undefined
      ? "/field"
      : `/field/by-design-subtype/${designSubTypeId}`;
  const response = await apiClient.get<ElementField[]>(url);
  return response.data;
};
