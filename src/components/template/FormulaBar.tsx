import type { FormulaValue } from "@rymel/formula-engine";

interface Props {
  activeRef: string;
  sheetName: string;
  content: string;
  value: FormulaValue;
  /** Lo que hay escrito ahora mismo, que puede diferir del contenido guardado. */
  draft: string;
  onDraftChange: (draft: string) => void;
  /** Dónde está el cursor: es donde caerá lo que se inserte señalando celdas. */
  onCursorChange: (cursor: number) => void;
  onCommit: (content: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Barra de fórmulas.
 *
 * Muestra **el contenido**, no el valor: en una celda con `=SUMA(A1:A5)` lo
 * que hay que poder editar es la fórmula, y el resultado se ve en la celda. La
 * referencia va calificada con la hoja porque en esta plantilla una fórmula
 * puede apuntar a otra, y saber dónde se está parado evita escribir la
 * referencia equivocada.
 */
/**
 * El borrador ya no vive aquí.
 *
 * Lo lleva el editor, porque el modo fórmula tiene que poder insertar en él la
 * referencia de la celda que se señala: si el texto viviera dentro de este
 * componente, no habría forma de escribirle desde fuera.
 */
export const FormulaBar = ({
  activeRef,
  sheetName,
  content,
  value,
  draft,
  onDraftChange,
  onCursorChange,
  onCommit,
  inputRef,
}: Props) => {
  const isFormula = draft.startsWith("=");

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <span className="w-32 shrink-0 truncate font-mono text-xs text-gray-500">
        {sheetName}!{activeRef}
      </span>

      <span className="text-gray-300">|</span>

      <input
        ref={inputRef}
        data-testid="formula-input"
        value={draft}
        onChange={(event) => {
          onDraftChange(event.target.value);
          onCursorChange(event.target.selectionStart ?? event.target.value.length);
        }}
        onSelect={(event) =>
          onCursorChange(event.currentTarget.selectionStart ?? 0)
        }
        onKeyUp={(event) =>
          onCursorChange(event.currentTarget.selectionStart ?? 0)
        }
        onBlur={() => {
          if (draft !== content) onCommit(draft);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            onDraftChange(content);
            event.currentTarget.blur();
          }
        }}
        placeholder="Valor o fórmula (=SUMA(A1:A5))"
        className="flex-1 border-none font-mono text-sm outline-none"
      />

      {isFormula && (
        <span
          className="shrink-0 rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600"
          title="Valor calculado"
        >
          = {String(value)}
        </span>
      )}
    </div>
  );
};
