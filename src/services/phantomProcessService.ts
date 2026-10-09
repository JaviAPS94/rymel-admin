import { apiClient } from "./api";
import type {
  PhantomFamily,
  PhantomProcess,
  ProcessColumn,
} from "@/types/phantom-item.types";

const BASE_PATH = "/phantom-processes";

/** Plant processes, their families and their columns */
export const phantomProcessService = {
  async list(): Promise<PhantomProcess[]> {
    const response = await apiClient.get<PhantomProcess[]>(BASE_PATH);
    return response.data;
  },

  /** Without columns, the process starts with the catalog's */
  async create(name: string): Promise<PhantomProcess> {
    const response = await apiClient.post<PhantomProcess>(BASE_PATH, { name });
    return response.data;
  },

  async rename(id: number, name: string): Promise<PhantomProcess> {
    const response = await apiClient.put<PhantomProcess>(`${BASE_PATH}/${id}`, { name });
    return response.data;
  },

  /** Applies from the next save or import of each phantom item */
  async setReferenceSeparator(id: number, referenceSeparator: string): Promise<PhantomProcess> {
    const response = await apiClient.put<PhantomProcess>(
      `${BASE_PATH}/${id}/reference-separator`,
      { referenceSeparator },
    );
    return response.data;
  },

  /** `ids` lists every active process, in the new order */
  async reorder(ids: number[]): Promise<PhantomProcess[]> {
    const response = await apiClient.put<PhantomProcess[]>(`${BASE_PATH}/order`, { ids });
    return response.data;
  },

  /** Only an empty process can be removed */
  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE_PATH}/${id}`);
  },

  async setColumns(id: number, columns: ProcessColumn[]): Promise<PhantomProcess> {
    const response = await apiClient.put<PhantomProcess>(`${BASE_PATH}/${id}/columns`, {
      columns,
    });
    return response.data;
  },

  async createFamily(processId: number, name: string): Promise<PhantomFamily> {
    const response = await apiClient.post<PhantomFamily>(
      `${BASE_PATH}/${processId}/families`,
      { name },
    );
    return response.data;
  },

  async renameFamily(familyId: number, name: string): Promise<PhantomFamily> {
    const response = await apiClient.put<PhantomFamily>(
      `${BASE_PATH}/families/${familyId}`,
      { name },
    );
    return response.data;
  },
};
