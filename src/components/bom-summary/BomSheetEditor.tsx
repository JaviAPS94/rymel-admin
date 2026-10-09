import { useCallback, useEffect, useMemo, useState } from "react";
import { IconArrowBackUp, IconArrowForwardUp } from "@tabler/icons-react";
import { FormulaBar } from "@components/template/FormulaBar";
import { FormulaModeBar } from "@components/template/FormulaModeBar";
import { FormatToolbar } from "@components/template/FormatToolbar";
import { TemplateGrid } from "@components/template/grid/TemplateGrid";
import { mergeRect, unmergeAt } from "@components/template/sheetStructure";
import { useTemplateDocument } from "@hooks/useTemplateDocument";
import { useGridSelection, refOf } from "@hooks/useGridSelection";
import { useFormulaBuilder } from "@hooks/useFormulaBuilder";
import type { SavedCell } from "@/types/designBom.types";
import { BOM_SHEET_NAME, toBomDocument, visibleCells } from "./bomSheet";

interface Props {
  /** Las celdas armadas por `buildBomSummaryCells`. */
  cells: Record<string, SavedCell>;
  /** Pulsar la celda ▶/▼ de un semielaborado hijo. */
  onToggle: (nodeId: number) => void;
  /** Lo que se ve, con las ediciones, para exportarlo. */
  onVisibleChange: (cells: Record<string, SavedCell>) => void;
}

/**
 * La lista de materiales como una hoja de Excel, igual que en el cliente.
 *
 * Se edita como cualquier hoja —valores, fórmulas, formato, deshacer— con la
 * rejilla y el motor del editor de plantillas. Como en el cliente, **lo editado
 * no se guarda con el diseño**, y desplegar un semielaborado hijo vuelve a
 * armar la hoja. Lo que sí sale de aquí es la exportación, con lo editado.
 */
export const BomSheetEditor = ({ cells, onToggle, onVisibleChange }: Props) => {
  const initial = useMemo(() => toBomDocument(cells), [cells]);
  const state = useTemplateDocument(initial);
  const selection = useGridSelection();
  const formula = useFormulaBuilder();
  const [editing, setEditing] = useState<string | null>(null);

  const sheet = state.document.sheets[0]!;
  const activeCell = sheet.cells[selection.activeRef];
  const valueOf = useCallback(
    (ref: string) => state.values[`${BOM_SHEET_NAME}!${ref}`],
    [state.values],
  );

  useEffect(() => {
    onVisibleChange(visibleCells(state.document, valueOf));
  }, [state.document, valueOf, onVisibleChange]);

  /** Al cambiar de celda la barra muestra su contenido, salvo mientras se edita o se señala. */
  const [lastRef, setLastRef] = useState(selection.activeRef);
  if (selection.activeRef !== lastRef && !formula.consumesClick && editing === null) {
    setLastRef(selection.activeRef);
    formula.start(activeCell?.content ?? "", BOM_SHEET_NAME);
  }

  const commitEditing = useCallback(
    (move: "down" | "right" | "none") => {
      if (editing) state.setCellContent(BOM_SHEET_NAME, editing, formula.draft);
      setEditing(null);
      if (move === "down") selection.move(1, 0);
      if (move === "right") selection.move(0, 1);
    },
    [editing, formula, selection, state],
  );

  /** Teclado de la rejilla: navegación, edición, borrar y deshacer. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
        return;
      }

      const moves: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
        Enter: [1, 0],
        Tab: [0, 1],
      };
      if (moves[event.key]) {
        event.preventDefault();
        selection.move(...moves[event.key]);
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        for (const ref of selection.selectedRefs) state.setCellContent(BOM_SHEET_NAME, ref, "");
        return;
      }

      if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
        setEditing(selection.activeRef);
        formula.start(event.key, BOM_SHEET_NAME);
        event.preventDefault();
      } else if (event.key === "F2") {
        setEditing(selection.activeRef);
        formula.start(sheet.cells[selection.activeRef]?.content ?? "", BOM_SHEET_NAME);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [formula, selection, sheet, state]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          title="Deshacer"
          disabled={!state.canUndo}
          onClick={state.undo}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
        >
          <IconArrowBackUp className="h-4 w-4" />
        </button>
        <button
          title="Rehacer"
          disabled={!state.canRedo}
          onClick={state.redo}
          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
        >
          <IconArrowForwardUp className="h-4 w-4" />
        </button>
        <FormatToolbar
          activeCell={activeCell}
          selectedRefs={selection.selectedRefs}
          rect={selection.rect}
          styles={sheet.styles}
          onApplyFormat={(patch) => {
            for (const ref of selection.selectedRefs) {
              state.updateCell(BOM_SHEET_NAME, ref, {
                format: { ...sheet.cells[ref]?.format, ...patch },
              });
            }
          }}
          onClearFormat={() => {
            for (const ref of selection.selectedRefs) {
              state.updateCell(BOM_SHEET_NAME, ref, { format: undefined });
            }
          }}
          onSetStyles={(styles) => state.setSheetStyles(BOM_SHEET_NAME, styles)}
          onMerge={() => state.setSheetStyles(BOM_SHEET_NAME, mergeRect(sheet.styles, selection.rect))}
          onUnmerge={() =>
            state.setSheetStyles(
              BOM_SHEET_NAME,
              unmergeAt(sheet.styles, refOf(selection.rect.top, selection.rect.left)),
            )
          }
        />
      </div>

      <FormulaBar
        activeRef={selection.activeRef}
        sheetName={BOM_SHEET_NAME}
        content={activeCell?.content ?? ""}
        value={valueOf(selection.activeRef) ?? ""}
        draft={formula.draft}
        onDraftChange={formula.setDraft}
        onCursorChange={formula.setCursor}
        inputRef={formula.inputRef}
        onCommit={(content) => state.setCellContent(BOM_SHEET_NAME, lastRef, content)}
      />

      {formula.isActive && (
        <FormulaModeBar
          cursor={formula.cursor}
          isPicking={formula.isPicking}
          rangeStart={formula.rangeStart}
          activeRef={selection.activeRef}
          designFunctions={[]}
          onTogglePicking={formula.togglePicking}
          onToggleRange={() => formula.toggleRange(selection.activeRef)}
          onInsert={formula.insert}
          onExit={() => {
            state.setCellContent(BOM_SHEET_NAME, lastRef, formula.draft);
            formula.finish();
          }}
        />
      )}

      <div className="flex h-[60vh] flex-col">
        <TemplateGrid
          sheet={sheet}
          values={state.values}
          selection={selection}
          editing={editing}
          editingValue={formula.draft}
          onEditingValueChange={formula.setDraft}
          onStartEditing={(ref) => {
            setEditing(ref);
            formula.start(sheet.cells[ref]?.content ?? "", BOM_SHEET_NAME);
          }}
          onPickCell={(ref) => {
            if (formula.pickCell(BOM_SHEET_NAME, ref)) return true;
            // La celda ▶/▼ de un semielaborado hijo lo despliega, como en el cliente.
            const toggle = sheet.cells[ref]?.bomToggleNodeId;
            if (toggle !== undefined && editing === null) {
              onToggle(toggle);
              return true;
            }
            return false;
          }}
          onCommitEditing={commitEditing}
          onCancelEditing={() => {
            setEditing(null);
            formula.start(activeCell?.content ?? "", BOM_SHEET_NAME);
          }}
          onResizeColumn={(column, width) =>
            state.setSheetStyles(BOM_SHEET_NAME, {
              ...sheet.styles,
              columnWidths: { ...sheet.styles.columnWidths, [column]: width },
            })
          }
          onResizeRow={(row, height) =>
            state.setSheetStyles(BOM_SHEET_NAME, {
              ...sheet.styles,
              rowHeights: { ...sheet.styles.rowHeights, [row]: height },
            })
          }
        />
      </div>
    </div>
  );
};
