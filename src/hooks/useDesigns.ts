import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { designService } from "@services/designService";
import { bomService } from "@services/bomService";
import type { DesignFilters } from "@/types/design.types";

const KEY = "admin-designs";

/** El mensaje del servidor, si lo hay: dice mejor que nada qué falló. */
const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return fallback;
};

export const useDesigns = (filters: DesignFilters) =>
  useQuery({
    queryKey: [KEY, filters],
    queryFn: () => designService.list(filters),
    // Al cambiar un filtro, el listado y las opciones siguen a la vista
    // hasta que llega la respuesta
    placeholderData: keepPreviousData,
  });

export const useDesignDetail = (id: number) =>
  useQuery({ queryKey: [KEY, "detail", id], queryFn: () => designService.getById(id) });

export const useDesignVersions = (id: number) =>
  useQuery({ queryKey: [KEY, "versions", id], queryFn: () => designService.getVersions(id) });

export const useBomAdjustment = (id: number) =>
  useQuery({ queryKey: [KEY, "bom-adjustment", id], queryFn: () => designService.getBomAdjustment(id) });

/** La estructura BOM de una referencia ERP; `null` si ninguna coincide. */
export const useBomForReference = (reference: string | null) =>
  useQuery({
    queryKey: ["bom-by-reference", reference],
    queryFn: () => bomService.searchByCode(reference as string),
    enabled: reference !== null && reference !== "",
  });

export const useDeactivateDesign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => designService.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Diseño desactivado");
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo desactivar el diseño")),
  });
};

export const useRecalculateDesign = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dryRun: boolean) => designService.recalculate(id, dryRun),
    onSuccess: (_report, dryRun) => {
      if (dryRun) return;
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Diseño recalculado");
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo recalcular el diseño")),
  });
};
