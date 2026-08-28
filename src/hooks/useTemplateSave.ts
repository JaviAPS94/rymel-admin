import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { writeSheet } from "@rymel/design-template";
import { templateService } from "@services/templateService";
import type { TemplateDetail, TemplateDocument } from "@/types/template.types";

export interface UseTemplateSaveResult {
  /** Guarda la estructura si cambió, y solo las hojas modificadas. */
  save: () => Promise<boolean>;
  /** Si hay algo que guardar: contenido o estructura. */
  hasPendingChanges: boolean;
  isSaving: boolean;
  /** Cuando el servidor avisa de que la plantilla cambió en otra sesión. */
  conflict: boolean;
  dismissConflict: () => void;
  lastSavedAt: Date | null;
}

/** Detecta el 409 con el que el servidor rechaza una escritura desfasada. */
const isConflict = (error: unknown): boolean =>
  (error as { response?: { status?: number } })?.response?.status === 409;

const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return fallback;
};

/**
 * Guardado selectivo del borrador.
 *
 * Solo viajan las hojas que se tocaron. La hoja más grande que hay guardada
 * son 236 KB: reenviar la plantilla entera cada vez que se corrige un rótulo
 * es desperdicio en cada guardado, y multiplica la ventana en la que dos
 * sesiones pueden pisarse.
 *
 * Cada envío lleva la marca del borrador que el editor tenía cargado. Si el
 * servidor responde 409 es que otra sesión escribió en medio: se avisa y no se
 * sobrescribe.
 */
export const useTemplateSave = (
  templateId: number,
  document: TemplateDocument,
  dirtySheets: Set<string>,
  draftUpdatedAt: string | undefined,
  /** Las hojas que el servidor tiene ahora mismo, para saber si cambió la estructura. */
  serverSheetNames: string[],
  onSaved: (detail: TemplateDetail, savedSheets: string[]) => void,
): UseTemplateSaveResult => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const localSheetNames = document.sheets.map((sheet) => sheet.name);

  /**
   * La estructura cambió si las hojas no son las mismas ni en el mismo orden.
   *
   * Hay que mirarlo aparte del contenido: eliminar o reordenar hojas no
   * ensucia ninguna, y sin esto esos cambios no llegaban nunca al servidor.
   */
  const structureChanged =
    localSheetNames.length !== serverSheetNames.length ||
    localSheetNames.some((name, index) => serverSheetNames[index] !== name);

  const save = useCallback(async (): Promise<boolean> => {
    if (dirtySheets.size === 0 && !structureChanged) return true;

    setIsSaving(true);
    const saved: string[] = [];
    let detail: TemplateDetail | null = null;
    // La marca avanza con cada escritura: el servidor la actualiza, así que la
    // siguiente debe llevar la nueva.
    let expectedUpdatedAt = draftUpdatedAt;

    try {
      // La estructura va primero: crea las hojas que el editor añadió y quita
      // las que eliminó, para que el contenido que viene detrás tenga dónde
      // caer.
      if (structureChanged) {
        detail = await templateService.setSheets(templateId, {
          names: localSheetNames,
          expectedUpdatedAt,
        });
        expectedUpdatedAt = detail.draftUpdatedAt;
      }

      for (const sheetName of dirtySheets) {
        const sheet = document.sheets.find((item) => item.name === sheetName);
        if (!sheet) continue;

        // La hoja viaja en su forma persistida, la misma que entiende el
        // servidor: la traducción vive en el contrato, no aquí.
        const persisted = writeSheet(sheet);

        detail = await templateService.saveSheet(templateId, sheetName, {
          name: sheet.name,
          cells: persisted.cells as Record<string, unknown>,
          styles: (persisted.cellsStyles ?? {}) as Record<string, unknown>,
          expectedUpdatedAt,
        });

        expectedUpdatedAt = detail.draftUpdatedAt;
        saved.push(sheetName);
      }

      setLastSavedAt(new Date());
      setConflict(false);
      if (detail) onSaved(detail, saved);
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success(
        saved.length === 0
          ? "Estructura de hojas guardada"
          : saved.length === 1
            ? `Hoja "${saved[0]}" guardada`
            : `${saved.length} hojas guardadas`,
      );
      return true;
    } catch (error) {
      if (isConflict(error)) {
        setConflict(true);
        // Las hojas que sí se guardaron antes del choque dejan de estar
        // pendientes: repetirlas escribiría dos veces lo mismo.
        if (detail) onSaved(detail, saved);
      } else {
        toast.error(errorMessage(error, "No se pudo guardar"));
      }
      return false;
    } finally {
      setIsSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dirtySheets,
    document.sheets,
    draftUpdatedAt,
    onSaved,
    queryClient,
    templateId,
    structureChanged,
  ]);

  return {
    save,
    hasPendingChanges: dirtySheets.size > 0 || structureChanged,
    isSaving,
    conflict,
    dismissConflict: useCallback(() => setConflict(false), []),
    lastSavedAt,
  };
};
