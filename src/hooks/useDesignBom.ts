import { useQuery } from '@tanstack/react-query';
import { designService } from '@services/designService';
import { bomService } from '@services/bomService';

export const useDesigns = (page: number, designCode: string) =>
  useQuery({
    queryKey: ['designs', page, designCode],
    queryFn: () => designService.list({ page, limit: 10, designCode: designCode || undefined }),
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
