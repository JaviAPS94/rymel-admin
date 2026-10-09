import { useState, type KeyboardEvent } from "react";
import { IconArrowBackUp } from "@tabler/icons-react";
import type { UsePhantomItemGridResult } from "@hooks/usePhantomItemGrid";
import type { GridSelection } from "./PhantomItemGrid";

interface FormulaBarProps {
  grid: UsePhantomItemGridResult;
  selected: GridSelection | null;
}

/**
 * Shows the selected cell's reference and its underlying content — the
 * formula when it has one, the literal value otherwise — and applies edits
 * back to that cell (tasks.md 10.5).
 */
export const FormulaBar = ({ grid, selected }: FormulaBarProps) => {
  if (!selected) {
    return (
      <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm text-gray-400">
        Selecciona una celda
      </div>
    );
  }

  const formula = grid.getCell(selected.letter, selected.row).formula;

  return (
    <FormulaBarField
      // Remounts (resetting local edit state) whenever the selection moves
      // to a different cell, or the cell's own content changes externally
      // (e.g. "restore default formula").
      key={`${selected.letter}${selected.row}:${formula}`}
      grid={grid}
      selected={selected}
      initialFormula={formula}
    />
  );
};

interface FormulaBarFieldProps {
  grid: UsePhantomItemGridResult;
  selected: GridSelection;
  initialFormula: string;
}

const FormulaBarField = ({ grid, selected, initialFormula }: FormulaBarFieldProps) => {
  const [value, setValue] = useState(initialFormula);

  const column = grid.getColumn(selected.letter);
  const cellRef = `${selected.letter}${selected.row}`;
  const canRestore = column?.defaultFormula && grid.hasOwnFormula(selected.letter, selected.row);

  const commit = () => grid.setCellValue(selected.letter, selected.row, value);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      setValue(initialFormula);
    }
  };

  return (
    <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
      <span className="font-mono text-xs font-semibold text-gray-500 min-w-[3rem]">
        {cellRef}
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={column?.header}
        className="flex-1 text-sm font-mono outline-none"
      />
      {canRestore && (
        <button
          type="button"
          onClick={() => grid.restoreDefaultFormula(selected.letter, selected.row)}
          title="Restaurar fórmula por defecto"
          className="text-gray-400 hover:text-rymel-blue"
        >
          <IconArrowBackUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
