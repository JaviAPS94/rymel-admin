import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { designService } from '@services/designService';
import { bomService } from '@services/bomService';
import type { BomReviewFilters } from '@/types/designBom.types';

export const useBomReview = (filters: BomReviewFilters) =>
  useQuery({
    queryKey: ['bom-review', filters],
    queryFn: () => designService.bomReview(filters),
    // Al cambiar un filtro, el listado y las normas del filtro siguen a la
    // vista hasta que llega la respuesta
    placeholderData: keepPreviousData,
  });

export const useBomAdjustment = (id: number) =>
  useQuery({
    queryKey: ['bom-adjustment', id],
    queryFn: () => designService.getBomAdjustment(id),
  });

export const useDesignDetail = (id: number | null) =>
  useQuery({
    queryKey: ['design', id],
    queryFn: () => designService.getById(id as number),
    enabled: id !== null,
  });

/** La estructura BOM de una referencia ERP; `null` si ninguna coincide. */
export const useBomForReference = (reference: string | null) =>
  useQuery({
    queryKey: ['bom-by-reference', reference],
    queryFn: () => bomService.searchByCode(reference as string),
    enabled: reference !== null && reference !== '',
  });
