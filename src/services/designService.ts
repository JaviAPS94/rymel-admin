import { apiClient } from './api';
import type {
  BomAdjustment,
  BomReviewFilters,
  BomReviewPage,
  DesignDetail,
} from '@/types/designBom.types';

/** Diseños guardados, de solo lectura: el admin los consulta, no los edita. */
export const designService = {
  /** Diseños con el estado de su lista de materiales, para revisarla. */
  async bomReview(filters: BomReviewFilters): Promise<BomReviewPage> {
    const response = await apiClient.post<BomReviewPage>('/design/bom-review', filters);
    return response.data;
  },

  async getById(id: number): Promise<DesignDetail> {
    const response = await apiClient.get<DesignDetail>(`/design/by-id/${id}`);
    return response.data;
  },

  /** La lista que ajustó el cliente; `null` si no la ajustó. */
  async getBomAdjustment(id: number): Promise<BomAdjustment | null> {
    try {
      const response = await apiClient.get<BomAdjustment>(`/design/${id}/bom-adjustment`);
      return response.data;
    } catch (error) {
      if ((error as { response?: { status?: number } }).response?.status === 404) return null;
      throw error;
    }
  },
};
