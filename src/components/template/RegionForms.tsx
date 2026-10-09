import { useState } from "react";
import { IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import type {
  ItemCatalogTable,
  NamedRange,
  SemiFinishedZone,
} from "@rymel/design-template";
import { semiFinishedService } from "@services/semiFinishedService";
import { newRegionId } from "./regions";

/**
 * Los formularios con los que se declara una región.
 *
 * Los usan el panel de regiones y el menú contextual. Son el mismo
 * formulario a propósito: dos formas de declarar una zona que pidieran datos
 * distintos acabarían produciendo zonas distintas.
 *
 * Con `initial` editan una región existente y conservan su `id`; sin él, la
 * crean sobre el rango que se les pasa.
 */

const splitTags = (text: string): string[] =>
  text
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");

interface FormProps<R> {
  startCell: string;
  endCell: string;
  initial?: R;
  submitLabel?: string;
  onSubmit: (region: R) => void;
}

const SubmitButton = ({ disabled, label }: { disabled: boolean; label: string }) => (
  <button
    type="submit"
    disabled={disabled}
    className="flex w-full items-center justify-center gap-1 rounded bg-rymel-blue px-2 py-1.5 text-sm text-white disabled:opacity-40"
  >
    <IconPlus className="h-4 w-4" />
    {label}
  </button>
);

const RangeLine = ({ startCell, endCell }: { startCell: string; endCell: string }) => (
  <p className="text-xs text-gray-500">
    Rango: <span className="font-mono">{startCell}:{endCell}</span>
  </p>
);

/** Rango con nombre: el destino al que lleva la navegación `goTo`. */
export const NamedRangeForm = ({
  startCell,
  endCell,
  initial,
  submitLabel = "Declarar sobre la selección",
  onSubmit,
}: FormProps<NamedRange>) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const start = initial?.startCell ?? startCell;
  const end = initial?.endCell ?? endCell;

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          id: initial?.id ?? newRegionId("nr"),
          name: name.trim(),
          tags: splitTags(tags),
          startCell: start,
          endCell: end,
        });
        setName("");
        setTags("");
      }}
    >
      <RangeLine startCell={start} endCell={end} />
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre del rango"
        aria-label="Nombre del rango"
        className="h-8 w-full rounded border border-gray-300 px-2 text-sm"
      />
      <input
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        placeholder="Etiquetas separadas por coma (aluminio, cobre)"
        aria-label="Etiquetas"
        className="h-8 w-full rounded border border-gray-300 px-2 text-sm"
      />
      <p className="text-xs text-gray-500">
        Las etiquetas se comparan con el valor de las celdas de condición de
        una celda con navegación.
      </p>
      <SubmitButton disabled={name.trim() === ""} label={submitLabel} />
    </form>
  );
};

/** Zona de semielaborado, contra el catálogo que este mismo repositorio administra. */
export const SemiFinishedZoneForm = ({
  startCell,
  endCell,
  initial,
  submitLabel = "Declarar sobre la selección",
  onSubmit,
}: FormProps<SemiFinishedZone>) => {
  const semiFinished = useQuery({
    queryKey: ["semi-finished"],
    queryFn: () => semiFinishedService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
  const [selected, setSelected] = useState<number | "">(initial?.semiFinishedId ?? "");
  const start = initial?.startCell ?? startCell;
  const end = initial?.endCell ?? endCell;

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const item = (semiFinished.data ?? []).find((candidate) => candidate.id === selected);
        if (!item) return;
        onSubmit({
          id: initial?.id ?? newRegionId("sf"),
          semiFinishedId: item.id,
          semiFinishedCode: item.code,
          semiFinishedName: item.name,
          startCell: start,
          endCell: end,
        });
        setSelected("");
      }}
    >
      <RangeLine startCell={start} endCell={end} />
      <select
        value={selected}
        onChange={(event) =>
          setSelected(event.target.value === "" ? "" : Number(event.target.value))
        }
        aria-label="Semielaborado"
        className="h-8 w-full rounded border border-gray-300 px-2 text-sm"
      >
        <option value="">Elegir semielaborado…</option>
        {(semiFinished.data ?? []).map((item) => (
          <option key={item.id} value={item.id}>
            {item.code} · {item.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500">
        Una celda pertenece como mucho a una zona: si se solapan, el BOM no
        puede decidir a cuál atribuir su consumo.
      </p>
      <SubmitButton disabled={selected === ""} label={submitLabel} />
    </form>
  );
};

/** Tabla de catálogo: cada fila tras los encabezados es un ítem. */
export const CatalogTableForm = ({
  startCell,
  endCell,
  initial,
  submitLabel = "Declarar sobre la selección",
  onSubmit,
}: FormProps<ItemCatalogTable>) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [headerRows, setHeaderRows] = useState(initial?.headerRows ?? 1);
  const [offsets, setOffsets] = useState({
    id: initial?.idColumnOffset ?? 0,
    description: initial?.descriptionColumnOffset ?? 1,
    um: initial?.umColumnOffset ?? 2,
  });
  const start = initial?.startCell ?? startCell;
  const end = initial?.endCell ?? endCell;

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const parsedTags = splitTags(tags);
        onSubmit({
          id: initial?.id ?? newRegionId("ct"),
          name: name.trim(),
          ...(parsedTags.length > 0 ? { tags: parsedTags } : {}),
          startCell: start,
          endCell: end,
          headerRows,
          idColumnOffset: offsets.id,
          descriptionColumnOffset: offsets.description,
          umColumnOffset: offsets.um,
        });
        setName("");
        setTags("");
      }}
    >
      <RangeLine startCell={start} endCell={end} />
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre de la tabla"
        aria-label="Nombre de la tabla"
        className="h-8 w-full rounded border border-gray-300 px-2 text-sm"
      />
      <input
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        placeholder="Etiquetas separadas por coma (aluminio, rectangular)"
        aria-label="Etiquetas del catálogo"
        className="h-8 w-full rounded border border-gray-300 px-2 text-sm"
      />
      <p className="text-xs text-gray-500">
        Las etiquetas deciden a qué celdas se ofrece la tabla: se comparan con
        el valor de sus celdas de condición.
      </p>
      <label className="flex items-center justify-between text-xs text-gray-600">
        Filas de encabezado
        <input
          type="number"
          min={0}
          value={headerRows}
          onChange={(event) => setHeaderRows(Number(event.target.value))}
          className="h-7 w-16 rounded border border-gray-300 px-1 text-sm"
        />
      </label>

      {(
        [
          ["id", "Identificador"],
          ["description", "Descripción"],
          ["um", "Unidad de medida"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="flex items-center justify-between text-xs text-gray-600">
          {label} (columna desde el inicio)
          <input
            type="number"
            min={0}
            value={offsets[key]}
            onChange={(event) => setOffsets({ ...offsets, [key]: Number(event.target.value) })}
            className="h-7 w-16 rounded border border-gray-300 px-1 text-sm"
          />
        </label>
      ))}

      <SubmitButton disabled={name.trim() === ""} label={submitLabel} />
    </form>
  );
};
