import { useCallback, useState } from "react";
import {
  evaluateSheet,
  type CellValueMap,
  type CustomFunctionCall,
  type CustomFunctionDefinition,
  type CustomFunctionResult,
} from "@rymel/formula-engine";
import { toEngineBook } from "@rymel/design-template";
import { designFunctionService } from "@services/designFunctionService";
import type { TemplateDocument } from "@/types/template.types";

export interface PreviewResult {
  values: CellValueMap;
  /** Cuántas peticiones se hicieron: una por nivel de dependencia. */
  batchCount: number;
  /** Celdas cuyo cálculo falló, con el motivo. */
  failed: { ref: string; reason: string }[];
  circular: string[];
}

export interface UseTemplatePreviewResult {
  run: (elementValues?: Record<string, string | number>) => Promise<void>;
  result: PreviewResult | null;
  isRunning: boolean;
  error: string | null;
  clear: () => void;
}

/**
 * Vista previa calculada de la plantilla.
 *
 * Es lo que el diseñador verá. El editor calcula en local mientras se escribe,
 * pero las fórmulas de diseño solo las puede resolver el servidor, así que
 * hasta que se ejecuta esto quedan pendientes.
 *
 * La resolución va **por lotes**: `evaluateSheet` agrupa todas las
 * invocaciones de un mismo nivel de dependencia en una sola petición. Una hoja
 * con cuarenta celdas independientes que llaman a la misma función hace una
 * petición, no cuarenta.
 */
export const useTemplatePreview = (
  document: TemplateDocument,
  designFunctions: readonly CustomFunctionDefinition[],
): UseTemplatePreviewResult => {
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (elementValues: Record<string, string | number> = {}) => {
      setIsRunning(true);
      setError(null);

      const failed: { ref: string; reason: string }[] = [];

      /**
       * El puerto que resuelve un lote completo contra el servidor. Si falla,
       * el error queda acotado a las celdas de ese lote: las que ya se
       * calcularon conservan su valor.
       */
      const resolveCustomFunctions = async (
        calls: CustomFunctionCall[],
      ): Promise<CustomFunctionResult[]> => {
        try {
          const response = await designFunctionService.calculate({
            functions: calls.map((call) => ({
              designFunctionId: Number(call.definition.id),
              parameters: call.parameters,
            })),
          });

          return response.results.map((item) => ({ value: item.result }));
        } catch (cause) {
          const reason =
            cause instanceof Error ? cause.message : "el servidor no respondió";
          return calls.map(() => ({ error: reason }));
        }
      };

      try {
        const book = toEngineBook(document);

        // Las celdas enlazadas a un dato del elemento se siembran con el valor
        // de prueba: en el editor no hay elemento, y sin ellos la vista previa
        // calcularía sobre ceros.
        const initialValues: CellValueMap = {};
        for (const sheet of document.sheets) {
          for (const [ref, cell] of Object.entries(sheet.cells)) {
            if (cell.elementKey === undefined) continue;
            const value = elementValues[cell.elementKey];
            if (value !== undefined) {
              initialValues[`${sheet.name}!${ref}`] = value;
              book[`${sheet.name}!${ref}`] = { formula: String(value) };
            }
          }
        }

        const evaluation = await evaluateSheet(book, {
          customFunctions: designFunctions,
          resolveCustomFunctions,
          initialValues,
        });

        for (const [ref, value] of Object.entries(evaluation.values)) {
          if (typeof value === "string" && value.startsWith("#")) {
            failed.push({ ref, reason: value });
          }
        }

        setResult({
          values: evaluation.values,
          batchCount: evaluation.batchCount,
          failed,
          circular: [...evaluation.circular],
        });
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo calcular la vista previa",
        );
      } finally {
        setIsRunning(false);
      }
    },
    [document, designFunctions],
  );

  return {
    run,
    result,
    isRunning,
    error,
    clear: useCallback(() => setResult(null), []),
  };
};
