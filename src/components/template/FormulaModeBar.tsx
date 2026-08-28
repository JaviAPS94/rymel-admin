import { useState } from "react";
import {
  IconMathFunction,
  IconPlus,
  IconSelectAll,
  IconX,
} from "@tabler/icons-react";
import type { DesignFunctionOption } from "@hooks/useTemplateValidation";

interface Props {
  cursor: number;
  isPicking: boolean;
  rangeStart: string | null;
  activeRef: string;
  /** Fórmulas de diseño asignadas al subtipo: las mismas que ve el diseñador. */
  designFunctions: readonly DesignFunctionOption[];
  onTogglePicking: () => void;
  onToggleRange: () => void;
  onInsert: (text: string) => void;
  onExit: () => void;
}

/**
 * La barra del modo fórmula.
 *
 * Aparece sola en cuanto el contenido de la celda empieza por `=`, igual que
 * en el diseñador. Lo que ofrece es lo mismo: insertar la referencia de una
 * celda señalándola, formar un rango marcando sus dos extremos, y meter una
 * función del catálogo sin tener que recordar cómo se escribe.
 *
 * El cursor se muestra porque es donde va a caer lo que se inserte, y sin
 * verlo no se sabe dónde.
 */
export const FormulaModeBar = ({
  cursor,
  isPicking,
  rangeStart,
  activeRef,
  designFunctions,
  onTogglePicking,
  onToggleRange,
  onInsert,
  onExit,
}: Props) => {
  const [showFunctions, setShowFunctions] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
        <span className="font-medium text-rymel-blue">Modo fórmula</span>
        <span className="text-gray-500">Cursor: {cursor}</span>

        <button
          data-action="functions"
          onClick={() => setShowFunctions(true)}
          className="flex items-center gap-1 rounded bg-purple-600 px-3 py-1.5 text-white hover:bg-purple-700"
        >
          <IconMathFunction className="h-4 w-4" />
          Funciones
        </button>

        <button
          data-action="pick-cell"
          onClick={onTogglePicking}
          className={`flex items-center gap-1 rounded px-3 py-1.5 text-white ${
            isPicking ? "bg-blue-800" : "bg-rymel-blue hover:bg-blue-700"
          }`}
        >
          <IconPlus className="h-4 w-4" />
          {isPicking ? "Señala la celda…" : "Agregar celda"}
        </button>

        <button
          data-action="range"
          onClick={onToggleRange}
          className={`flex items-center gap-1 rounded px-3 py-1.5 text-white ${
            rangeStart ? "bg-gray-700" : "bg-gray-500 hover:bg-gray-600"
          }`}
        >
          <IconSelectAll className="h-4 w-4" />
          {rangeStart ? `Rango desde ${rangeStart}…` : "Rango"}
        </button>

        <button
          data-action="exit"
          onClick={onExit}
          className="flex items-center gap-1 rounded bg-red-500 px-3 py-1.5 text-white hover:bg-red-600"
        >
          <IconX className="h-4 w-4" />
          Salir
        </button>

        <span className="ml-auto text-xs text-gray-500">
          {rangeStart
            ? `Señala el otro extremo del rango`
            : isPicking
              ? `Señala la celda que quieres referenciar`
              : `Celda activa: ${activeRef}`}
        </span>
      </div>

      {showFunctions && (
        <FunctionPicker
          designFunctions={designFunctions}
          onPick={(call) => {
            onInsert(call);
            setShowFunctions(false);
          }}
          onClose={() => setShowFunctions(false)}
        />
      )}
    </>
  );
};

/**
 * Biblioteca de funciones.
 *
 * Solo las fórmulas de diseño del subtipo, que es lo que ofrece el diseñador.
 * Son las del negocio —las que nadie se sabe de memoria y las únicas que hace
 * falta buscar—, y su expresión está cifrada: aquí se ve para qué sirven y qué
 * variables piden, no cómo calculan.
 *
 * Se inserta con sus variables como marcadores, igual que en el diseñador:
 * `QUADRATIC(x)` en vez de `QUADRATIC(`, para que se vea qué hay que rellenar
 * y en qué orden — que es contrato, porque los argumentos van por posición.
 */
const FunctionPicker = ({
  designFunctions,
  onPick,
  onClose,
}: {
  designFunctions: readonly DesignFunctionOption[];
  onPick: (call: string) => void;
  onClose: () => void;
}) => {
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const matches = designFunctions.filter(
    (item) =>
      term === "" ||
      item.name.toLowerCase().includes(term) ||
      item.code.toLowerCase().includes(term) ||
      (item.description ?? "").toLowerCase().includes(term) ||
      item.variables.some((variable) => variable.toLowerCase().includes(term)),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            Biblioteca de funciones
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <input
          autoFocus
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, descripción o variables…"
          className="mt-3 h-9 w-full rounded border border-gray-300 px-2 text-sm"
        />

        <p className="mt-2 text-xs text-gray-600">
          {search
            ? `${matches.length} función(es) coinciden con «${search}»`
            : `${designFunctions.length} función(es) asignadas a este subtipo`}
        </p>

        <div className="mt-3 flex-1 overflow-y-auto">
          {matches.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {designFunctions.length === 0
                ? "Este subtipo de diseño no tiene fórmulas asignadas. Se asignan desde la sección Fórmulas."
                : `Ninguna función coincide con «${search}».`}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {matches.map((item) => (
                <div
                  key={item.id}
                  data-function={item.code}
                  className="flex flex-col rounded-lg border border-gray-200 p-3"
                >
                  <h4 className="font-semibold text-rymel-blue">{item.name}</h4>
                  {item.description && (
                    <p className="mt-1 flex-1 text-sm text-gray-600">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-700">
                    <strong>Variables:</strong>{" "}
                    <span className="font-mono text-rymel-blue">
                      {item.variables.join(", ") || "ninguna"}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-700">
                    <strong>Uso:</strong>{" "}
                    <code className="break-all rounded bg-gray-100 px-1">
                      ={item.code}({item.variables.join(", ")})
                    </code>
                  </p>
                  <button
                    onClick={() => onPick(`${item.code}(${item.variables.join(", ")})`)}
                    className="mt-3 w-full rounded bg-rymel-blue px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  >
                    Insertar función
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
