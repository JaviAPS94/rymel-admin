import { IconAlertTriangle, IconCircleCheck, IconDecimal } from "@tabler/icons-react";
import type { DecimalCommaCell } from "@rymel/design-template";
import type { TemplateDiagnostic } from "@/types/template.types";
import type { SheetDiagnostics } from "@hooks/useTemplateValidation";

interface Props {
  bySheet: SheetDiagnostics[];
  documentLevel: TemplateDiagnostic[];
  total: number;
  /** Lleva la selección al problema: a su celda, o a su región. */
  onNavigate: (diagnostic: TemplateDiagnostic) => void;
  /** Celdas con decimales escritos con coma, que el motor no lee como números. */
  decimalCommaCells: DecimalCommaCell[];
  onNormalizeDecimals: () => void;
}

/**
 * Aviso de los decimales escritos con coma.
 *
 * No es un diagnóstico de validación y por eso va aparte: no impide publicar.
 * Una plantilla con `3,36` es válida —es texto en una celda—, solo que ese
 * texto no calcula. Bloquear la publicación por esto dejaría sin publicar la
 * única plantilla real, que tiene 1200.
 */
const DecimalCommaNotice = ({
  cells,
  onNormalize,
}: {
  cells: DecimalCommaCell[];
  onNormalize: () => void;
}) => {
  if (cells.length === 0) return null;

  const ambiguous = cells.filter((cell) => cell.ambiguous).length;

  return (
    <div className="border-b border-gray-200 bg-blue-50 p-3 text-xs text-blue-900">
      <div className="flex items-center gap-2 font-medium">
        <IconDecimal className="h-4 w-4 shrink-0" />
        {cells.length} celda(s) con decimales escritos con coma
      </div>

      <p className="mt-1">
        El motor las lee como texto, no como números: una fórmula que las use no
        calculará. Se convierten a punto — <span className="font-mono">3,36</span>{" "}
        pasa a <span className="font-mono">3.36</span>.
      </p>

      {ambiguous > 0 && (
        <p className="mt-1">
          <strong>{ambiguous}</strong> llevan tres decimales y podrían leerse
          como separador de miles (<span className="font-mono">16,708</span>).
          Conviene revisarlas antes.
        </p>
      )}

      <p className="mt-1 font-mono">
        {cells
          .slice(0, 4)
          .map((cell) => `${cell.sheet}!${cell.ref} ${cell.before}→${cell.after}`)
          .join("  ")}
        {cells.length > 4 && " …"}
      </p>

      <button
        onClick={onNormalize}
        className="mt-2 rounded bg-rymel-blue px-2 py-1 text-white hover:bg-blue-700"
      >
        Convertir las {cells.length}
      </button>
    </div>
  );
};

/** Etiqueta legible de cada clase de problema. */
const CODE_LABEL: Record<string, string> = {
  "duplicate-sheet-name": "Nombre de hoja repetido",
  "invalid-cell-ref": "Referencia inválida",
  "region-out-of-sheet": "Región fuera de la hoja",
  "overlapping-zones": "Zonas solapadas",
  "invalid-catalog-offsets": "Columnas de catálogo",
  "missing-catalog-table": "Catálogo inexistente",
  "missing-condition-cell": "Celda de condición inválida",
  "missing-catalog-item": "Ítem inexistente",
  "duplicate-material-tag": "Etiqueta MO/MD repetida",
  "read-only-input": "Desplegable protegido",
  "empty-name": "Falta el nombre",
  "graphic-directive": "Directiva de gráfico",
  syntax: "Sintaxis",
  "unknown-sheet": "Hoja inexistente",
  "unknown-function": "Función inexistente",
  "function-not-assigned": "Función no asignada",
  "argument-count": "Argumentos",
  circular: "Referencia circular",
};

/**
 * Panel de diagnósticos.
 *
 * Cada uno lleva a su celda o a su región. Un listado de problemas que no
 * dice dónde están obliga a buscarlos a mano en una hoja de 1900 celdas, que
 * es tanto como no darlos.
 */
export const DiagnosticsPanel = ({
  bySheet,
  documentLevel,
  total,
  onNavigate,
  decimalCommaCells,
  onNormalizeDecimals,
}: Props) => {
  if (total === 0) {
    return (
      <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white">
        <DecimalCommaNotice
          cells={decimalCommaCells}
          onNormalize={onNormalizeDecimals}
        />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
          <IconCircleCheck className="h-8 w-8 text-green-600" />
          <p className="text-sm text-gray-700">
            La plantilla no tiene problemas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white">
      <DecimalCommaNotice
        cells={decimalCommaCells}
        onNormalize={onNormalizeDecimals}
      />
      <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 text-sm font-medium text-amber-900">
        <IconAlertTriangle className="h-4 w-4 text-amber-600" />
        {total} problema(s)
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {documentLevel.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Documento
            </p>
            <ul className="mt-1 space-y-1">
              {documentLevel.map((diagnostic, index) => (
                <DiagnosticRow
                  key={index}
                  diagnostic={diagnostic}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        )}

        {bySheet.map((group) => (
          <div key={group.sheet}>
            <p className="text-xs font-medium uppercase text-gray-500">
              {group.sheet}
            </p>
            <ul className="mt-1 space-y-1">
              {group.diagnostics.map((diagnostic, index) => (
                <DiagnosticRow
                  key={index}
                  diagnostic={diagnostic}
                  onNavigate={onNavigate}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

const DiagnosticRow = ({
  diagnostic,
  onNavigate,
}: {
  diagnostic: TemplateDiagnostic;
  onNavigate: (diagnostic: TemplateDiagnostic) => void;
}) => (
  <li>
    <button
      onClick={() => onNavigate(diagnostic)}
      className="w-full rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-left text-xs hover:bg-amber-100"
    >
      <span className="font-medium text-amber-900">
        {CODE_LABEL[diagnostic.code] ?? diagnostic.code}
        {diagnostic.cell && (
          <span className="ml-1 font-mono">· {diagnostic.cell}</span>
        )}
      </span>
      <span className="mt-0.5 block text-amber-800">{diagnostic.message}</span>
    </button>
  </li>
);
