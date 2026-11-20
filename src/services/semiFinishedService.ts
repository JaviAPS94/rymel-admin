import { apiClient } from './api';
import type {
  CreateSemiFinishedDto,
  SemiFinished,
  SemiFinishedAdminItem,
  UpdateSemiFinishedDto,
} from '@/types/bom.types';

export const semiFinishedService = {
  /** Los activos, por código: lo que ofrecen los selectores. */
  async getAll(): Promise<SemiFinished[]> {
    const response = await apiClient.get<SemiFinished[]>('/semi-finished');
    return response.data;
  },

  /** Los activos con cuántas estructuras los usan (solo ADMIN). */
  async getAdminList(): Promise<SemiFinishedAdminItem[]> {
    const response = await apiClient.get<SemiFinishedAdminItem[]>('/semi-finished/admin');
    return response.data;
  },

  async create(data: CreateSemiFinishedDto): Promise<SemiFinished> {
    const response = await apiClient.post<SemiFinished>('/semi-finished', data);
    return response.data;
  },

  async update(id: number, data: UpdateSemiFinishedDto): Promise<SemiFinished> {
    const response = await apiClient.patch<SemiFinished>(`/semi-finished/${id}`, data);
    return response.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/semi-finished/${id}`);
  },
};
