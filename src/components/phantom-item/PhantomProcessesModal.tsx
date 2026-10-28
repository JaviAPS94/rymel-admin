import { useState } from "react";
import { IconArrowDown, IconArrowUp, IconCheck, IconPlus, IconTrash } from "@tabler/icons-react";
import { Modal } from "@components/ui/Modal";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { cn } from "@utils/cn";
import { ProcessColumnsEditor } from "./ProcessColumnsEditor";
import {
  useCreatePhantomProcess,
  useRemovePhantomProcess,
  useRenamePhantomFamily,
  useRenamePhantomProcess,
  useReorderPhantomProcesses,
  useSetPhantomProcessColumns,
  useSetReferenceSeparator,
} from "@hooks/usePhantomProcesses";
import type { PhantomFamily, PhantomProcess } from "@/types/phantom-item.types";

interface PhantomProcessesModalProps {
  processes: PhantomProcess[];
  onClose: () => void;
}

type Section = "columns" | "families";

/** A name that saves on Enter or with its button, only when it changed */
const RenameField = ({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (name: string) => void;
}) => {
  const [name, setName] = useState(value);
  const changed = name.trim() !== "" && name.trim() !== value;
  return (
    <div className="flex items-center gap-2">
      <Input
        aria-label={label}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && changed && onSave(name.trim())}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSave(name.trim())}
        disabled={!changed}
        aria-label={`Guardar ${label}`}
      >
        <IconCheck className="h-4 w-4" />
      </Button>
    </div>
  );
};

/**
 * The plant processes, like the sheets of the workbook: their order, their
 * names, their columns and their families. A process can only be removed when
 * it has no phantom items.
 */
export const PhantomProcessesModal = ({ processes, onClose }: PhantomProcessesModalProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(processes[0]?.id ?? null);
  const [section, setSection] = useState<Section>("columns");
  const [newName, setNewName] = useState("");

  const createProcess = useCreatePhantomProcess();
  const renameProcess = useRenamePhantomProcess();
  const reorder = useReorderPhantomProcesses();
  const removeProcess = useRemovePhantomProcess();
  const setColumns = useSetPhantomProcessColumns();
  const renameFamily = useRenamePhantomFamily();
  const setReferenceSeparator = useSetReferenceSeparator();

  const selected = processes.find((process) => process.id === selectedId) ?? processes[0] ?? null;

  const move = (index: number, delta: number) => {
    const ids = processes.map((process) => process.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate(ids);
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return;
    const created = await createProcess.mutateAsync(name).catch(() => null);
    if (created) {
      setNewName("");
      setSelectedId((created as PhantomProcess).id);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Procesos" maxWidth="5xl">
      <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
        <div className="space-y-3">
          <ul className="max-h-[55vh] space-y-1 overflow-auto" aria-label="Lista de procesos">
            {processes.map((process, index) => (
              <li
                key={process.id}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1.5",
                  process.id === selected?.id ? "bg-rymel-blue/10" : "hover:bg-gray-50",
                )}
              >
                <button
                  type="button"
                  className="flex-1 truncate text-left text-sm"
                  onClick={() => setSelectedId(process.id)}
                >
                  {process.name}
                  <span className="ml-1 text-xs text-gray-400">({process.phantomItemsCount})</span>
                </button>
                <button
                  type="button"
                  title="Subir"
                  aria-label={`Subir ${process.name}`}
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || reorder.isPending}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                >
                  <IconArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Bajar"
                  aria-label={`Bajar ${process.name}`}
                  onClick={() => move(index, 1)}
                  disabled={index === processes.length - 1 || reorder.isPending}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                >
                  <IconArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title={
                    process.phantomItemsCount > 0
                      ? "Tiene fantasmas: muévelos o elimínalos antes"
                      : `Eliminar ${process.name}`
                  }
                  aria-label={`Eliminar ${process.name}`}
                  onClick={() => {
                    if (window.confirm(`¿Eliminar el proceso «${process.name}»?`)) {
                      removeProcess.mutate(process.id);
                    }
                  }}
                  disabled={process.phantomItemsCount > 0}
                  className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Nuevo proceso"
              aria-label="Nombre del proceso nuevo"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && create()}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={create}
              disabled={!newName.trim()}
              isLoading={createProcess.isPending}
              aria-label="Crear proceso"
            >
              <IconPlus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Un proceso nuevo empieza con las columnas del catálogo. También se crea al importar un
            libro con una hoja que no existe.
          </p>
        </div>

        {selected && (
          <div className="min-w-0 space-y-4">
            <RenameField
              key={`process-${selected.id}-${selected.name}`}
              label="Nombre del proceso"
              value={selected.name}
              onSave={(name) => renameProcess.mutate({ id: selected.id, name })}
            />

            <div>
              <label
                htmlFor="reference-separator"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Referencia: entre «Raiz Fantasma» y «R kVA + Norma / Otros»
              </label>
              <select
                id="reference-separator"
                className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rymel-blue"
                value={selected.referenceSeparator}
                disabled={setReferenceSeparator.isPending}
                onChange={(event) =>
                  setReferenceSeparator.mutate({
                    id: selected.id,
                    referenceSeparator: event.target.value,
                  })
                }
              >
                <option value="">Nada (el kVA trae su guion o espacio)</option>
                <option value=" ">Un espacio</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Se aplica al guardar o importar cada fantasma; las referencias ya guardadas no se
                reescriben.
              </p>
            </div>

            <div role="tablist" className="flex gap-1 border-b border-gray-200">
              {(
                [
                  ["columns", `Columnas (${selected.columns.length})`],
                  ["families", `Familias (${selected.families.length})`],
                ] as [Section, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={section === value}
                  onClick={() => setSection(value)}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-1.5 text-sm",
                    section === value
                      ? "border-rymel-blue text-rymel-blue"
                      : "border-transparent text-gray-500 hover:text-gray-800",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {section === "columns" ? (
              <ProcessColumnsEditor
                // A new draft when switching process or after the server answers
                key={`columns-${selected.id}-${JSON.stringify(selected.columns)}`}
                columns={selected.columns}
                isSaving={setColumns.isPending}
                onSave={(columns) => setColumns.mutate({ id: selected.id, columns })}
              />
            ) : (
              <FamiliesList
                families={selected.families}
                onRename={(id, name) => renameFamily.mutate({ id, name })}
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

const FamiliesList = ({
  families,
  onRename,
}: {
  families: PhantomFamily[];
  onRename: (id: number, name: string) => void;
}) => {
  if (families.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Sin familias. Se crean al escribir una en un fantasma o al importar la columna «Fantasma».
      </p>
    );
  }
  return (
    <ul className="max-h-[45vh] space-y-2 overflow-auto">
      {families.map((family) => (
        <li key={family.id} className="flex items-center gap-3">
          <div className="flex-1">
            <RenameField
              key={`family-${family.id}-${family.name}`}
              label={`Familia ${family.name}`}
              value={family.name}
              onSave={(name) => onRename(family.id, name)}
            />
          </div>
          <span className="w-24 text-right text-xs text-gray-500">
            {family.phantomItemsCount} fantasma{family.phantomItemsCount === 1 ? "" : "s"}
          </span>
        </li>
      ))}
    </ul>
  );
};
