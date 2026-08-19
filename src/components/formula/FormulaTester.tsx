import { useState } from "react";
import { IconPlayerPlay } from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { useTestExpression } from "@hooks/useDesignFunctions";
import type { ConstantEntry } from "@/types/designFunction.types";
import { entriesToConstants } from "@/types/designFunction.types";

interface FormulaTesterProps {
  expression: string;
  variables: string[];
  constants: ConstantEntry[];
}

/**
 * Probador de la expresión en edición.
 *
 * Evalúa contra el motor real, no contra una simulación local: el punto de
 * probar es saber qué va a devolver en producción, y una segunda ruta de
 * evaluación podría comportarse distinto justo en el caso que se está
 * comprobando. No guarda nada.
 */
export const FormulaTester = ({
  expression,
  variables,
  constants,
}: FormulaTesterProps) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const test = useTestExpression();

  const named = variables.filter((variable) => variable.trim() !== "");
  const missing = named.filter((variable) => (values[variable] ?? "").trim() === "");

  const run = () => {
    const parameters: Record<string, number> = {};
    for (const variable of named) parameters[variable] = Number(values[variable]);
    test.mutate({
      expression,
      parameters,
      constants: entriesToConstants(constants),
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-800">
        Probar la fórmula
      </h4>

      {named.length === 0 ? (
        <p className="text-sm text-gray-500">
          Declara alguna variable para poder probar.
        </p>
      ) : (
        <div className="flex flex-wrap items-end gap-3">
          {named.map((variable) => (
            <div key={variable}>
              <label className="mb-1 block font-mono text-xs text-gray-600">
                {variable}
              </label>
              <input
                value={values[variable] ?? ""}
                onChange={(event) =>
                  setValues({ ...values, [variable]: event.target.value })
                }
                inputMode="decimal"
                placeholder="0"
                className="h-9 w-24 rounded-md border border-gray-300 px-2 font-mono text-sm focus:border-rymel-blue focus:outline-none"
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={run}
            disabled={missing.length > 0 || expression.trim() === ""}
            isLoading={test.isPending}
          >
            <IconPlayerPlay className="mr-1 h-4 w-4" />
            Evaluar
          </Button>
        </div>
      )}

      {missing.length > 0 && named.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          Faltan valores para: {missing.join(", ")}
        </p>
      )}

      {test.data && (
        <div className="mt-3">
          {test.data.ok ? (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              Resultado:{" "}
              <span className="font-mono font-semibold">{test.data.result}</span>
            </p>
          ) : (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {test.data.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
