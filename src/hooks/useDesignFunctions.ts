import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  designFunctionService,
  listDesignSubTypes,
} from "@services/designFunctionService";
import type {
  CreateDesignFunctionDto,
  ListDesignFunctionsParams,
  PublishVersionDto,
  TestExpressionDto,
  UpdateDesignFunctionDto,
} from "@/types/designFunction.types";

const KEY = "design-functions";

/** Mensaje de error del servidor, que suele explicar la regla que se violó. */
const errorMessage = (error: unknown, fallback: string): string => {
  const response = (error as { response?: { data?: { message?: unknown } } })
    ?.response;
  const message = response?.data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return fallback;
};

export const useDesignFunctions = (params: ListDesignFunctionsParams) =>
  useQuery({
    queryKey: [KEY, params],
    queryFn: () => designFunctionService.list(params),
  });

/**
 * Detalle con la expresión en claro.
 *
 * `staleTime: 0` y sin reintento a propósito: cada lectura queda auditada en
 * el servidor, así que no conviene repetirla sola.
 */
export const useDesignFunctionDetail = (id: number | null) =>
  useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => designFunctionService.detail(id as number),
    enabled: id !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

export const useDesignFunctionImpact = (id: number | null) =>
  useQuery({
    queryKey: [KEY, "impact", id],
    queryFn: () => designFunctionService.impact(id as number),
    enabled: id !== null,
  });

export const useDesignFunctionVersions = (id: number | null) =>
  useQuery({
    queryKey: [KEY, "versions", id],
    queryFn: () => designFunctionService.versions(id as number),
    enabled: id !== null,
  });

export const useCreateDesignFunction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDesignFunctionDto) =>
      designFunctionService.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Fórmula creada");
      for (const warning of result.warnings) toast.warning(warning);
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo crear")),
  });
};

export const useUpdateDesignFunction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDesignFunctionDto }) =>
      designFunctionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Fórmula actualizada");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo actualizar")),
  });
};

export const usePublishVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PublishVersionDto }) =>
      designFunctionService.publishVersion(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(`Versión ${result.version} publicada`);
      for (const warning of result.warnings) toast.warning(warning);
    },
    // Sin toast de error: el formulario muestra el mensaje junto al campo,
    // porque el rechazo casi siempre pide una corrección concreta.
  });
};

export const useRestoreVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: number; version: number }) =>
      designFunctionService.restoreVersion(id, version),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(`Restaurada como versión ${result.version}`);
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo restaurar")),
  });
};

export const useTestExpression = () =>
  useMutation({
    mutationFn: (data: TestExpressionDto) => designFunctionService.test(data),
    onError: (error) => toast.error(errorMessage(error, "No se pudo probar")),
  });

export const useSetSubTypes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, subTypeIds }: { id: number; subTypeIds: number[] }) =>
      designFunctionService.setSubTypes(id, subTypeIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Asignación actualizada");
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo asignar")),
  });
};

export const useRemoveDesignFunction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => designFunctionService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Fórmula dada de baja");
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo eliminar")),
  });
};

export const useUndeleteDesignFunction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => designFunctionService.undelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Fórmula restablecida");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo restablecer")),
  });
};

export const useDesignSubTypes = () =>
  useQuery({ queryKey: ["design-subtypes"], queryFn: listDesignSubTypes });

export const useStaleSubDesigns = () =>
  useQuery({
    queryKey: [KEY, "stale"],
    queryFn: () => designFunctionService.staleSubDesigns(),
  });

export const useRecalculate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subDesignIds: number[]) =>
      designFunctionService.recalculate(subDesignIds),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      if (report.failed > 0) {
        toast.warning(
          `${report.recalculated} recalculados, ${report.failed} no se pudieron`
        );
      } else {
        toast.success(
          `${report.recalculated} recalculados, ${report.unchanged} sin cambios`
        );
      }
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo recalcular")),
  });
};
