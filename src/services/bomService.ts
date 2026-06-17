import { apiClient } from './api';
import type {
  BillOfMaterials,
  BomListResponse,
  CreateBomDto,
  UpdateBomDto,
  CreateBomNodeDto,
  UpdateBomNodeDto,
} from '@/types/bom.types';

export const bomService = {
  async getBoms(page = 1, limit = 10): Promise<BomListResponse> {
    const response = await apiClient.get<BomListResponse>('/bill-of-materials', {
      params: { page, limit },
    });
    return response.data;
  },

  async getBom(id: number): Promise<BillOfMaterials> {
    const response = await apiClient.get<BillOfMaterials>(`/bill-of-materials/${id}`);
    return response.data;
  },

  async createBom(data: CreateBomDto): Promise<BillOfMaterials> {
    const response = await apiClient.post<BillOfMaterials>('/bill-of-materials', data);
    return response.data;
  },

  async updateBom(id: number, data: UpdateBomDto): Promise<BillOfMaterials> {
    const response = await apiClient.patch<BillOfMaterials>(`/bill-of-materials/${id}`, data);
    return response.data;
  },

  async deleteBom(id: number): Promise<void> {
    await apiClient.delete(`/bill-of-materials/${id}`);
  },

  async addNode(bomId: number, data: CreateBomNodeDto): Promise<BillOfMaterials> {
    const response = await apiClient.post<BillOfMaterials>(
      `/bill-of-materials/${bomId}/nodes`,
      data,
    );
    return response.data;
  },

  async updateNode(nodeId: number, data: UpdateBomNodeDto): Promise<BillOfMaterials> {
    const response = await apiClient.patch<BillOfMaterials>(
      `/bill-of-materials/nodes/${nodeId}`,
      data,
    );
    return response.data;
  },

  async deleteNode(nodeId: number): Promise<void> {
    await apiClient.delete(`/bill-of-materials/nodes/${nodeId}`);
  },
};
