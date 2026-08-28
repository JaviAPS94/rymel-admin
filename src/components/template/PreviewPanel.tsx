import { useState } from "react";
import { IconPlayerPlay, IconX } from "@tabler/icons-react";
import type { ElementField } from "@/types/template.types";
import type { UseTemplatePreviewResult } from "@hooks/useTemplatePreview";

interface Props {
  preview: UseTemplatePreviewResult;
  elementFields: ElementField[];
  /** Claves de elemento que la plantilla declara en alguna celda. */
  usedKeys: string[];
  onClose: () => void;
}

/**
 * Vista previa calculada.
 *
 * El editor calcula en local mientras se escribe, pero las fórmulas de diseño
 * solo las resuelve el servidor: hasta que se ejecuta esto, esas celdas están
 * pendientes. Es la única forma de ver, antes de publicar, los mismos números
 * que verá el diseñador.
 *
 * Los valores de prueba existen porque en el editor no hay elemento. Sin
 * ellos, las celdas enlazadas valdrían cero y la vista previa mentiría.
 */
export const PreviewPanel = ({
  preview,
  elementFields,
  usedKeys,
  onClose,
}: Props) => {
  const [values, setValues] = useState<Record<string, string>>({});

  const fields = elementFields.filter((field) => usedKeys.includes(field.key));

  const run = () => {
    const parsed: Record<string, string | number> = {};
    for (const [key, raw] of Object.entries(values)) {
      if (raw.trim() === "") continue;
      const asNumber = Number(raw);
      parsed[key] = Number.isNaN(asNumber) ? raw : asNumber;
    }
    void preview.run(parsed);
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <span className="text-sm font-medium text-gray-900">Vista previa</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
          <IconX className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
        {usedKeys.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-gray-500">
              Valores de prueba del elemento
            </p>
            {fields.length === 0 && (
              <p className="text-xs text-gray-500">
                La plantilla usa claves que no están en el catálogo de campos:{" "}
                {usedKeys.join(", ")}
              </p>
            )}
            {fields.map((field) => (
              <label key={field.key} className="flex items-center gap-2 text-xs">
                <span className="w-32 shrink-0 truncate" title={field.label}>
                  {field.label}
                </span>
                <input
                  value={values[field.key] ?? ""}
                  onChange={(event) =>
                    setValues({ ...values, [field.key]: event.target.value })
                  }
                  placeholder={field.type}
                  className="h-7 flex-1 rounded border border-gray-300 px-2"
                />
              </label>
            ))}
          </div>
        )}

        <button
          onClick={run}
          disabled={preview.isRunning}
          className="flex w-full items-center justify-center gap-1 rounded bg-rymel-blue px-2 py-1.5 text-sm text-white disabled:opacity-40"
        >
          <IconPlayerPlay className="h-4 w-4" />
          {preview.isRunning ? "Calculando…" : "Calcular"}
        </button>

        {preview.error && (
          <p className="rounded bg-red-50 p-2 text-xs text-red-800">
            {preview.error}
          </p>
        )}

        {preview.result && (
          <div className="space-y-2">
            <p className="rounded bg-gray-50 p-2 text-xs text-gray-700">
              {preview.result.batchCount === 0
                ? "Sin fórmulas de diseño que resolver."
                : `${preview.result.batchCount} petición(es) al servidor, una por nivel de dependencia.`}
            </p>

            {preview.result.circular.length > 0 && (
              <div className="rounded bg-red-50 p-2 text-xs text-red-800">
                <p className="font-medium">
                  {preview.result.circular.length} celda(s) circulares
                </p>
                <p className="font-mono">
                  {preview.result.circular.slice(0, 8).join(", ")}
                </p>
              </div>
            )}

            {preview.result.failed.length > 0 ? (
              <div className="rounded bg-amber-50 p-2 text-xs text-amber-900">
                <p className="font-medium">
                  {preview.result.failed.length} celda(s) no se pudieron calcular
                </p>
                <ul className="mt-1 space-y-0.5 font-mono">
                  {preview.result.failed.slice(0, 12).map((item) => (
                    <li key={item.ref}>
                      {item.ref}: {item.reason}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 font-sans">
                  El resto de la plantilla conserva sus valores: el fallo queda
                  acotado a esas celdas.
                </p>
              </div>
            ) : (
              <p className="rounded bg-green-50 p-2 text-xs text-green-900">
                Todas las celdas se calcularon. La rejilla muestra los valores
                de la vista previa.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
