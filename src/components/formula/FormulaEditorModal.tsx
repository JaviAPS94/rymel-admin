import { useMemo, useState } from "react";
import { IconAlertTriangle, IconLock } from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { subTypeLabel } from "@services/designFunctionService";
import { Modal } from "@components/ui/Modal";
import { FormulaVariablesEditor } from "@components/formula/FormulaVariablesEditor";
import { FormulaConstantsEditor } from "@components/formula/FormulaConstantsEditor";
import { FormulaTester } from "@components/formula/FormulaTester";
import {
  useCreateDesignFunction,
  useDesignFunctionDetail,
  useDesignFunctionImpact,
  useDesignSubTypes,
  usePublishVersion,
  useSetSubTypes,
  useUpdateDesignFunction,
} from "@hooks/useDesignFunctions";
import {
  constantsToEntries,
  DesignFunctionType,
  entriesToConstants,
  type ConstantEntry,
} from "@/types/designFunction.types";

interface FormulaEditorModalProps {
  isOpen: boolean;
  /** `null` para crear una fórmula nueva. */
  functionId: number | null;
  onClose: () => void;
}

const errorMessageOf = (error: unknown): string => {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return "No se pudo guardar";
};

/**
 * Valores con los que arranca el formulario.
 *
 * Se pasan como props y el formulario los usa para inicializar su estado una
 * sola vez, al montarse. La alternativa —sincronizarlos desde un efecto—
 * parece equivalente pero no lo es: si la consulta se refresca mientras
 * alguien está escribiendo, el efecto le pisaría lo escrito.
 */
interface InitialValues {
  name: string;
  code: string;
  description: string;
  type: DesignFunctionType;
  expression: string;
  variables: string[];
  constants: ConstantEntry[];
  subTypeIds: number[];
}

const NEW_FORMULA: InitialValues = {
  name: "",
  code: "",
  description: "",
  type: DesignFunctionType.DESIGN,
  expression: "y = ",
  variables: ["x"],
  constants: [],
  subTypeIds: [],
};

export const FormulaEditorModal = ({
  isOpen,
  functionId,
  onClose,
}: FormulaEditorModalProps) => {
  const isNew = functionId === null;
  const detail = useDesignFunctionDetail(isOpen && !isNew ? functionId : null);

  const initial: InitialValues | null = isNew
    ? NEW_FORMULA
    : detail.data
      ? {
          name: detail.data.name,
          code: detail.data.code,
          description: detail.data.description ?? "",
          type: detail.data.type,
          expression: detail.data.expression ?? "",
          variables: detail.data.variables
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          constants: constantsToEntries(detail.data.constants),
          subTypeIds: detail.data.designSubTypeIds,
        }
      : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isNew ? "Nueva fórmula" : "Editar fórmula"}
      maxWidth="xl"
    >
      {initial === null ? (
        <div className="p-6">
          <p className="text-sm text-gray-500">
            {detail.isError ? "No se pudo cargar la fórmula." : "Cargando…"}
          </p>
        </div>
      ) : (
        <FormulaForm
          // Remontar al cambiar de fórmula: cada una arranca con su estado.
          key={functionId ?? "nueva"}
          functionId={functionId}
          initial={initial}
          expressionUnavailable={detail.data?.expressionUnavailable}
          onClose={onClose}
        />
      )}
    </Modal>
  );
};

interface FormulaFormProps {
  functionId: number | null;
  initial: InitialValues;
  expressionUnavailable?: string;
  onClose: () => void;
}

const FormulaForm = ({
  functionId,
  initial,
  expressionUnavailable,
  onClose,
}: FormulaFormProps) => {
  const isNew = functionId === null;
  const impact = useDesignFunctionImpact(isNew ? null : functionId);
  const subTypes = useDesignSubTypes();

  const create = useCreateDesignFunction();
  const update = useUpdateDesignFunction();
  const publish = usePublishVersion();
  const setSubTypes = useSetSubTypes();

  const [name, setName] = useState(initial.name);
  const [code, setCode] = useState(initial.code);
  const [description, setDescription] = useState(initial.description);
  const [type, setType] = useState<DesignFunctionType>(initial.type);
  const [expression, setExpression] = useState(initial.expression);
  const [variables, setVariables] = useState<string[]>(initial.variables);
  const [constants, setConstants] = useState<ConstantEntry[]>(
    initial.constants
  );
  const [selectedSubTypes, setSelectedSubTypes] = useState<number[]>(
    initial.subTypeIds
  );
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string[] | null>(null);

  /** Orden con el que se publicó la versión vigente. */
  const originalVariables = initial.variables;

  const canEditExpression = isNew || expressionUnavailable === undefined;

  /**
   * Contraste local de símbolos.
   *
   * El servidor tiene la última palabra —solo él puede analizar la expresión
   * con el motor real— pero adelantar aquí lo evidente evita un viaje de ida
   * y vuelta para descubrir que falta declarar una letra.
   */
  const undeclared = useMemo(() => {
    if (!canEditExpression || expression.trim() === "") return [];
    const rightSide = expression.split("=").slice(1).join("=");
    const symbols = rightSide.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
    const declared = new Set([
      ...variables.map((item) => item.trim()),
      ...constants.map((item) => item.name.trim()),
    ]);
    const builtins = new Set([
      "sin", "cos", "tan", "log", "ln", "sqrt", "abs", "exp", "pow",
      "pi", "e", "min", "max", "round", "floor", "ceil",
    ]);
    return [
      ...new Set(
        symbols.filter(
          (symbol) => !declared.has(symbol) && !builtins.has(symbol)
        )
      ),
    ];
  }, [expression, variables, constants, canEditExpression]);

  const submit = (acceptWarnings = false) => {
    setError(null);

    if (isNew) {
      create.mutate(
        {
          name,
          code,
          description,
          type,
          expression,
          variables: variables.filter(Boolean).join(","),
          constants: entriesToConstants(constants),
        },
        {
          onSuccess: () => onClose(),
          onError: (err) => setError(errorMessageOf(err)),
        }
      );
      return;
    }

    const id = functionId as number;

    update.mutate(
      { id, data: { name, code, description, type } },
      {
        onError: (err) => setError(errorMessageOf(err)),
        onSuccess: () => {
          setSubTypes.mutate({ id, subTypeIds: selectedSubTypes });

          if (!canEditExpression) {
            onClose();
            return;
          }

          publish.mutate(
            {
              id,
              data: {
                expression,
                variables: variables.filter(Boolean).join(","),
                constants: entriesToConstants(constants),
                acceptWarnings,
              },
            },
            {
              onSuccess: () => onClose(),
              onError: (err) => {
                const message = errorMessageOf(err);
                // El servidor bloquea los cambios que alteran el significado
                // de las hojas ya guardadas hasta que se confirmen. Se
                // convierte en un diálogo en vez de un error seco.
                if (message.includes("requiere confirmación")) {
                  setConfirming(
                    message
                      .replace(/^.*requiere confirmación:\s*/, "")
                      .split("; ")
                  );
                } else {
                  setError(message);
                }
              },
            }
          );
        },
      }
    );
  };

  const saving =
    create.isPending || update.isPending || publish.isPending;

  const constantsValid = constants.every(
    (constant) =>
      constant.name.trim() === "" ||
      (/^[A-Z][A-Z0-9_]*$/.test(constant.name) &&
        Number.isFinite(Number(constant.value)))
  );

  const canSave =
    name.trim() !== "" &&
    code.trim() !== "" &&
    constantsValid &&
    (!canEditExpression ||
      (expression.trim() !== "" &&
        variables.some((item) => item.trim() !== "") &&
        undeclared.length === 0));

  return (
    <>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-rymel-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Código de invocación
            </label>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="CUBIC"
              className="h-10 w-full rounded-md border border-gray-300 px-3 font-mono text-sm focus:border-rymel-blue focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tipo
            </label>
            <select
              value={type}
              onChange={(event) =>
                setType(event.target.value as DesignFunctionType)
              }
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-rymel-blue focus:outline-none"
            >
              <option value={DesignFunctionType.DESIGN}>Diseño</option>
              <option value={DesignFunctionType.COST}>Costo</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-rymel-blue focus:outline-none"
            />
          </div>
        </div>

        {/* Expresión */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Expresión
            </label>
            <span className="inline-flex items-center gap-1 text-xs text-amber-700">
              <IconLock className="h-3.5 w-3.5" />
              Confidencial · cada consulta queda registrada
            </span>
          </div>

          {expressionUnavailable ? (
            <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-medium">
                La expresión no está disponible en este momento.
              </p>
              <p className="mt-1">{expressionUnavailable}</p>
              <p className="mt-2">
                Puedes editar el resto de los campos; la expresión no se
                modificará.
              </p>
            </div>
          ) : (
            <>
              <textarea
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                rows={2}
                spellCheck={false}
                placeholder="y = x^2 + CONST_1"
                className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-rymel-blue focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Debe tener la forma <code className="font-mono">y = …</code>
              </p>
              {undeclared.length > 0 && (
                <p className="mt-1 text-sm text-red-600">
                  Símbolos sin declarar: {undeclared.join(", ")}. Agrégalos como
                  variable o constante.
                </p>
              )}
            </>
          )}
        </div>

        <FormulaVariablesEditor
          variables={variables}
          onChange={setVariables}
          originalOrder={originalVariables}
          disabled={!canEditExpression}
        />

        <FormulaConstantsEditor
          constants={constants}
          onChange={setConstants}
          disabled={!canEditExpression}
        />

        {canEditExpression && (
          <FormulaTester
            expression={expression}
            variables={variables}
            constants={constants}
          />
        )}

        {/* Asignación a subtipos */}
        {!isNew && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Subtipos de diseño asignados
            </label>
            <div className="flex flex-wrap gap-2">
              {(subTypes.data ?? []).map((subType) => {
                const selected = selectedSubTypes.includes(subType.id);
                return (
                  <button
                    key={subType.id}
                    type="button"
                    onClick={() =>
                      setSelectedSubTypes(
                        selected
                          ? selectedSubTypes.filter((id) => id !== subType.id)
                          : [...selectedSubTypes, subType.id]
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      selected
                        ? "border-rymel-blue bg-rymel-blue text-white"
                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {subTypeLabel(subType)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {impact.data && impact.data.subDesignCount > 0 && (
          <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
            Esta fórmula la usan <strong>{impact.data.subDesignCount}</strong>{" "}
            sub-diseño(s) en <strong>{impact.data.designCount}</strong>{" "}
            diseño(s). Publicar una versión nueva no cambiará sus valores, pero
            los marcará como desactualizados.
          </p>
        )}

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 border-t p-4">
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button onClick={() => submit(false)} disabled={!canSave} isLoading={saving}>
          {isNew ? "Crear" : "Guardar"}
        </Button>
      </div>

      {/* Confirmación de cambio incompatible */}
      {confirming && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 text-amber-700">
              <IconAlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-bold">
                Este cambio afecta a las hojas ya guardadas
              </h3>
            </div>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {confirming.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
            {impact.data && (
              <p className="mb-4 text-sm text-gray-600">
                Afecta a {impact.data.subDesignCount} sub-diseño(s) en{" "}
                {impact.data.designCount} diseño(s).
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirming(null)}>
                Revisar
              </Button>
              <Button
                onClick={() => {
                  setConfirming(null);
                  submit(true);
                }}
              >
                Publicar de todos modos
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
