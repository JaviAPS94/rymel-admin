import { apiClient } from './api';
import type { SemiFinished } from '@/types/bom.types';

export const semiFinishedService = {
  async getAll(): Promise<SemiFinished[]> {
    const response = await apiClient.get<SemiFinished[]>('/semi-finished');
    return response.data;
  },
};
