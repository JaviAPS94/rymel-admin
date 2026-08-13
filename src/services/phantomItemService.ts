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
      },
    );
    return response.data;
  },

  /** Downloads the catalog export as `.xlsx`, respecting the active filters and optional id selection. */
  async exportPhantomItems(
    filters: PhantomItemsFilters = {},
    ids?: number[],
  ): Promise<void> {
    const response = await apiClient.get(`${BASE_PATH}/export`, {
      params: { ...filters, ids: ids?.join(",") },
      responseType: "blob",
    });
    downloadBlob(response.data, "phantom-items.xlsx");
  },

  /** Downloads the empty import template `.xlsx`. */
  async downloadTemplate(): Promise<void> {
    const response = await apiClient.get(`${BASE_PATH}/template`, {
      responseType: "blob",
    });
    downloadBlob(response.data, "phantom-items-template.xlsx");
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
