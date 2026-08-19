import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { ConstantEntry } from "@/types/designFunction.types";

interface FormulaConstantsEditorProps {
  constants: ConstantEntry[];
  onChange: (constants: ConstantEntry[]) => void;
  disabled?: boolean;
}

const NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;

/**
 * Editor de constantes.
 *
 * Valida el nombre en el propio campo en vez de esperar al servidor: el
 * formato es una regla fija y sencilla, y descubrirla tras pulsar "guardar"
 * es peor experiencia que verla mientras se escribe.
 */
export const FormulaConstantsEditor = ({
  constants,
  onChange,
  disabled,
}: FormulaConstantsEditorProps) => {
  const update = (index: number, patch: Partial<ConstantEntry>) => {
    const next = [...constants];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">Constantes</label>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange([...constants, { name: "", value: "" }])}
            className="inline-flex items-center gap-1 text-sm text-rymel-blue hover:underline"
          >
            <IconPlus className="h-4 w-4" /> Agregar
          </button>
        )}
      </div>

      {constants.length === 0 && (
        <p className="text-sm text-gray-500">Sin constantes.</p>
      )}

      <ul className="space-y-2">
        {constants.map((constant, index) => {
          const nameInvalid =
            constant.name.trim() !== "" && !NAME_PATTERN.test(constant.name);
          const valueInvalid =
            constant.value.trim() !== "" &&
            !Number.isFinite(Number(constant.value));

          return (
            <li key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  value={constant.name}
                  onChange={(event) =>
                    update(index, { name: event.target.value.toUpperCase() })
                  }
                  disabled={disabled}
                  placeholder="CONST_1"
                  className={`h-9 flex-1 rounded-md border px-3 font-mono text-sm focus:outline-none disabled:bg-gray-50 ${
                    nameInvalid
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-300 focus:border-rymel-blue"
                  }`}
                />
                <input
                  value={constant.value}
                  onChange={(event) =>
                    update(index, { value: event.target.value })
                  }
                  disabled={disabled}
                  placeholder="0"
                  inputMode="decimal"
                  className={`h-9 w-32 rounded-md border px-3 font-mono text-sm focus:outline-none disabled:bg-gray-50 ${
                    valueInvalid
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-300 focus:border-rymel-blue"
                  }`}
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange(constants.filter((_, i) => i !== index))
                    }
                    className="rounded p-1.5 text-red-500 hover:bg-red-50"
                    title="Quitar"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
              {nameInvalid && (
                <p className="text-xs text-red-600">
                  Solo mayúsculas, dígitos y guiones bajos, empezando por letra.
                </p>
              )}
              {valueInvalid && (
                <p className="text-xs text-red-600">
                  El valor debe ser un número finito.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
