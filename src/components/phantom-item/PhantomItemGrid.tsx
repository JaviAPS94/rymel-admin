import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { cn } from "@utils/cn";
import { COLUMN_LETTERS, getColumnByLetter } from "./columns";
import type { UsePhantomItemGridResult } from "@hooks/usePhantomItemGrid";

export interface GridSelection {
  letter: string;
  row: number;
}

interface PhantomItemGridProps {
  grid: UsePhantomItemGridResult;
  selected: GridSelection | null;
  onSelect: (cell: GridSelection) => void;
  readOnly?: boolean;
}

const letterIndex = (letter: string): number => COLUMN_LETTERS.indexOf(letter);

const cellsInRange = (a: GridSelection, b: GridSelection): GridSelection[] => {
  const startCol = Math.min(letterIndex(a.letter), letterIndex(b.letter));
  const endCol = Math.max(letterIndex(a.letter), letterIndex(b.letter));
  const startRow = Math.min(a.row, b.row);
  const endRow = Math.max(a.row, b.row);

  const cells: GridSelection[] = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = startCol; col <= endCol; col++) {
      cells.push({ letter: COLUMN_LETTERS[col], row });
    }
  }
  return cells;
};

const formatDisplay = (value: unknown): string => (value === undefined || value === null ? "" : String(value));

export const PhantomItemGrid = ({ grid, selected, onSelect, readOnly = false }: PhantomItemGridProps) => {
  const [rangeAnchor, setRangeAnchor] = useState<GridSelection | null>(null);
  const [editingCell, setEditingCell] = useState<GridSelection | null>(null);
  const [editValue, setEditValue] = useState("");
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectionCells = useMemo(() => {
    if (!selected) return [];
    return cellsInRange(rangeAnchor ?? selected, selected);
  }, [selected, rangeAnchor]);

  const isSelected = (letter: string, row: number) =>
    selectionCells.some((c) => c.letter === letter && c.row === row);

  const commitEdit = useCallback(() => {
    if (!editingCell) return;
    grid.setCellValue(editingCell.letter, editingCell.row, editValue);
    setEditingCell(null);
  }, [editingCell, editValue, grid]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const startEditing = (cell: GridSelection, initialValue?: string) => {
    const column = getColumnByLetter(cell.letter);
    if (readOnly || column?.readOnly) return;
    setEditingCell(cell);
    setEditValue(initialValue ?? grid.getCell(cell.letter, cell.row).formula);
  };

  const moveSelection = (deltaCol: number, deltaRow: number, extend: boolean) => {
    if (!selected) return;
    const nextCol = Math.min(
      Math.max(letterIndex(selected.letter) + deltaCol, 0),
      COLUMN_LETTERS.length - 1,
    );
    const nextRow = Math.min(Math.max(selected.row + deltaRow, 1), grid.rowCount);
    const next: GridSelection = { letter: COLUMN_LETTERS[nextCol], row: nextRow };

    if (extend) {
      setRangeAnchor(rangeAnchor ?? selected);
    } else {
      setRangeAnchor(null);
    }
    onSelect(next);
  };

  const handleCellMouseDown = (cell: GridSelection, shiftKey: boolean) => {
    if (editingCell) commitEdit();
    if (shiftKey && selected) {
      setRangeAnchor(rangeAnchor ?? selected);
      onSelect(cell);
      return;
    }
    setRangeAnchor(null);
    onSelect(cell);
    isDraggingRef.current = true;
  };

  const handleCellMouseEnter = (cell: GridSelection) => {
    if (!isDraggingRef.current || !selected) return;
    setRangeAnchor(rangeAnchor ?? selected);
    onSelect(cell);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!selected) return;

    if (editingCell) {
      if (event.key === "Enter") {
        event.preventDefault();
        commitEdit();
        moveSelection(0, 1, false);
      } else if (event.key === "Tab") {
        event.preventDefault();
        commitEdit();
        moveSelection(event.shiftKey ? -1 : 1, 0, false);
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancelEdit();
      }
      return;
    }

    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        moveSelection(0, -1, event.shiftKey);
        break;
      case "ArrowDown":
        event.preventDefault();
        moveSelection(0, 1, event.shiftKey);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveSelection(-1, 0, event.shiftKey);
        break;
      case "ArrowRight":
        event.preventDefault();
        moveSelection(1, 0, event.shiftKey);
        break;
      case "Tab":
        event.preventDefault();
        moveSelection(event.shiftKey ? -1 : 1, 0, false);
        break;
      case "Enter":
        event.preventDefault();
        moveSelection(0, 1, false);
        break;
      case "Delete":
      case "Backspace":
        event.preventDefault();
        selectionCells.forEach((cell) => {
          const column = getColumnByLetter(cell.letter);
          if (!readOnly && !column?.readOnly) grid.setCellValue(cell.letter, cell.row, "");
        });
        break;
      case "F2":
        event.preventDefault();
        startEditing(selected);
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          startEditing(selected, event.key);
        }
    }
  };

  const handleCopy = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (selectionCells.length === 0) return;
    event.preventDefault();

    const startRow = Math.min(...selectionCells.map((c) => c.row));
    const endRow = Math.max(...selectionCells.map((c) => c.row));
    const cols = [...new Set(selectionCells.map((c) => c.letter))].sort(
      (a, b) => letterIndex(a) - letterIndex(b),
    );

    const rows: string[] = [];
    for (let row = startRow; row <= endRow; row++) {
      rows.push(cols.map((letter) => grid.getCell(letter, row).formula).join("\t"));
    }
    event.clipboardData.setData("text/plain", rows.join("\n"));
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (!selected || readOnly) return;
    event.preventDefault();

    const text = event.clipboardData.getData("text/plain");
    if (!text) return;

    const pastedRows = text.replace(/\r/g, "").split("\n").filter((_, i, arr) => !(i === arr.length - 1 && arr[i] === ""));
    const startColIndex = letterIndex(selected.letter);

    const maxRowNeeded = selected.row + pastedRows.length - 1;
    while (grid.rowCount < maxRowNeeded) {
      grid.addRow();
    }

    pastedRows.forEach((line, rowOffset) => {
      const values = line.split("\t");
      values.forEach((value, colOffset) => {
        const colIndex = startColIndex + colOffset;
        if (colIndex >= COLUMN_LETTERS.length) return;
        const letter = COLUMN_LETTERS[colIndex];
        const column = getColumnByLetter(letter);
        if (column?.readOnly) return;
        grid.setCellValue(letter, selected.row + rowOffset, value);
      });
    });
  };

  return (
    <div
      ref={containerRef}
      className="border border-gray-200 rounded-lg overflow-auto outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onCopy={handleCopy}
      onPaste={handlePaste}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <table className="border-collapse text-sm w-full">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-20 bg-gray-100 border border-gray-200 w-10" />
            {COLUMN_LETTERS.map((letter) => (
              <th
                key={letter}
                className="sticky top-0 z-10 bg-gray-100 border border-gray-200 px-2 py-1 font-semibold text-gray-600 min-w-[110px]"
                title={getColumnByLetter(letter)?.header}
              >
                {letter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: grid.rowCount }, (_, i) => i + 1).map((row) => (
            <tr key={row}>
              <td className="sticky left-0 z-10 bg-gray-100 border border-gray-200 text-center text-gray-500 px-2">
                <div className="flex items-center justify-between gap-1">
                  <span>{row}</span>
                  {!readOnly && grid.rowCount > 1 && (
                    <button
                      type="button"
                      onClick={() => grid.removeRow(row)}
                      className="text-gray-400 hover:text-red-600"
                      title="Eliminar fila"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </td>
              {COLUMN_LETTERS.map((letter) => {
                const column = getColumnByLetter(letter)!;
                const cell = grid.getCell(letter, row);
                const isEditing =
                  editingCell?.letter === letter && editingCell.row === row;
                const selectedHere = isSelected(letter, row);
                const overLimit = grid.isOverLimit(letter, row);
                const circular = grid.isCircular(letter, row);
                const isPrimarySelected = selected?.letter === letter && selected.row === row;

                return (
                  <td
                    key={letter}
                    onMouseDown={(e) => handleCellMouseDown({ letter, row }, e.shiftKey)}
                    onMouseEnter={() => handleCellMouseEnter({ letter, row })}
                    onDoubleClick={() => startEditing({ letter, row })}
                    className={cn(
                      "border border-gray-200 px-2 py-1 cursor-cell align-top",
                      column.scope === "derived" && "bg-gray-50 text-gray-600",
                      column.scope === "header" && "bg-blue-50/40",
                      selectedHere && "bg-rymel-blue/10",
                      isPrimarySelected && "outline outline-2 outline-rymel-blue -outline-offset-1",
                      overLimit && "bg-red-100 text-red-700",
                      circular && "bg-red-200 text-red-800 font-semibold",
                    )}
                  >
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        className="w-full min-w-[90px] bg-white outline-none border border-rymel-blue rounded px-1"
                      />
                    ) : (
                      <span className="block truncate max-w-[220px]">
                        {circular ? "#CIRCULAR" : formatDisplay(cell.computed)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {!readOnly && (
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={() => grid.addRow()}
            className="flex items-center gap-1 text-sm text-rymel-blue hover:underline"
          >
            <IconPlus className="h-4 w-4" />
            Agregar fila
          </button>
        </div>
      )}
    </div>
  );
};
