import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { semiFinishedService } from '@services/semiFinishedService';
import type { CreateSemiFinishedDto, UpdateSemiFinishedDto } from '@/types/bom.types';

/**
 * Prefijo de todas las consultas de semielaborados: el catálogo y los
 * selectores del editor de estructuras y de las zonas de la plantilla.
 */
const SEMI_FINISHED_KEY = ['semi-finished'] as const;

export const useSemiFinishedAdminList = () =>
  useQuery({
    queryKey: [...SEMI_FINISHED_KEY, 'admin'],
    queryFn: () => semiFinishedService.getAdminList(),
  });

/** Los errores los muestra quien llama: el 409 va al campo o al diálogo. */
export const useCreateSemiFinished = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSemiFinishedDto) => semiFinishedService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEMI_FINISHED_KEY });
      toast.success('Semielaborado creado');
    },
  });
};

export const useUpdateSemiFinished = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSemiFinishedDto }) =>
      semiFinishedService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEMI_FINISHED_KEY });
      // Los árboles de estructura muestran código y nombre del semielaborado.
      queryClient.invalidateQueries({ queryKey: ['bom'] });
      toast.success('Semielaborado actualizado');
    },
  });
};

export const useDeleteSemiFinished = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => semiFinishedService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEMI_FINISHED_KEY });
      toast.success('Semielaborado eliminado');
    },
  });
};
