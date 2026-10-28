import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { phantomItemService } from "@services/phantomItemService";
import type {
  CreatePhantomItemComponentDto,
  CreatePhantomItemDto,
  PhantomItemImportMode,
  PhantomItemsFilters,
  UpdatePhantomItemDto,
} from "@/types/phantom-item.types";

export const usePhantomItems = (filters: PhantomItemsFilters) => {
  return useQuery({
    queryKey: ["phantom-items", filters],
    queryFn: () => phantomItemService.getPhantomItems(filters),
  });
};

export const usePhantomItem = (id: number) => {
  return useQuery({
    queryKey: ["phantom-item", id],
    queryFn: () => phantomItemService.getPhantomItem(id),
    enabled: !!id,
  });
};

export const usePhantomItemColumns = () => {
  return useQuery({
    queryKey: ["phantom-item-columns"],
    queryFn: () => phantomItemService.getExpectedColumns(),
    staleTime: Infinity,
  });
};

export const useCreatePhantomItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePhantomItemDto) =>
      phantomItemService.createPhantomItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phantom-items"] });
      queryClient.invalidateQueries({ queryKey: ["phantom-processes"] });
      toast.success("Fantasma creado exitosamente");
    },
    onError: () => {
      toast.error("Error al crear el fantasma");
    },
  });
};

export const useUpdatePhantomItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePhantomItemDto }) =>
      phantomItemService.updatePhantomItem(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["phantom-items"] });
      queryClient.invalidateQueries({ queryKey: ["phantom-processes"] });
      queryClient.invalidateQueries({ queryKey: ["phantom-item", id] });
      toast.success("Fantasma actualizado exitosamente");
    },
    onError: () => {
      toast.error("Error al actualizar el fantasma");
    },
  });
};

export const useDeletePhantomItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => phantomItemService.deletePhantomItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phantom-items"] });
      queryClient.invalidateQueries({ queryKey: ["phantom-processes"] });
      toast.success("Fantasma eliminado exitosamente");
    },
    onError: () => {
      toast.error("Error al eliminar el fantasma");
    },
  });
};

export const useDeletePhantomItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => phantomItemService.deletePhantomItems(ids),
    onSuccess: ({ deleted }) => {
      queryClient.invalidateQueries({ queryKey: ["phantom-items"] });
      queryClient.invalidateQueries({ queryKey: ["phantom-processes"] });
      toast.success(deleted === 1 ? "Fantasma eliminado" : `${deleted} fantasmas eliminados`);
    },
    onError: () => {
      toast.error("No se pudieron eliminar los fantasmas: no se eliminó ninguno");
    },
  });
};

export const useAddPhantomItemComponent = (phantomItemId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePhantomItemComponentDto) =>
      phantomItemService.addComponent(phantomItemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phantom-item", phantomItemId] });
      toast.success("Componente agregado exitosamente");
    },
    onError: () => {
      toast.error("Error al agregar el componente");
    },
  });
};

export const useUpdatePhantomItemComponent = (phantomItemId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      componentId,
      data,
    }: {
      componentId: number;
      data: Partial<CreatePhantomItemComponentDto>;
    }) => phantomItemService.updateComponent(componentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phantom-item", phantomItemId] });
      toast.success("Componente actualizado exitosamente");
    },
    onError: () => {
      toast.error("Error al actualizar el componente");
    },
  });
};

export const useDeletePhantomItemComponent = (phantomItemId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (componentId: number) =>
      phantomItemService.deleteComponent(componentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phantom-item", phantomItemId] });
      toast.success("Componente eliminado exitosamente");
    },
    onError: () => {
      toast.error("Error al eliminar el componente");
    },
  });
};

export const useImportPhantomItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      mode,
      dryRun,
    }: {
      file: File;
      mode: PhantomItemImportMode;
      dryRun: boolean;
    }) => phantomItemService.importPhantomItems(file, mode, dryRun),
    onSuccess: (result) => {
      if (!result.dryRun) {
        queryClient.invalidateQueries({ queryKey: ["phantom-items"] });
        queryClient.invalidateQueries({ queryKey: ["phantom-processes"] });
        toast.success("Importación completada");
      }
    },
    onError: () => {
      toast.error("Error al importar el archivo");
    },
  });
};

export const usePastePhantomItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      processId,
      text,
      mode,
      dryRun,
    }: {
      processId: number;
      text: string;
      mode: PhantomItemImportMode;
      dryRun: boolean;
    }) => phantomItemService.importPasted(processId, text, mode, dryRun),
    onSuccess: (result) => {
      if (!result.dryRun) {
        queryClient.invalidateQueries({ queryKey: ["phantom-items"] });
        queryClient.invalidateQueries({ queryKey: ["phantom-processes"] });
        toast.success("Filas pegadas e importadas");
      }
    },
  });
};

