import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bomService } from '@services/bomService';
import { semiFinishedService } from '@services/semiFinishedService';
import type { CreateBomDto, UpdateBomDto, CreateBomNodeDto, UpdateBomNodeDto } from '@/types/bom.types';

export const useBoms = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['boms', page, limit],
    queryFn: () => bomService.getBoms(page, limit),
  });
};

export const useBom = (id: number) => {
  return useQuery({
    queryKey: ['bom', id],
    queryFn: () => bomService.getBom(id),
    enabled: !!id,
  });
};

export const useSemiFinished = () => {
  return useQuery({
    queryKey: ['semi-finished'],
    queryFn: () => semiFinishedService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBomDto) => bomService.createBom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      toast.success('BOM creado exitosamente');
    },
    onError: () => {
      toast.error('Error al crear el BOM');
    },
  });
};

export const useUpdateBom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBomDto }) =>
      bomService.updateBom(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      queryClient.invalidateQueries({ queryKey: ['bom', id] });
      toast.success('BOM actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el BOM');
    },
  });
};

export const useDeleteBom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bomService.deleteBom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      toast.success('BOM eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el BOM');
    },
  });
};

export const useAddBomNode = (bomId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBomNodeDto) => bomService.addNode(bomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', bomId] });
      toast.success('Nodo agregado exitosamente');
    },
    onError: () => {
      toast.error('Error al agregar el nodo');
    },
  });
};

export const useUpdateBomNode = (bomId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nodeId, data }: { nodeId: number; data: UpdateBomNodeDto }) =>
      bomService.updateNode(nodeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', bomId] });
      toast.success('Nodo actualizado exitosamente');
    },
    onError: () => {
      toast.error('Error al actualizar el nodo');
    },
  });
};

export const useDeleteBomNode = (bomId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: number) => bomService.deleteNode(nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom', bomId] });
      toast.success('Nodo eliminado exitosamente');
    },
    onError: () => {
      toast.error('Error al eliminar el nodo');
    },
  });
};
