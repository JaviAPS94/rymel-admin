import { useState } from "react";
import { IconArrowDown, IconArrowUp, IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import {
  REQUIRED_KEYS,
  catalogHeader,
  customKeyFor,
  isCustomKey,
  missingCatalogColumns,
  scopeOf,
  validateColumns,
} from "./processColumns";
import { ProcessColumnScope, type ProcessColumn } from "@/types/phantom-item.types";

interface ProcessColumnsEditorProps {
  columns: ProcessColumn[];
  isSaving?: boolean;
  onSave: (columns: ProcessColumn[]) => void;
}

const SCOPE_LABEL: Record<ProcessColumnScope, string> = {
  [ProcessColumnScope.HEADER]: "Cabecera",
  [ProcessColumnScope.COMPONENT]: "Línea",
};

const nativeSelect =
  "rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rymel-blue";

/**
 * The columns of one process, in the order of its sheet. A catalog column can
 * be renamed (the header that process uses) but keeps its type; an own column
 * is text, of the header (one value per phantom item, like PLAN/MAYOR) or of
 * the line (one value per component). Nothing is saved until «Guardar».
 */
export const ProcessColumnsEditor = ({ columns, isSaving, onSave }: ProcessColumnsEditorProps) => {
  const [draft, setDraft] = useState<ProcessColumn[]>(columns);
  const [newHeader, setNewHeader] = useState("");
  const [newScope, setNewScope] = useState<ProcessColumnScope>(ProcessColumnScope.HEADER);
  const [catalogToAdd, setCatalogToAdd] = useState("");

  const problems = validateColumns(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(columns);
  const missing = missingCatalogColumns(draft);

  const update = (index: number, changes: Partial<ProcessColumn>) =>
    setDraft((prev) => prev.map((column, i) => (i === index ? { ...column, ...changes } : column)));

  const move = (index: number, delta: number) =>
    setDraft((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const remove = (index: number) => setDraft((prev) => prev.filter((_, i) => i !== index));

  const addOwn = () => {
    const header = newHeader.trim();
    if (!header) return;
    setDraft((prev) => [...prev, { key: customKeyFor(header), header, scope: newScope }]);
    setNewHeader("");
  };

  const addCatalog = () => {
    const column = missing.find((item) => item.field === catalogToAdd);
    if (!column) return;
    setDraft((prev) => [
      ...prev,
      {
        key: column.field,
        header: column.header,
        scope: column.scope === "component" ? ProcessColumnScope.COMPONENT : ProcessColumnScope.HEADER,
      },
    ]);
    setCatalogToAdd("");
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        «Fantasma» (la familia) va siempre primero y no se configura aquí. Renombrar una columna
        conserva sus datos; las del catálogo mantienen su tipo y sus reglas.
      </p>

      <div className="max-h-[45vh] overflow-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50">
            <tr>
              <th className="w-10 px-2 py-2 text-left font-semibold text-gray-600">#</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600">Encabezado</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600">Campo</th>
              <th className="px-2 py-2 text-left font-semibold text-gray-600">Alcance</th>
              <th className="w-28 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {draft.map((column, index) => {
              const own = isCustomKey(column.key);
              const required = REQUIRED_KEYS.includes(column.key);
              return (
                <tr key={column.key} className="border-t border-gray-100" data-column={column.key}>
                  <td className="px-2 py-1 text-gray-400">{index + 1}</td>
                  <td className="px-2 py-1">
                    <Input
                      aria-label={`Encabezado de ${column.key}`}
                      value={column.header}
                      onChange={(event) => update(index, { header: event.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1 text-gray-500">
                    {own ? <span className="italic">Propia</span> : catalogHeader(column.key)}
                  </td>
                  <td className="px-2 py-1">
                    {own ? (
                      <select
                        aria-label={`Alcance de ${column.header}`}
                        className={nativeSelect}
                        value={column.scope}
                        onChange={(event) =>
                          update(index, { scope: event.target.value as ProcessColumnScope })
                        }
                      >
                        <option value={ProcessColumnScope.HEADER}>{SCOPE_LABEL.HEADER}</option>
                        <option value={ProcessColumnScope.COMPONENT}>{SCOPE_LABEL.COMPONENT}</option>
                      </select>
                    ) : (
                      <span className="text-gray-500">{SCOPE_LABEL[scopeOf(column)]}</span>
                    )}
                  </td>
                  <td className="px-2 py-1">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        title="Subir"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      >
                        <IconArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Bajar"
                        onClick={() => move(index, 1)}
                        disabled={index === draft.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                      >
                        <IconArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title={required ? "Columna obligatoria" : `Quitar ${column.header}`}
                        aria-label={`Quitar ${column.header}`}
                        onClick={() => remove(index)}
                        disabled={required}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">Columna propia</label>
            <Input
              placeholder="Ej. PLAN1"
              value={newHeader}
              onChange={(event) => setNewHeader(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addOwn()}
            />
          </div>
          <select
            aria-label="Alcance de la columna nueva"
            className={nativeSelect}
            value={newScope}
            onChange={(event) => setNewScope(event.target.value as ProcessColumnScope)}
          >
            <option value={ProcessColumnScope.HEADER}>{SCOPE_LABEL.HEADER}</option>
            <option value={ProcessColumnScope.COMPONENT}>{SCOPE_LABEL.COMPONENT}</option>
          </select>
          <Button variant="outline" size="sm" onClick={addOwn} disabled={!newHeader.trim()}>
            <IconPlus className="h-4 w-4" />
          </Button>
        </div>

        {missing.length > 0 && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Columna del catálogo
              </label>
              <select
                aria-label="Columna del catálogo"
                className={`${nativeSelect} w-full`}
                value={catalogToAdd}
                onChange={(event) => setCatalogToAdd(event.target.value)}
              >
                <option value="">Elegir…</option>
                {missing.map((column) => (
                  <option key={column.field} value={column.field}>
                    {column.header}
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={addCatalog} disabled={!catalogToAdd}>
              <IconPlus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {problems.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setDraft(columns)} disabled={!dirty}>
          Descartar
        </Button>
        <Button
          variant="primary"
          onClick={() => onSave(draft.map((column) => ({ ...column, header: column.header.trim() })))}
          disabled={!dirty || problems.length > 0}
          isLoading={isSaving}
        >
          Guardar columnas
        </Button>
      </div>
    </div>
  );
};
