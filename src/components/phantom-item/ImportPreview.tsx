import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";
import type { ImportResult } from "@/types/phantom-item.types";

interface ImportPreviewProps {
  result: ImportResult;
  /** Shows the table per sheet: a workbook has several, a paste only one */
  bySheet?: boolean;
}

/**
 * What an import would do, or did: per process for a workbook, and every
 * error and warning with its sheet, row and column.
 */
export const ImportPreview = ({ result, bySheet = false }: ImportPreviewProps) => {
  const verb = result.dryRun ? ["Se crearían", "se actualizarían"] : ["Se crearon", "se actualizaron"];
  const issues = [
    ...result.errors.map((issue) => ({ ...issue, kind: "error" as const })),
    ...result.warnings.map((issue) => ({ ...issue, kind: "warning" as const })),
  ];
  const newProcesses = result.sheets.filter((sheet) => sheet.newProcess);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        <IconCheck className="h-5 w-5 shrink-0" />
        <span>
          {verb[0]} <strong>{result.created}</strong> y {verb[1]} <strong>{result.updated}</strong>{" "}
          fantasmas ({result.rowsRead} filas leídas, {result.phantomItemsDetected} ítems detectados
          {result.skipped > 0 && <>, {result.skipped} omitidos</>}).
        </span>
      </div>

      {newProcesses.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {result.dryRun ? "Se crearán" : "Se crearon"} los procesos{" "}
          {newProcesses.map((sheet) => `«${sheet.processName}»`).join(", ")} con las columnas de su
          hoja.
        </div>
      )}

      {bySheet && result.sheets.length > 0 && (
        <div className="overflow-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm" aria-label="Resumen por hoja">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Hoja</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Proceso</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Fantasmas</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Nuevos</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Actualizados</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700">Omitidos</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Columnas ignoradas</th>
              </tr>
            </thead>
            <tbody>
              {result.sheets.map((sheet) => (
                <tr
                  key={sheet.sheet}
                  data-sheet={sheet.sheet}
                  className={sheet.hidden ? "border-t border-gray-100 text-gray-400" : "border-t border-gray-100"}
                >
                  <td className="px-3 py-2">{sheet.sheet}</td>
                  <td className="px-3 py-2">
                    {sheet.hidden ? (
                      <span className="italic">Oculta, no se importa</span>
                    ) : (
                      <>
                        {sheet.processName}
                        {sheet.newProcess && (
                          <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                            nuevo
                          </span>
                        )}
                        {sheet.newProcess && sheet.referenceSeparator === " " && (
                          <span className="ml-1 text-xs text-gray-500">
                            · referencia con espacio antes del kVA
                          </span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">{sheet.phantomItemsDetected}</td>
                  <td className="px-3 py-2 text-right">{sheet.created}</td>
                  <td className="px-3 py-2 text-right">
                    {sheet.updated}
                    {sheet.moved > 0 && (
                      <span className="ml-1 text-xs text-amber-600" title="Vienen de otro proceso">
                        ({sheet.moved} cambian de proceso)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">{sheet.skipped}</td>
                  <td className="px-3 py-2 text-gray-500">{sheet.ignoredColumns.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {issues.length > 0 && (
        <div className="max-h-56 overflow-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm" aria-label="Errores y avisos">
            <thead className="sticky top-0 bg-gray-50">
              <tr>
                <th className="w-6 px-2 py-2" />
                {bySheet && <th className="px-3 py-2 text-left font-semibold text-gray-700">Hoja</th>}
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Fila</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Columna</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, index) => (
                <tr key={index} className="border-t border-gray-100">
                  <td className="px-2 py-2">
                    <IconAlertTriangle
                      className={issue.kind === "error" ? "h-4 w-4 text-red-600" : "h-4 w-4 text-amber-500"}
                      aria-label={issue.kind === "error" ? "Error" : "Aviso"}
                    />
                  </td>
                  {bySheet && <td className="px-3 py-2 text-gray-500">{issue.sheet ?? "—"}</td>}
                  <td className="px-3 py-2 text-gray-700">{issue.row || "—"}</td>
                  <td className="px-3 py-2 text-gray-500">{issue.column ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-700">{issue.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
