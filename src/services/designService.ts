import { apiClient } from './api';
import type {
  BomAdjustment,
  DesignDetail,
  DesignFilters,
  DesignPage,
  RecalculationReport,
  SubDesignVersions,
} from '@/types/design.types';

/** Los diseños del cliente: el admin los consulta y gestiona, no los edita. */
export const designService = {
  async list(filters: DesignFilters): Promise<DesignPage> {
    const response = await apiClient.post<DesignPage>('/admin/designs', filters);
    return response.data;
  },

  async getById(id: number): Promise<DesignDetail> {
    const response = await apiClient.get<DesignDetail>(`/design/by-id/${id}`);
    return response.data;
  },

  async getVersions(id: number): Promise<SubDesignVersions[]> {
    const response = await apiClient.get<SubDesignVersions[]>(`/admin/designs/${id}/versions`);
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

  /** Con `dryRun`, simula: no escribe. */
  async recalculate(id: number, dryRun: boolean): Promise<RecalculationReport> {
    const response = await apiClient.post<RecalculationReport>(`/admin/designs/${id}/recalculate`, {
      dryRun,
    });
    return response.data;
  },

  /** Borrado lógico. */
  async deactivate(id: number): Promise<void> {
    await apiClient.delete(`/design/${id}`);
  },
};
