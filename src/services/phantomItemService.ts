import { apiClient } from "./api";
import type {
  CreatePhantomItemComponentDto,
  CreatePhantomItemDto,
  ImportResult,
  PhantomItemDetail,
  PhantomItemExpectedColumn,
  PhantomItemImportMode,
  PhantomItemListResponse,
  PhantomItemsFilters,
  UpdatePhantomItemDto,
} from "@/types/phantom-item.types";

const BASE_PATH = "/phantom-items";

/**
 * The whole workbook (533 phantom items, 5,121 rows) takes about 13 s to
 * import against the local database, more than the client's general 10 s:
 * the screen would report a failure while the server kept writing.
 */
export const IMPORT_TIMEOUT_MS = 5 * 60 * 1000;

export const phantomItemService = {
  async getPhantomItems(
    filters: PhantomItemsFilters = {},
  ): Promise<PhantomItemListResponse> {
    const response = await apiClient.get<PhantomItemListResponse>(BASE_PATH, {
      params: filters,
    });
    return response.data;
  },

  async getPhantomItem(id: number): Promise<PhantomItemDetail> {
    const response = await apiClient.get<PhantomItemDetail>(`${BASE_PATH}/${id}`);
    return response.data;
  },

  async createPhantomItem(data: CreatePhantomItemDto): Promise<PhantomItemDetail> {
    const response = await apiClient.post<PhantomItemDetail>(BASE_PATH, data);
    return response.data;
  },

  async updatePhantomItem(
    id: number,
    data: UpdatePhantomItemDto,
  ): Promise<PhantomItemDetail> {
    const response = await apiClient.put<PhantomItemDetail>(
      `${BASE_PATH}/${id}`,
      data,
    );
    return response.data;
  },

  async deletePhantomItem(id: number): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/${id}`);
  },

  /** All or nothing: if one of them no longer exists, none is deleted */
  async deletePhantomItems(ids: number[]): Promise<{ deleted: number }> {
    const response = await apiClient.post<{ deleted: number }>(`${BASE_PATH}/bulk-delete`, { ids });
    return response.data;
  },

  async addComponent(
    phantomItemId: number,
    data: CreatePhantomItemComponentDto,
  ): Promise<PhantomItemDetail> {
    const response = await apiClient.post<PhantomItemDetail>(
      `${BASE_PATH}/${phantomItemId}/components`,
      data,
    );
    return response.data;
  },

  async updateComponent(
    componentId: number,
    data: Partial<CreatePhantomItemComponentDto>,
  ): Promise<PhantomItemDetail> {
    const response = await apiClient.put<PhantomItemDetail>(
      `${BASE_PATH}/components/${componentId}`,
      data,
    );
    return response.data;
  },

  async deleteComponent(componentId: number): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/components/${componentId}`);
  },

  async getExpectedColumns(): Promise<PhantomItemExpectedColumn[]> {
    const response = await apiClient.get<PhantomItemExpectedColumn[]>(
      `${BASE_PATH}/columns`,
    );
    return response.data;
  },

  /** Uploads a `.xlsx` and either previews (`dryRun`) or executes the import. */
  async importPhantomItems(
    file: File,
    mode: PhantomItemImportMode,
    dryRun: boolean,
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ImportResult>(
      `${BASE_PATH}/import`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        params: { mode, dryRun },
        timeout: IMPORT_TIMEOUT_MS,
      },
    );
    return response.data;
  },

  /**
   * Rows copied from Excel into one process. Same result as a file import,
   * and the same preview with `dryRun`.
   */
  async importPasted(
    processId: number,
    text: string,
    mode: PhantomItemImportMode,
    dryRun: boolean,
  ): Promise<ImportResult> {
    const response = await apiClient.post<ImportResult>(
      `${BASE_PATH}/import/paste`,
      { processId, text, mode, dryRun },
      { timeout: IMPORT_TIMEOUT_MS },
    );
    return response.data;
  },

  /**
   * Downloads the workbook: one sheet per process, or only `filters.processId`'s
   * sheet. Respects the active filters and an optional id selection.
   */
  async exportPhantomItems(
    filters: PhantomItemsFilters = {},
    ids?: number[],
    filename = "fantasmas.xlsx",
  ): Promise<void> {
    const response = await apiClient.get(`${BASE_PATH}/export`, {
      params: { ...filters, ids: ids?.join(",") },
      responseType: "blob",
    });
    downloadBlob(response.data, filename);
  },

  /** Downloads the empty workbook: every process, or only the given one. */
  async downloadTemplate(processId?: number, filename = "plantilla-fantasmas.xlsx"): Promise<void> {
    const response = await apiClient.get(`${BASE_PATH}/template`, {
      params: { processId },
      responseType: "blob",
    });
    downloadBlob(response.data, filename);
  },
};

const downloadBlob = (data: BlobPart, filename: string): void => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
