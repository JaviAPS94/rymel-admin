import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listElementFields, templateService } from "@services/templateService";
import type {
  CreateTemplateDto,
  DuplicateTemplateDto,
  ListTemplatesParams,
  PublishTemplateDto,
  UpdateTemplateDto,
} from "@/types/template.types";

const KEY = "templates";

/**
 * Mensaje del servidor.
 *
 * Suele explicar la regla que se violó —«el código ya lo usa la plantilla 3»,
 * «la plantilla cambió desde que la cargaste»— y es más útil que cualquier
 * texto genérico que pudiéramos poner aquí.
 */
const errorMessage = (error: unknown, fallback: string): string => {
  const response = (error as { response?: { data?: { message?: unknown } } })
    ?.response;
  const message = response?.data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return fallback;
};

export const useTemplates = (params: ListTemplatesParams) =>
  useQuery({
    queryKey: [KEY, params],
    queryFn: () => templateService.list(params),
  });

export const useTemplateDetail = (id: number | null) =>
  useQuery({
    queryKey: [KEY, "detail", id],
    queryFn: () => templateService.detail(id as number),
    enabled: id !== null,
  });

export const useTemplateRevisions = (id: number | null) =>
  useQuery({
    queryKey: [KEY, "revisions", id],
    queryFn: () => templateService.revisions(id as number),
    enabled: id !== null,
  });

/** Claves de campo del elemento, para ofrecer los `elementKey` del editor. */
export const useElementFields = (designSubTypeId?: number) =>
  useQuery({
    queryKey: [KEY, "element-fields", designSubTypeId],
    queryFn: () => listElementFields(designSubTypeId),
    staleTime: 5 * 60 * 1000,
  });

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateTemplateDto) => templateService.create(dto),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success(`Plantilla "${template.document.name}" creada en borrador`);
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo crear la plantilla")),
  });
};

export const useUpdateTemplate = (id: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateTemplateDto) => templateService.update(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Plantilla actualizada");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo actualizar la plantilla")),
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => templateService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Plantilla dada de baja");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo dar de baja la plantilla")),
  });
};

export const useDuplicateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: DuplicateTemplateDto }) =>
      templateService.duplicate(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Copia creada en borrador");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo duplicar la plantilla")),
  });
};

/**
 * Publica el borrador.
 *
 * Que el servidor rechace la publicación **no es un error**: es la respuesta
 * normal a una plantilla con diagnósticos, y por eso llega por `onSuccess`
 * con `published: false`. Tratarlo como fallo escondería los motivos, que es
 * justo lo que el administrador necesita ver.
 */
export const usePublishTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto?: PublishTemplateDto }) =>
      templateService.publish(id, dto),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      if (result.published) {
        toast.success(`Plantilla publicada (versión ${result.version})`);
      } else {
        toast.error(
          `No se publicó: ${result.diagnostics.length} problema(s) por resolver`,
        );
      }
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo publicar la plantilla")),
  });
};

export const useDiscardDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => templateService.discardDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Cambios sin publicar descartados");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudieron descartar los cambios")),
  });
};

export const useRestoreRevision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, revisionId }: { id: number; revisionId: number }) =>
      templateService.restoreRevision(id, revisionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      toast.success("Versión traída al borrador; lo publicado no cambia");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo restaurar la versión")),
  });
};
