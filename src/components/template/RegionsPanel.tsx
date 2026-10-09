import { useState } from "react";
import { IconLock, IconTrash } from "@tabler/icons-react";
import type { SheetStyles } from "@rymel/design-template";
import type { Rect } from "@hooks/useGridSelection";
import { refOf } from "@hooks/useGridSelection";
import { READ_ONLY_ZONES_ENABLED } from "@/config/features";
import { CatalogTableForm, NamedRangeForm, SemiFinishedZoneForm } from "./RegionForms";
import { readOnlyZone, upsertRegion } from "./regions";

interface Props {
  styles: SheetStyles;
  rect: Rect;
  onSetStyles: (styles: SheetStyles) => void;
  /** Lleva la selección a la región, para verla en la rejilla. */
  onGoToRegion: (startCell: string, endCell: string) => void;
}

type Tab = "ranges" | "zones" | "catalogs" | "readOnly";

/**
 * Las regiones que una hoja puede declarar.
 *
 * Van en un panel y no en modales porque se definen sobre la selección: se
 * marca el rango en la rejilla y se declara aquí sin perderlo de vista. El
 * menú contextual declara las mismas regiones con los mismos formularios; el
 * panel sirve además para verlas todas de un vistazo.
 */
export const RegionsPanel = ({ styles, rect, onSetStyles, onGoToRegion }: Props) => {
  const [tab, setTab] = useState<Tab>("ranges");

  const startCell = refOf(rect.top, rect.left);
  const endCell = refOf(rect.bottom, rect.right);

  const tabs: [Tab, string][] = [
    ["ranges", `Rangos (${styles.namedRanges.length})`],
    ["zones", `Semielab. (${styles.semiFinishedZones.length})`],
    ["catalogs", `Catálogos (${styles.itemCatalogTables.length})`],
    ...(READ_ONLY_ZONES_ENABLED
      ? [["readOnly", `Protegidas (${styles.readOnlyZones.length})`] as [Tab, string]]
      : []),
  ];

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white">
      <div className="flex border-b border-gray-200 text-xs">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 px-1 py-2 ${
              tab === id
                ? "border-b-2 border-rymel-blue font-medium text-rymel-blue"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {tab === "ranges" && (
          <>
            <div className="rounded-md bg-gray-50 p-2">
              <NamedRangeForm
                startCell={startCell}
                endCell={endCell}
                onSubmit={(range) =>
                  onSetStyles({ ...styles, namedRanges: upsertRegion(styles.namedRanges, range) })
                }
              />
            </div>
            {styles.namedRanges.map((range) => (
              <RegionRow
                key={range.id}
                title={range.name}
                subtitle={`${range.startCell}:${range.endCell}${
                  range.tags.length > 0 ? ` · ${range.tags.join(", ")}` : ""
                }`}
                onGo={() => onGoToRegion(range.startCell, range.endCell)}
                onRemove={() =>
                  onSetStyles({
                    ...styles,
                    namedRanges: styles.namedRanges.filter((item) => item.id !== range.id),
                  })
                }
              />
            ))}
          </>
        )}

        {tab === "zones" && (
          <>
            <div className="rounded-md bg-gray-50 p-2">
              <SemiFinishedZoneForm
                startCell={startCell}
                endCell={endCell}
                onSubmit={(zone) =>
                  onSetStyles({
                    ...styles,
                    semiFinishedZones: upsertRegion(styles.semiFinishedZones, zone),
                  })
                }
              />
            </div>
            {styles.semiFinishedZones.map((zone) => (
              <RegionRow
                key={zone.id}
                title={zone.semiFinishedName}
                subtitle={`${zone.semiFinishedCode} · ${zone.startCell}:${zone.endCell}`}
                onGo={() => onGoToRegion(zone.startCell, zone.endCell)}
                onRemove={() =>
                  onSetStyles({
                    ...styles,
                    semiFinishedZones: styles.semiFinishedZones.filter((item) => item.id !== zone.id),
                  })
                }
              />
            ))}
          </>
        )}

        {tab === "catalogs" && (
          <>
            <div className="rounded-md bg-gray-50 p-2">
              <CatalogTableForm
                startCell={startCell}
                endCell={endCell}
                onSubmit={(table) =>
                  onSetStyles({
                    ...styles,
                    itemCatalogTables: upsertRegion(styles.itemCatalogTables, table),
                  })
                }
              />
            </div>
            {styles.itemCatalogTables.map((table) => (
              <RegionRow
                key={table.id}
                title={table.name}
                subtitle={`${table.startCell}:${table.endCell} · ${table.headerRows} encabezado(s)${
                  table.tags && table.tags.length > 0 ? ` · ${table.tags.join(", ")}` : ""
                }`}
                onGo={() => onGoToRegion(table.startCell, table.endCell)}
                onRemove={() =>
                  onSetStyles({
                    ...styles,
                    itemCatalogTables: styles.itemCatalogTables.filter((item) => item.id !== table.id),
                  })
                }
              />
            ))}
          </>
        )}

        {tab === "readOnly" && (
          <>
            <div className="space-y-2 rounded-md bg-gray-50 p-2">
              <p className="text-xs text-gray-500">
                El diseñador no podrá editar, borrar ni pegar sobre estas celdas.
                Aquí se siguen editando con normalidad.
              </p>
              <button
                onClick={() =>
                  onSetStyles({
                    ...styles,
                    readOnlyZones: [...styles.readOnlyZones, readOnlyZone(startCell, endCell)],
                  })
                }
                className="flex w-full items-center justify-center gap-1 rounded bg-rymel-blue px-2 py-1.5 text-sm text-white"
              >
                <IconLock className="h-4 w-4" />
                Proteger {startCell}:{endCell}
              </button>
            </div>
            {styles.readOnlyZones.map((zone) => (
              <RegionRow
                key={zone.id}
                title="Solo lectura"
                subtitle={`${zone.startCell}:${zone.endCell}`}
                onGo={() => onGoToRegion(zone.startCell, zone.endCell)}
                onRemove={() =>
                  onSetStyles({
                    ...styles,
                    readOnlyZones: styles.readOnlyZones.filter((item) => item.id !== zone.id),
                  })
                }
              />
            ))}
          </>
        )}
      </div>
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
    <button onClick={onRemove} title="Quitar" className="text-gray-400 hover:text-red-600">
      <IconTrash className="h-4 w-4" />
    </button>
  </div>
);
