import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { phantomProcessService } from "@services/phantomProcessService";
import type { ProcessColumn } from "@/types/phantom-item.types";

const PROCESSES_KEY = ["phantom-processes"];

/** The message the API sends for a validation or conflict error, if any */
export const apiErrorMessage = (error: unknown, fallback: string): string => {
  const data = (
    error as {
      response?: { data?: { message?: string | string[]; errors?: Record<string, string[]> } };
    }
  )?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat().join(" ");
  if (typeof data?.message === "string" && data.message !== "Validation failed") return data.message;
  return fallback;
};

export const usePhantomProcesses = () =>
  useQuery({
    queryKey: PROCESSES_KEY,
    queryFn: () => phantomProcessService.list(),
  });

/**
 * Every change to a process can change the list of phantom items too (counts,
 * families, the process a phantom item is shown under).
 */
const useProcessMutation = <T,>(
  mutationFn: (variables: T) => Promise<unknown>,
  messages: { success: string; error: string },
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROCESSES_KEY });
      queryClient.invalidateQueries({ queryKey: ["phantom-items"] });
      toast.success(messages.success);
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, messages.error));
    },
  });
};

export const useCreatePhantomProcess = () =>
  useProcessMutation((name: string) => phantomProcessService.create(name), {
    success: "Proceso creado",
    error: "No se pudo crear el proceso",
  });

export const useRenamePhantomProcess = () =>
  useProcessMutation(
    ({ id, name }: { id: number; name: string }) => phantomProcessService.rename(id, name),
    { success: "Proceso renombrado", error: "No se pudo renombrar el proceso" },
  );

export const useSetReferenceSeparator = () =>
  useProcessMutation(
    ({ id, referenceSeparator }: { id: number; referenceSeparator: string }) =>
      phantomProcessService.setReferenceSeparator(id, referenceSeparator),
    { success: "Regla de referencia guardada", error: "No se pudo guardar la regla" },
  );

export const useReorderPhantomProcesses = () =>
  useProcessMutation((ids: number[]) => phantomProcessService.reorder(ids), {
    success: "Orden actualizado",
    error: "No se pudo cambiar el orden",
  });

export const useRemovePhantomProcess = () =>
  useProcessMutation((id: number) => phantomProcessService.remove(id), {
    success: "Proceso eliminado",
    error: "No se pudo eliminar el proceso",
  });

export const useSetPhantomProcessColumns = () =>
  useProcessMutation(
    ({ id, columns }: { id: number; columns: ProcessColumn[] }) =>
      phantomProcessService.setColumns(id, columns),
    { success: "Columnas guardadas", error: "No se pudieron guardar las columnas" },
  );

export const useRenamePhantomFamily = () =>
  useProcessMutation(
    ({ id, name }: { id: number; name: string }) => phantomProcessService.renameFamily(id, name),
    { success: "Familia renombrada", error: "No se pudo renombrar la familia" },
  );
