import { useState } from "react";
import type {
  MaterialTag,
  TemplateCell,
  TemplateDocument,
} from "@rymel/design-template";
import type { ElementField } from "@/types/template.types";
import { RefListForm } from "./CellDialogs";
import { ItemPickerModal } from "./ItemPickerModal";
import { catalogTables, type ValueOf } from "./catalog";

interface Props {
  sheetName: string;
  activeRef: string;
  cell: TemplateCell | undefined;
  document: TemplateDocument;
  elementFields: ElementField[];
  valueOf: ValueOf;
  onUpdate: (patch: Partial<TemplateCell>) => void;
  onSetMaterialTag: (tag: MaterialTag | null) => void;
}

/**
 * Lo que una celda declara además de su contenido.
 *
 * Son las piezas que hacen que una plantilla sea algo más que una hoja: el
 * dato del elemento con el que se rellena, la lista desplegable que ofrece, la
 * navegación a un rango con nombre y el ítem de catálogo al que se enlaza —que
 * es lo que acaba alimentando el BOM—.
 */
export const CellBindingsPanel = ({
  sheetName,
  activeRef,
  cell,
  document,
  elementFields,
  valueOf,
  onUpdate,
  onSetMaterialTag,
}: Props) => {
  const [optionsDraft, setOptionsDraft] = useState("");
  const [conditionDraft, setConditionDraft] = useState("");
  const [picking, setPicking] = useState(false);

  const sheet = document.sheets.find((item) => item.name === sheetName);
  const linkedTable = cell?.itemLink
    ? catalogTables(document).find(({ table }) => table.id === cell.itemLink!.catalogTableId)
    : undefined;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 text-sm">
      <p className="font-mono text-xs text-gray-500">
        {sheetName}!{activeRef}
      </p>

      {/* Dato del elemento */}
      <label className="block">
        <span className="text-xs font-medium text-gray-700">
          Se rellena con un dato del elemento
        </span>
        <select
          value={cell?.elementKey ?? ""}
          onChange={(event) =>
            onUpdate({ elementKey: event.target.value || undefined })
          }
          className="mt-1 h-8 w-full rounded border border-gray-300 px-2 text-sm"
        >
          <option value="">No enlazada</option>
          {elementFields.map((field) => (
            <option key={field.key} value={field.key}>
              {field.label} ({field.key})
            </option>
          ))}
        </select>
        {cell?.elementKey && (
          <span className="mt-1 block text-xs text-purple-700">
            Su contenido es provisional: al cargar la plantilla, el diseñador lo
            sustituye por el valor del elemento.
          </span>
        )}
      </label>

      {/* Lista desplegable */}
      <div>
        <span className="text-xs font-medium text-gray-700">
          Lista desplegable
        </span>
        {cell?.options && cell.options.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {cell.options.map((option) => (
              <span
                key={option}
                className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                {option}
              </span>
            ))}
            <button
              onClick={() => onUpdate({ options: undefined })}
              className="text-xs text-red-600 hover:underline"
            >
              quitar
            </button>
          </div>
        ) : (
          <div className="mt-1 flex gap-1">
            <input
              value={optionsDraft}
              onChange={(event) => setOptionsDraft(event.target.value)}
              placeholder="Aluminio, Cobre"
              className="h-8 flex-1 rounded border border-gray-300 px-2 text-sm"
            />
            <button
              onClick={() => {
                const options = optionsDraft
                  .split(",")
                  .map((option) => option.trim())
                  .filter((option) => option !== "");
                if (options.length > 0) onUpdate({ options });
                setOptionsDraft("");
              }}
              className="rounded bg-gray-100 px-2 text-xs hover:bg-gray-200"
            >
              Poner
            </button>
          </div>
        )}
      </div>

      {/* Nota */}
      <label className="block">
        <span className="text-xs font-medium text-gray-700">Nota</span>
        <input
          value={cell?.note ?? ""}
          onChange={(event) => onUpdate({ note: event.target.value || undefined })}
          placeholder="Explicación para quien use la plantilla"
          className="mt-1 h-8 w-full rounded border border-gray-300 px-2 text-sm"
        />
      </label>

      {/* Navegación goTo */}
      <div>
        <span className="text-xs font-medium text-gray-700">
          Navegación a un rango con nombre
        </span>
        <p className="text-xs text-gray-500">
          El destino se elige comparando el valor de estas celdas con las
          etiquetas de los rangos.
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {(cell?.goTo?.conditionCells ?? []).map((condition) => (
            <span
              key={condition}
              className="flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-800"
            >
              {condition}
              <button
                onClick={() => {
                  const remaining = (cell?.goTo?.conditionCells ?? []).filter(
                    (item) => item !== condition,
                  );
                  onUpdate({
                    goTo:
                      remaining.length > 0
                        ? { conditionCells: remaining }
                        : undefined,
                  });
                }}
                className="text-blue-500 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-1 flex gap-1">
          <input
            value={conditionDraft}
            onChange={(event) => setConditionDraft(event.target.value.toUpperCase())}
            placeholder="I23"
            className="h-8 flex-1 rounded border border-gray-300 px-2 font-mono text-sm"
          />
          <button
            onClick={() => {
              const condition = conditionDraft.trim();
              if (condition === "") return;
              onUpdate({
                goTo: {
                  conditionCells: [
                    ...(cell?.goTo?.conditionCells ?? []),
                    condition,
                  ],
                },
              });
              setConditionDraft("");
            }}
            className="rounded bg-gray-100 px-2 text-xs hover:bg-gray-200"
          >
            Añadir
          </button>
        </div>
      </div>

      {/* Etiqueta de material */}
      <label className="block">
        <span className="text-xs font-medium text-gray-700">
          Segmento del código de diseño
        </span>
        <select
          value={cell?.materialTag ?? ""}
          onChange={(event) =>
            onSetMaterialTag((event.target.value || null) as MaterialTag | null)
          }
          className="mt-1 h-8 w-full rounded border border-gray-300 px-2 text-sm"
        >
          <option value="">Ninguno</option>
          <option value="MO">Material del Núcleo (MO)</option>
          <option value="MD">Material de Devanado (MD)</option>
        </select>
        <span className="mt-1 block text-xs text-gray-500">
          Solo una celda de la plantilla puede ser MO y solo una MD: elegirla
          aquí la quita de la que la tuviera.
        </span>
      </label>

      {/* Condiciones del vínculo al catálogo */}
      <div>
        <span className="text-xs font-medium text-gray-700">
          Vínculo al catálogo: celdas de condición
        </span>
        <RefListForm
          key={`${sheetName}!${activeRef}`}
          initial={cell?.catalogConditionCells ?? []}
          help="Sus valores se comparan con las etiquetas de las tablas de catálogo para decidir a cuál se enruta la celda."
          onSubmit={(refs) =>
            onUpdate({ catalogConditionCells: refs.length > 0 ? refs : undefined })
          }
        />
      </div>

      {/* Enlace a un ítem del catálogo */}
      <div>
        <span className="text-xs font-medium text-gray-700">
          Ítem del catálogo
        </span>
        {cell?.itemLink ? (
          <div className="mt-1 flex items-center justify-between rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-900">
            <span>
              <span className="font-mono">{cell.itemLink.itemId || "(sin ítem)"}</span>
              {linkedTable ? ` · ${linkedTable.table.name}` : " · tabla inexistente"}
            </span>
            <button
              onClick={() => onUpdate({ itemLink: undefined })}
              className="text-red-600 hover:underline"
            >
              quitar
            </button>
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray-500">Sin vincular.</p>
        )}
        <button
          onClick={() => setPicking(true)}
          className="mt-1 w-full rounded bg-gray-100 px-2 py-1.5 text-xs hover:bg-gray-200"
        >
          {cell?.itemLink ? "Cambiar ítem…" : "Elegir ítem…"}
        </button>
        {picking && sheet && (
          <ItemPickerModal
            document={document}
            sheetName={sheetName}
            cellRef={activeRef}
            conditionCells={cell?.catalogConditionCells ?? []}
            valueOf={valueOf}
            elementKeyOf={(ref) => sheet.cells[ref]?.elementKey}
            current={cell?.itemLink}
            onPick={(link) => {
              onUpdate({ itemLink: link });
              setPicking(false);
            }}
            onClose={() => setPicking(false)}
          />
        )}
      </div>
    </div>
  );
};
