import { useState } from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type {
  ItemCatalogTable,
  NamedRange,
  SemiFinishedZone,
  SheetStyles,
} from "@rymel/design-template";
import { useQuery } from "@tanstack/react-query";
import { semiFinishedService } from "@services/semiFinishedService";
import type { Rect } from "@hooks/useGridSelection";
import { refOf } from "@hooks/useGridSelection";

interface Props {
  styles: SheetStyles;
  rect: Rect;
  onSetStyles: (styles: SheetStyles) => void;
  /** Lleva la selección a la región, para verla en la rejilla. */
  onGoToRegion: (startCell: string, endCell: string) => void;
}

const newId = (prefix: string): string => `${prefix}-${Date.now()}`;

/**
 * Las tres regiones que una hoja puede declarar.
 *
 * Van en un panel y no en tres modales porque se definen sobre la selección:
 * se marca el rango en la rejilla y se declara aquí sin perderlo de vista. Las
 * tres comparten esa forma de trabajo, así que compartir el panel es lo
 * natural.
 */
export const RegionsPanel = ({
  styles,
  rect,
  onSetStyles,
  onGoToRegion,
}: Props) => {
  const [tab, setTab] = useState<"ranges" | "zones" | "catalogs">("ranges");

  const startCell = refOf(rect.top, rect.left);
  const endCell = refOf(rect.bottom, rect.right);

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white">
      <div className="flex border-b border-gray-200 text-sm">
        {(
          [
            ["ranges", `Rangos (${styles.namedRanges.length})`],
            ["zones", `Semielaborados (${styles.semiFinishedZones.length})`],
            ["catalogs", `Catálogos (${styles.itemCatalogTables.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 px-2 py-2 ${
              tab === id
                ? "border-b-2 border-rymel-blue font-medium text-rymel-blue"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <p className="mb-3 rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
          Selección actual:{" "}
          <span className="font-mono">
            {startCell}:{endCell}
          </span>
        </p>

        {tab === "ranges" && (
          <NamedRangesTab
            ranges={styles.namedRanges}
            startCell={startCell}
            endCell={endCell}
            onGoToRegion={onGoToRegion}
            onChange={(namedRanges) => onSetStyles({ ...styles, namedRanges })}
          />
        )}

        {tab === "zones" && (
          <ZonesTab
            zones={styles.semiFinishedZones}
            startCell={startCell}
            endCell={endCell}
            onGoToRegion={onGoToRegion}
            onChange={(semiFinishedZones) =>
              onSetStyles({ ...styles, semiFinishedZones })
            }
          />
        )}

        {tab === "catalogs" && (
          <CatalogsTab
            tables={styles.itemCatalogTables}
            startCell={startCell}
            endCell={endCell}
            onGoToRegion={onGoToRegion}
            onChange={(itemCatalogTables) =>
              onSetStyles({ ...styles, itemCatalogTables })
            }
          />
        )}
      </div>
    </div>
  );
};

/** Rangos con nombre: el destino al que lleva la navegación `goTo`. */
const NamedRangesTab = ({
  ranges,
  startCell,
  endCell,
  onChange,
  onGoToRegion,
}: {
  ranges: NamedRange[];
  startCell: string;
  endCell: string;
  onChange: (ranges: NamedRange[]) => void;
  onGoToRegion: (start: string, end: string) => void;
}) => {
  const [name, setName] = useState("");
  const [tags, setTags] = useState("");

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-md bg-gray-50 p-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre del rango"
          className="h-8 w-full rounded border border-gray-300 px-2 text-sm"
        />
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="Etiquetas separadas por coma (aluminio, cobre)"
          className="h-8 w-full rounded border border-gray-300 px-2 text-sm"
        />
        <p className="text-xs text-gray-500">
          Las etiquetas se comparan con el valor de las celdas de condición de
          una celda con navegación.
        </p>
        <button
          disabled={name.trim() === ""}
          onClick={() => {
            onChange([
              ...ranges,
              {
                id: newId("nr"),
                name: name.trim(),
                tags: tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter((tag) => tag !== ""),
                startCell,
                endCell,
              },
            ]);
            setName("");
            setTags("");
          }}
          className="flex w-full items-center justify-center gap-1 rounded bg-rymel-blue px-2 py-1.5 text-sm text-white disabled:opacity-40"
        >
          <IconPlus className="h-4 w-4" />
          Declarar sobre la selección
        </button>
      </div>

      {ranges.map((range) => (
        <RegionRow
          key={range.id}
          title={range.name}
          subtitle={`${range.startCell}:${range.endCell}${
            range.tags.length > 0 ? ` · ${range.tags.join(", ")}` : ""
          }`}
          onGo={() => onGoToRegion(range.startCell, range.endCell)}
          onRemove={() => onChange(ranges.filter((item) => item.id !== range.id))}
        />
      ))}
    </div>
  );
};

/** Zonas de semielaborado, contra el catálogo que este mismo repositorio administra. */
const ZonesTab = ({
  zones,
  startCell,
  endCell,
  onChange,
  onGoToRegion,
}: {
  zones: SemiFinishedZone[];
  startCell: string;
  endCell: string;
  onChange: (zones: SemiFinishedZone[]) => void;
  onGoToRegion: (start: string, end: string) => void;
}) => {
  const semiFinished = useQuery({
    queryKey: ["semi-finished"],
    queryFn: () => semiFinishedService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const [selected, setSelected] = useState<number | "">("");

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-md bg-gray-50 p-2">
        <select
          value={selected}
          onChange={(event) =>
            setSelected(event.target.value === "" ? "" : Number(event.target.value))
          }
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
        <button
          disabled={selected === ""}
          onClick={() => {
            const item = (semiFinished.data ?? []).find(
              (candidate) => candidate.id === selected,
            );
            if (!item) return;
            onChange([
              ...zones,
              {
                id: newId("sf"),
                semiFinishedId: item.id,
                semiFinishedCode: item.code,
                semiFinishedName: item.name,
                startCell,
                endCell,
              },
            ]);
            setSelected("");
          }}
          className="flex w-full items-center justify-center gap-1 rounded bg-rymel-blue px-2 py-1.5 text-sm text-white disabled:opacity-40"
        >
          <IconPlus className="h-4 w-4" />
          Declarar sobre la selección
        </button>
      </div>

      {zones.map((zone) => (
        <RegionRow
          key={zone.id}
          title={zone.semiFinishedName}
          subtitle={`${zone.semiFinishedCode} · ${zone.startCell}:${zone.endCell}`}
          onGo={() => onGoToRegion(zone.startCell, zone.endCell)}
          onRemove={() => onChange(zones.filter((item) => item.id !== zone.id))}
        />
      ))}
    </div>
  );
};

/** Tablas de catálogo: cada fila tras los encabezados es un ítem. */
const CatalogsTab = ({
  tables,
  startCell,
  endCell,
  onChange,
  onGoToRegion,
}: {
  tables: ItemCatalogTable[];
  startCell: string;
  endCell: string;
  onChange: (tables: ItemCatalogTable[]) => void;
  onGoToRegion: (start: string, end: string) => void;
}) => {
  const [name, setName] = useState("");
  const [headerRows, setHeaderRows] = useState(1);
  const [offsets, setOffsets] = useState({ id: 0, description: 1, um: 2 });

  return (
    <div className="space-y-3">
      <div className="space-y-2 rounded-md bg-gray-50 p-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre de la tabla"
          className="h-8 w-full rounded border border-gray-300 px-2 text-sm"
        />
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
          <label
            key={key}
            className="flex items-center justify-between text-xs text-gray-600"
          >
            {label} (columna desde el inicio)
            <input
              type="number"
              min={0}
              value={offsets[key]}
              onChange={(event) =>
                setOffsets({ ...offsets, [key]: Number(event.target.value) })
              }
              className="h-7 w-16 rounded border border-gray-300 px-1 text-sm"
            />
          </label>
        ))}

        <button
          disabled={name.trim() === ""}
          onClick={() => {
            onChange([
              ...tables,
              {
                id: newId("ct"),
                name: name.trim(),
                startCell,
                endCell,
                headerRows,
                idColumnOffset: offsets.id,
                descriptionColumnOffset: offsets.description,
                umColumnOffset: offsets.um,
              },
            ]);
            setName("");
          }}
          className="flex w-full items-center justify-center gap-1 rounded bg-rymel-blue px-2 py-1.5 text-sm text-white disabled:opacity-40"
        >
          <IconPlus className="h-4 w-4" />
          Declarar sobre la selección
        </button>
      </div>

      {tables.map((table) => (
        <RegionRow
          key={table.id}
          title={table.name}
          subtitle={`${table.startCell}:${table.endCell} · ${table.headerRows} encabezado(s)`}
          onGo={() => onGoToRegion(table.startCell, table.endCell)}
          onRemove={() => onChange(tables.filter((item) => item.id !== table.id))}
        />
      ))}
    </div>
  );
};

const RegionRow = ({
  title,
  subtitle,
  onGo,
  onRemove,
}: {
  title: string;
  subtitle: string;
  onGo: () => void;
  onRemove: () => void;
}) => (
  <div className="flex items-start justify-between rounded border border-gray-200 px-2 py-1.5">
    <button onClick={onGo} className="text-left">
      <div className="text-sm font-medium text-gray-900">{title}</div>
      <div className="font-mono text-xs text-gray-500">{subtitle}</div>
    </button>
    <button
      onClick={onRemove}
      title="Quitar"
      className="text-gray-400 hover:text-red-600"
    >
      <IconTrash className="h-4 w-4" />
    </button>
  </div>
);
