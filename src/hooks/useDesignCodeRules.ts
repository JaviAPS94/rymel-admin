import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  powerLetterService,
  primaryTensionLetterService,
  secondaryTensionLetterService,
  sapSegmentMappingService,
  suffixFormatService,
} from "@services/designCodeRulesService";

function createRuleResourceHooks<T, TCreate, TUpdate>(
  queryKey: string,
  service: {
    getAll: () => Promise<T[]>;
    create: (data: TCreate) => Promise<T>;
    update: (id: number, data: TUpdate) => Promise<T>;
    remove: (id: number) => Promise<void>;
  }
) {
  const useList = () =>
    useQuery({
      queryKey: [queryKey],
      queryFn: () => service.getAll(),
    });

  const useCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: TCreate) => service.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success("Regla creada exitosamente");
      },
      onError: () => {
        toast.error("Error al crear la regla");
      },
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: TUpdate }) =>
        service.update(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success("Regla actualizada exitosamente");
      },
      onError: () => {
        toast.error("Error al actualizar la regla");
      },
    });
  };

  const useRemove = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => service.remove(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success("Regla eliminada exitosamente");
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message || "Error al eliminar la regla";
        toast.error(message);
      },
    });
  };

  return { useList, useCreate, useUpdate, useRemove };
}

export const usePowerLetters = createRuleResourceHooks(
  "design-code-power-letters",
  powerLetterService
);

export const usePrimaryTensionLetters = createRuleResourceHooks(
  "design-code-primary-tension-letters",
  primaryTensionLetterService
);

export const useSecondaryTensionLetters = createRuleResourceHooks(
  "design-code-secondary-tension-letters",
  secondaryTensionLetterService
);

export const useSapSegmentMappings = createRuleResourceHooks(
  "design-code-sap-segment-mappings",
  sapSegmentMappingService
);

export const useSuffixFormats = createRuleResourceHooks(
  "design-code-suffix-formats",
  suffixFormatService
);
