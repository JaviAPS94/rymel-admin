import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { validateTemplate } from "@rymel/design-template";
import type { CustomFunctionDefinition } from "@rymel/formula-engine";
import { designFunctionService } from "@services/designFunctionService";
import type {
  TemplateDiagnostic,
  TemplateDocument,
} from "@/types/template.types";

/**
 * Las variables viajan como texto separado por comas y su **orden es
 * contrato**: las hojas pasan los argumentos por posición, así que
 * `variables[0]` recibe el primero. Se parten conservando ese orden.
 */
const parseVariables = (raw: string | undefined): string[] =>
  (raw ?? "")
    .split(",")
    .map((variable) => variable.trim())
    .filter((variable) => variable !== "");

/** Diagnósticos de una hoja, con la hoja por delante para poder agruparlos. */
export interface SheetDiagnostics {
  sheet: string;
  diagnostics: TemplateDiagnostic[];
}

/** Una fórmula de diseño tal como se ofrece en el catálogo del editor. */
export interface DesignFunctionOption {
  id: number;
  name: string;
  code: string;
  variables: string[];
  description?: string;
}

export interface UseTemplateValidationResult {
  /** Todos los diagnósticos, en el orden en que los produce el contrato. */
  diagnostics: TemplateDiagnostic[];
  /** Agrupados por hoja, para el panel del editor. */
  bySheet: SheetDiagnostics[];
  /** Los que no pertenecen a ninguna hoja: nombres repetidos, documento. */
  documentLevel: TemplateDiagnostic[];
  /** Si la plantilla se puede publicar. */
  canPublish: boolean;
  /** Funciones de diseño del subtipo, tal como las entiende el motor. */
  designFunctions: CustomFunctionDefinition[];
  /** Las mismas, con nombre y descripción, para el catálogo del editor. */
  designFunctionCatalog: DesignFunctionOption[];
  isLoadingFunctions: boolean;
}

/**
 * Validación continua de la plantilla mientras se escribe.
 *
 * **Sin red.** Todas las comprobaciones son estáticas, así que validar no
 * depende de que el motor cifrado esté arriba ni gasta una petición por cada
 * fórmula de diseño que la plantilla invoque. Lo único que se pide al servidor
 * es el catálogo de funciones del subtipo, una vez.
 *
 * El servidor vuelve a validar al publicar. No es redundancia: el navegador no
 * es la autoridad sobre lo que entra a la base, y que no lo fuera es lo que
 * permitió que entraran plantillas sin una sola hoja.
 */
export const useTemplateValidation = (
  document: TemplateDocument,
  designSubTypeId?: number,
): UseTemplateValidationResult => {
  const subTypeFunctions = useQuery({
    queryKey: ["design-functions", "by-subtype", designSubTypeId],
    queryFn: () => designFunctionService.list({ designSubTypeId, limit: 200 }),
    enabled: designSubTypeId !== undefined,
    staleTime: 5 * 60 * 1000,
  });

  const catalog = useQuery({
    queryKey: ["design-functions", "catalog-codes"],
    queryFn: () => designFunctionService.list({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const designFunctions = useMemo<CustomFunctionDefinition[]>(
    () =>
      (subTypeFunctions.data?.items ?? []).map((item) => ({
        id: item.id,
        code: item.code,
        variables: parseVariables(item.variables),
      })),
    [subTypeFunctions.data],
  );

  /**
   * Lo que se ofrece al escribir una fórmula.
   *
   * Solo las fórmulas de diseño del subtipo, como en el diseñador: son las del
   * negocio, las que nadie se sabe de memoria y las únicas que hace falta
   * buscar. Las incorporadas se escriben.
   */
  const designFunctionCatalog = useMemo<DesignFunctionOption[]>(
    () =>
      (subTypeFunctions.data?.items ?? []).map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        variables: parseVariables(item.variables),
        description: item.description,
      })),
    [subTypeFunctions.data],
  );

  const catalogFunctionCodes = useMemo(
    () => (catalog.data?.items ?? []).map((item) => item.code),
    [catalog.data],
  );

  const diagnostics = useMemo(
    () =>
      validateTemplate(document, {
        designFunctions,
        catalogFunctionCodes,
      }),
    [document, designFunctions, catalogFunctionCodes],
  );

  const bySheet = useMemo<SheetDiagnostics[]>(
    () =>
      document.sheets
        .map((sheet) => ({
          sheet: sheet.name,
          diagnostics: diagnostics.filter(
            (diagnostic) => diagnostic.sheet === sheet.name,
          ),
        }))
        .filter((group) => group.diagnostics.length > 0),
    [document.sheets, diagnostics],
  );

  const documentLevel = useMemo(
    () => diagnostics.filter((diagnostic) => diagnostic.sheet === undefined),
    [diagnostics],
  );

  return {
    diagnostics,
    bySheet,
    documentLevel,
    // Una plantilla sin hojas tampoco se publica: no tiene nada que cargar,
    // que es exactamente el estado de tres de las plantillas de producción.
    canPublish: diagnostics.length === 0 && document.sheets.length > 0,
    designFunctions,
    designFunctionCatalog,
    isLoadingFunctions: subTypeFunctions.isLoading || catalog.isLoading,
  };
};
