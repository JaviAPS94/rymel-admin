import { useMemo } from "react";
import { TemplateGrid } from "@components/template/grid/TemplateGrid";
import { useGridSelection } from "@hooks/useGridSelection";
import type { SavedSheet } from "@/types/design.types";
import { toGridSheet } from "./savedSheet";

const NO_OP = () => {};

/**
 * Una hoja guardada de un diseño, en la rejilla del editor y sin poder
 * editarla: se selecciona y se navega, pero nada abre la edición ni cambia
 * tamaños. Encima se ve qué tiene escrito la celda elegida y qué valor dio.
 *
 * `onCellClick` recibe el clic antes que la selección; si devuelve `true`, lo
 * consume (así se despliegan los semielaborados de la lista de materiales).
 */
export const ReadOnlySheet = ({
  saved,
  onCellClick,
}: {
  saved: SavedSheet;
  onCellClick?: (ref: string) => boolean;
}) => {
  const { sheet, values } = useMemo(() => toGridSheet(saved), [saved]);
  const selection = useGridSelection();
  const ref = selection.activeRef;
  const content = sheet.cells[ref]?.content ?? "";
  const value = values[`${sheet.name}!${ref}`];

  return (
    <div className="space-y-2">
      <p
        className="flex flex-wrap items-baseline gap-x-2 rounded border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs text-gray-700"
        aria-label="Celda elegida"
      >
        <span className="font-semibold">{ref}</span>
        <span className="text-gray-500">{content || "vacía"}</span>
        {content.startsWith("=") && <span>→ {String(value ?? "")}</span>}
      </p>
      <div className="flex h-[60vh] flex-col">
        <TemplateGrid
          sheet={sheet}
          values={values}
          selection={selection}
          editing={null}
          editingValue=""
          onEditingValueChange={NO_OP}
          onStartEditing={NO_OP}
          onCommitEditing={NO_OP}
          onCancelEditing={NO_OP}
          onResizeColumn={NO_OP}
          onResizeRow={NO_OP}
          onPickCell={onCellClick}
        />
      </div>
    </div>
  );
};
