import { useState } from "react";
import { IconRefresh, IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { useRecalculate, useStaleSubDesigns } from "@hooks/useDesignFunctions";
import type { RecalculationReport } from "@/types/designFunction.types";

/**
 * Diseños calculados con una versión de fórmula que ya no es la vigente.
 *
 * Conservan sus valores: publicar una versión nueva **no** los cambia, solo
 * los marca. El recálculo es una acción deliberada porque reescribe números
 * que alguien ya vio, y conviene que ocurra con alguien mirando.
 */
export const StaleSubDesignsPanel = () => {
  const stale = useStaleSubDesigns();
  const recalculate = useRecalculate();
  const [selected, setSelected] = useState<number[]>([]);
  const [report, setReport] = useState<RecalculationReport | null>(null);

  const items = stale.data ?? [];
  const allSelected = items.length > 0 && selected.length === items.length;

  const run = (ids: number[]) => {
    setReport(null);
    recalculate.mutate(ids, { onSuccess: (result) => setReport(result) });
  };

  if (stale.isLoading) {
    return <p className="text-sm text-gray-500">Cargando…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">
          Ningún diseño está desactualizado. Todos se calcularon con las
          versiones vigentes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
        <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="text-sm text-amber-900">
          <p className="font-medium">
            {items.length} sub-diseño(s) se calcularon con una versión anterior.
          </p>
          <p className="mt-1">
            Sus valores siguen siendo los guardados. Recalcular los reescribirá
            con las versiones vigentes y quedará constancia de qué cambió.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() =>
              setSelected(allSelected ? [] : items.map((item) => item.id))
            }
            className="h-4 w-4 rounded border-gray-300"
          />
          Seleccionar todos
        </label>
        <Button
          size="sm"
          disabled={selected.length === 0}
          isLoading={recalculate.isPending}
          onClick={() => run(selected)}
        >
          <IconRefresh className="mr-1 h-4 w-4" />
          Recalcular {selected.length > 0 ? `(${selected.length})` : ""}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="w-10 px-4 py-2"></th>
              <th className="px-4 py-2">Sub-diseño</th>
              <th className="px-4 py-2">Diseño</th>
              <th className="px-4 py-2">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const outcome = report?.outcomes.find(
                (result) => result.subDesignId === item.id
              );
              return (
                <tr key={item.id}>
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(item.id)}
                      onChange={() =>
                        setSelected(
                          selected.includes(item.id)
                            ? selected.filter((id) => id !== item.id)
                            : [...selected, item.id]
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {item.name}{" "}
                    <span className="text-gray-400">#{item.id}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {item.designName ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    {outcome === undefined ? (
                      <span className="text-gray-400">—</span>
                    ) : outcome.status === "recalculado" ? (
                      <span className="text-green-700">
                        {outcome.changedCells.length} celda(s) actualizada(s)
                      </span>
                    ) : outcome.status === "sin-cambios" ? (
                      <span className="text-gray-600">sin cambios</span>
                    ) : outcome.status === "omitido" ? (
                      <span className="text-gray-500">sin fórmulas</span>
                    ) : (
                      <span className="text-red-600" title={outcome.reason}>
                        no se pudo: {outcome.reason}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {report && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <p className="font-medium text-gray-900">Resultado del recálculo</p>
          <p className="mt-1 text-gray-600">
            {report.recalculated} recalculados · {report.unchanged} sin cambios ·{" "}
            {report.skipped} sin fórmulas · {report.failed} no se pudieron
          </p>

          {report.outcomes
            .filter((outcome) => outcome.changedCells.length > 0)
            .map((outcome) => (
              <div key={outcome.subDesignId} className="mt-3">
                <p className="font-medium text-gray-800">
                  Sub-diseño #{outcome.subDesignId}
                </p>
                <ul className="mt-1 space-y-0.5 font-mono text-xs text-gray-600">
                  {outcome.changedCells.map((change) => (
                    <li key={change.ref}>
                      {change.ref} {change.formula}:{" "}
                      {JSON.stringify(change.before)} →{" "}
                      <span className="font-semibold text-gray-900">
                        {JSON.stringify(change.after)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
