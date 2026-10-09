/**
 * Qué ofrece el menú contextual de la rejilla.
 *
 * Es el mismo menú que tenía el diseñador de project-front, que es donde el
 * negocio aprendió a configurar una plantilla con clic derecho. Aquí solo se
 * decide **qué entradas** hay según el estado de la celda y de la selección;
 * qué hace cada una lo decide quien lo monta, con las mismas mutaciones que la
 * barra de formato y los paneles. Así el menú no puede escribir distinto.
 */

import { columnIndexToLabel } from "@rymel/formula-engine";
import type { TemplateSheet } from "@rymel/design-template";
import type { Rect } from "@hooks/useGridSelection";
import { isInsideRange } from "./grid/range";

export type CellMenuAction =
  | "merge"
  | "unmerge"
  | "freeze"
  | "unfreeze"
  | "note"
  | "remove-note"
  | "tag-mo"
  | "tag-md"
  | "remove-tag"
  | "goto"
  | "remove-goto"
  | "named-range"
  | "edit-named-range"
  | "remove-named-range"
  | "zone"
  | "remove-zone"
  | "catalog-table"
  | "remove-catalog-table"
  | "item-link"
  | "remove-item-link"
  | "catalog-conditions"
  | "protect"
  | "unprotect";

export type HeaderMenuAction =
  | "hide"
  | "show-all"
  | "freeze-until"
  | "unfreeze";

export interface MenuEntry<Action extends string> {
  action: Action;
  label: string;
  /** Las que quitan algo se pintan en rojo, como en el diseñador. */
  tone?: "danger";
  disabled?: boolean;
}

/** Grupos separados por una línea, en el orden en que se muestran. */
export type MenuGroups<Action extends string> = MenuEntry<Action>[][];

interface Region {
  startCell: string;
  endCell: string;
}

/** La región que contiene la celda, si alguna. */
export const regionAt = <R extends Region>(regions: readonly R[], ref: string): R | undefined =>
  regions.find((region) => isInsideRange(ref, region.startCell, region.endCell));

export interface CellMenuContext {
  sheet: TemplateSheet;
  ref: string;
  rect: Rect;
  /** La protección de solo lectura aún no se ofrece mientras el diseñador no la cumpla. */
  readOnlyEnabled: boolean;
}

export const cellMenuEntries = ({
  sheet,
  ref,
  rect,
  readOnlyEnabled,
}: CellMenuContext): MenuGroups<CellMenuAction> => {
  const cell = sheet.cells[ref];
  const styles = sheet.styles;
  const groups: MenuGroups<CellMenuAction> = [];

  const structure: MenuEntry<CellMenuAction>[] = [];
  if (rect.bottom > rect.top || rect.right > rect.left) {
    structure.push({ action: "merge", label: "Combinar celdas" });
  }
  if (regionAt(styles.mergedCells, ref)) {
    structure.push({ action: "unmerge", label: "Separar celdas" });
  }
  structure.push({ action: "freeze", label: "Inmovilizar paneles aquí" });
  if (styles.freezeRow > 0 || styles.freezeColumn > 0) {
    structure.push({ action: "unfreeze", label: "Movilizar paneles" });
  }
  groups.push(structure);

  groups.push(
    cell?.note
      ? [
          { action: "note", label: "Editar nota" },
          { action: "remove-note", label: "Quitar nota", tone: "danger" },
        ]
      : [{ action: "note", label: "Agregar nota" }],
  );

  const tag = cell?.materialTag;
  groups.push([
    {
      action: "tag-mo",
      label:
        tag === "MO"
          ? "Celda etiquetada como Material del Núcleo"
          : "Etiquetar celda como Material del Núcleo (MO)",
      disabled: tag === "MO",
    },
    {
      action: "tag-md",
      label:
        tag === "MD"
          ? "Celda etiquetada como Material de Devanado"
          : "Etiquetar celda como Material de Devanado (MD)",
      disabled: tag === "MD",
    },
    ...(tag
      ? [{ action: "remove-tag" as const, label: `Quitar etiqueta ${tag}`, tone: "danger" as const }]
      : []),
  ]);

  groups.push(
    cell?.goTo
      ? [
          { action: "goto", label: "Editar Ir a…" },
          { action: "remove-goto", label: "Quitar Ir a", tone: "danger" },
        ]
      : [{ action: "goto", label: "Configurar Ir a…" }],
  );

  const range = regionAt(styles.namedRanges, ref);
  groups.push([
    { action: "named-range", label: "Etiquetar rango como tabla" },
    ...(range
      ? [
          { action: "edit-named-range" as const, label: `Editar tabla etiquetada (${range.name})` },
          { action: "remove-named-range" as const, label: "Quitar tabla etiquetada", tone: "danger" as const },
        ]
      : []),
  ]);

  const zone = regionAt(styles.semiFinishedZones, ref);
  groups.push(
    zone
      ? [
          { action: "zone", label: `Editar zona (${zone.semiFinishedCode})` },
          { action: "remove-zone", label: "Quitar zona", tone: "danger" },
        ]
      : [{ action: "zone", label: "Asignar zona a semi-terminado" }],
  );

  const table = regionAt(styles.itemCatalogTables, ref);
  groups.push(
    table
      ? [
          { action: "catalog-table", label: `Editar tabla catálogo (${table.name})` },
          { action: "remove-catalog-table", label: "Quitar tabla catálogo", tone: "danger" },
        ]
      : [{ action: "catalog-table", label: "Marcar como tabla de catálogo" }],
  );

  const conditions = cell?.catalogConditionCells?.length ?? 0;
  groups.push([
    {
      action: "item-link",
      label: cell?.itemLink
        ? `Cambiar vínculo (#${cell.itemLink.itemId})`
        : "Vincular a item del catálogo",
    },
    ...(cell?.itemLink
      ? [{ action: "remove-item-link" as const, label: "Quitar vínculo", tone: "danger" as const }]
      : []),
    {
      action: "catalog-conditions",
      label: `Configurar vínculo al catálogo${conditions > 0 ? ` (${conditions})` : ""}`,
    },
  ]);

  if (readOnlyEnabled) {
    const protectedZone = regionAt(styles.readOnlyZones, ref);
    groups.push(
      protectedZone
        ? [
            {
              action: "unprotect",
              label: `Quitar solo lectura (${protectedZone.startCell}:${protectedZone.endCell})`,
              tone: "danger",
            },
          ]
        : [{ action: "protect", label: "Proteger como solo lectura" }],
    );
  }

  return groups;
};

export interface HeaderMenuContext {
  sheet: TemplateSheet;
  kind: "row" | "column";
  index: number;
}

export const headerMenuEntries = ({
  sheet,
  kind,
  index,
}: HeaderMenuContext): MenuGroups<HeaderMenuAction> => {
  const isRow = kind === "row";
  const hidden = isRow ? sheet.styles.hiddenRows : sheet.styles.hiddenColumns;
  const frozen = isRow ? sheet.styles.freezeRow : sheet.styles.freezeColumn;
  const label = isRow ? `fila ${index + 1}` : `columna ${columnIndexToLabel(index)}`;

  return [
    [
      { action: "hide", label: `Ocultar ${label}` },
      ...(hidden.length > 0
        ? [{ action: "show-all" as const, label: isRow ? "Mostrar todas las filas" : "Mostrar todas las columnas" }]
        : []),
    ],
    [
      {
        action: "freeze-until",
        label: isRow
          ? `Inmovilizar filas hasta fila ${index + 1}`
          : `Inmovilizar columnas hasta columna ${columnIndexToLabel(index)}`,
      },
      ...(frozen > 0
        ? [{ action: "unfreeze" as const, label: isRow ? "Movilizar filas" : "Movilizar columnas" }]
        : []),
    ],
  ];
};
