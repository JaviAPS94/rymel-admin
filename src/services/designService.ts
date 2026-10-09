import { apiClient } from './api';
import type { DesignDetail, PaginatedDesigns } from '@/types/designBom.types';

/** Diseños guardados, de solo lectura: el admin los consulta, no los edita. */
export const designService = {
  async list(params: { page: number; limit: number; designCode?: string }): Promise<PaginatedDesigns> {
    const response = await apiClient.post<PaginatedDesigns>('/design/by-filters-paginated', params);
    return response.data;
  },

  async getById(id: number): Promise<DesignDetail> {
    const response = await apiClient.get<DesignDetail>(`/design/by-id/${id}`);
    return response.data;
  },
};
