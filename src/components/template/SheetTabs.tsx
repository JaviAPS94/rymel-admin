import { useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import type { TemplateSheet } from "@rymel/design-template";

interface Props {
  sheets: TemplateSheet[];
  activeSheetName: string;
  dirtySheets: Set<string>;
  onSelect: (name: string) => void;
  onAdd: (name: string) => void;
  onRename: (from: string, to: string) => void;
  onRemove: (name: string) => void;
  onReorder: (names: string[]) => void;
  /** Cuántas fórmulas nombran a esa hoja. Se avisa antes de renombrarla. */
  countReferences: (name: string) => number;
}

const nextSheetName = (sheets: TemplateSheet[]): string => {
  let index = sheets.length + 1;
  while (sheets.some((sheet) => sheet.name === `Hoja${index}`)) index++;
  return `Hoja${index}`;
};

/**
 * Pestañas de hoja.
 *
 * Renombrar es la operación delicada: las referencias entre hojas se resuelven
 * por nombre, así que cambiarlo reescribe todas las fórmulas que la citan. Se
 * dice cuántas son antes de confirmar, porque una plantilla con `Tablas`
 * renombrada a la ligera deja ocho fórmulas apuntando al vacío.
 */
export const SheetTabs = ({
  sheets,
  activeSheetName,
  dirtySheets,
  onSelect,
  onAdd,
  onRename,
  onRemove,
  onReorder,
  countReferences,
}: Props) => {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const startRename = (name: string) => {
    setRenaming(name);
    setDraft(name);
  };

  const commitRename = () => {
    if (!renaming) return;
    const target = draft.trim();

    if (target === "" || target === renaming) {
      setRenaming(null);
      return;
    }

    if (sheets.some((sheet) => sheet.name === target)) {
      window.alert(
        `Ya hay una hoja llamada "${target}". Las referencias entre hojas se resuelven por nombre, así que no pueden repetirse.`,
      );
      return;
    }

    const references = countReferences(renaming);
    if (
      references > 0 &&
      !window.confirm(
        `${references} fórmula(s) nombran a "${renaming}". Se reescribirán para apuntar a "${target}". ¿Continuar?`,
      )
    ) {
      setRenaming(null);
      return;
    }

    onRename(renaming, target);
    setRenaming(null);
  };

  const move = (name: string, direction: -1 | 1) => {
    const names = sheets.map((sheet) => sheet.name);
    const index = names.indexOf(name);
    const target = index + direction;
    if (index === -1 || target < 0 || target >= names.length) return;
    [names[index], names[target]] = [names[target], names[index]];
    onReorder(names);
  };

  return (
    <>
      <div className="flex items-center gap-1 border-t border-gray-200 bg-gray-50 px-2 py-1">
        {sheets.map((sheet, index) => {
          const isActive = sheet.name === activeSheetName;

          return (
            <div
              key={sheet.name}
              className={`group flex items-center gap-1 rounded-t px-3 py-1.5 text-sm ${
                isActive
                  ? "border-b-2 border-rymel-blue bg-white font-medium text-rymel-blue"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {renaming === sheet.name ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitRename();
                    if (event.key === "Escape") setRenaming(null);
                  }}
                  className="w-28 rounded border border-rymel-blue px-1 text-sm outline-none"
                />
              ) : (
                <button
                  onClick={() => onSelect(sheet.name)}
                  onDoubleClick={() => startRename(sheet.name)}
                  title="Doble clic para renombrar"
                >
                  {sheet.name}
                  {dirtySheets.has(sheet.name) && (
                    <span className="ml-1 text-amber-600" title="Sin guardar">
                      •
                    </span>
                  )}
                </button>
              )}

              <span className="hidden items-center gap-0.5 group-hover:flex">
                <button
                  title="Mover a la izquierda"
                  disabled={index === 0}
                  onClick={() => move(sheet.name, -1)}
                  className="text-gray-400 hover:text-rymel-blue disabled:opacity-20"
                >
                  <IconChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  title="Mover a la derecha"
                  disabled={index === sheets.length - 1}
                  onClick={() => move(sheet.name, 1)}
                  className="text-gray-400 hover:text-rymel-blue disabled:opacity-20"
                >
                  <IconChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  title="Eliminar hoja"
                  onClick={() => setConfirmRemove(sheet.name)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          );
        })}

        <button
          onClick={() => onAdd(nextSheetName(sheets))}
          title="Añadir hoja"
          className="ml-1 rounded p-1.5 text-gray-500 hover:bg-gray-200 hover:text-rymel-blue"
        >
          <IconPlus className="h-4 w-4" />
        </button>
      </div>

      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">
              Eliminar «{confirmRemove}»
            </h3>
            <p className="mt-3 text-sm text-gray-700">
              {countReferences(confirmRemove) > 0
                ? `${countReferences(confirmRemove)} fórmula(s) la nombran y quedarán apuntando a una hoja que no existe. La validación las señalará.`
                : "Ninguna fórmula la nombra."}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirmRemove(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onRemove(confirmRemove);
                  setConfirmRemove(null);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
