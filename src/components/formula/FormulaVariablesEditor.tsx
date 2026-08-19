import {
  IconArrowDown,
  IconArrowUp,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

interface FormulaVariablesEditorProps {
  variables: string[];
  onChange: (variables: string[]) => void;
  /** Orden con el que se publicó la versión vigente, para señalar el cambio. */
  originalOrder?: string[];
  disabled?: boolean;
}

/**
 * Editor de variables como **lista ordenada**.
 *
 * La posición no es cosmética: las hojas invocan las fórmulas con argumentos
 * posicionales, así que `=CUBIC(A1, B2)` asigna `A1` a la primera variable
 * declarada. Cambiar `x,c,d` por `c,x,d` no rompe nada visible — la hoja
 * sigue evaluando — pero devuelve otro número en todos los diseños ya
 * guardados. Por eso la posición se muestra siempre y el reordenamiento es
 * un gesto explícito, no un arrastre accidental.
 */
export const FormulaVariablesEditor = ({
  variables,
  onChange,
  originalOrder,
  disabled,
}: FormulaVariablesEditorProps) => {
  const reordered =
    originalOrder !== undefined &&
    originalOrder.length === variables.length &&
    originalOrder.some((name, index) => name !== variables[index]) &&
    originalOrder.every((name) => variables.includes(name));

  const update = (index: number, value: string) => {
    const next = [...variables];
    next[index] = value;
    onChange(next);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= variables.length) return;
    const next = [...variables];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Variables <span className="text-gray-400">(el orden es el de los argumentos)</span>
        </label>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange([...variables, ""])}
            className="inline-flex items-center gap-1 text-sm text-rymel-blue hover:underline"
          >
            <IconPlus className="h-4 w-4" /> Agregar
          </button>
        )}
      </div>

      {variables.length === 0 && (
        <p className="text-sm text-gray-500">
          Sin variables. Una fórmula necesita al menos una.
        </p>
      )}

      <ul className="space-y-2">
        {variables.map((variable, index) => (
          <li key={index} className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-100 text-xs font-semibold text-gray-600"
              title={`Recibe el argumento número ${index + 1}`}
            >
              {index + 1}º
            </span>
            <input
              value={variable}
              onChange={(event) => update(index, event.target.value)}
              disabled={disabled}
              placeholder="nombre"
              className="h-9 flex-1 rounded-md border border-gray-300 px-3 font-mono text-sm focus:border-rymel-blue focus:outline-none disabled:bg-gray-50"
            />
            {!disabled && (
              <>
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  title="Subir"
                >
                  <IconArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === variables.length - 1}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  title="Bajar"
                >
                  <IconArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange(variables.filter((_, i) => i !== index))
                  }
                  className="rounded p-1.5 text-red-500 hover:bg-red-50"
                  title="Quitar"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {reordered && (
        <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-800">
          Cambiaste el orden de las variables. Las hojas pasan los argumentos
          por posición, así que las invocaciones ya guardadas darán otro
          resultado sin avisar.
        </p>
      )}

      <p className="text-xs text-gray-500">
        Se invoca así:{" "}
        <code className="rounded bg-gray-100 px-1 font-mono">
          =CODIGO({variables.filter(Boolean).join(", ") || "…"})
        </code>
      </p>
    </div>
  );
};
