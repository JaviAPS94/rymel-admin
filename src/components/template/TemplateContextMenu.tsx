import { useState } from "react";
import type {
  CellItemLink,
  ItemCatalogTable,
  MaterialTag,
  NamedRange,
  SemiFinishedZone,
  SheetStyles,
  TemplateCell,
  TemplateDocument,
  TemplateSheet,
} from "@rymel/design-template";
import { Modal } from "@components/ui/Modal";
import { refOf, type Rect } from "@hooks/useGridSelection";
import { READ_ONLY_ZONES_ENABLED } from "@/config/features";
import { GridContextMenu } from "./grid/GridContextMenu";
import {
  cellMenuEntries,
  headerMenuEntries,
  regionAt,
  type CellMenuAction,
  type HeaderMenuAction,
} from "./contextMenu";
import {
  freezeAt,
  hideIndices,
  mergeRect,
  showAll,
  unfreeze,
  unmergeAt,
} from "./sheetStructure";
import { CatalogTableForm, NamedRangeForm, SemiFinishedZoneForm } from "./RegionForms";
import { NoteForm, RefListForm } from "./CellDialogs";
import { ItemPickerModal } from "./ItemPickerModal";
import { readOnlyZone, upsertRegion } from "./regions";
import type { ValueOf } from "./catalog";

export type MenuTarget =
  | { kind: "cell"; ref: string; x: number; y: number }
  | { kind: "row" | "column"; index: number; x: number; y: number };

type Dialog =
  | { type: "note" | "goto" | "conditions" | "item"; ref: string }
  | { type: "named-range"; initial?: NamedRange }
  | { type: "zone"; initial?: SemiFinishedZone }
  | { type: "catalog-table"; initial?: ItemCatalogTable };

interface Props {
  target: MenuTarget | null;
  onCloseMenu: () => void;
  document: TemplateDocument;
  sheet: TemplateSheet;
  rect: Rect;
  updateCell: (sheetName: string, ref: string, patch: Partial<TemplateCell>) => void;
  setSheetStyles: (sheetName: string, styles: SheetStyles) => void;
  setMaterialTag: (sheetName: string, ref: string, tag: MaterialTag | null) => void;
  valueOf: ValueOf;
}

/**
 * El menú contextual de la rejilla y los diálogos que abre.
 *
 * Cada acción escribe con las mismas mutaciones que la barra de formato y los
 * paneles —`updateCell`, `setSheetStyles`, `setMaterialTag`—, así que entra en
 * el historial de deshacer y no puede producir un documento distinto del que
 * produciría la otra entrada.
 */
export const TemplateContextMenu = ({
  target,
  onCloseMenu,
  document,
  sheet,
  rect,
  updateCell,
  setSheetStyles,
  setMaterialTag,
  valueOf,
}: Props) => {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);

  const styles = sheet.styles;
  const setStyles = (next: SheetStyles) => setSheetStyles(sheet.name, next);
  const startCell = refOf(rect.top, rect.left);
  const endCell = refOf(rect.bottom, rect.right);

  const runCell = (ref: string, action: CellMenuAction) => {
    switch (action) {
      case "merge":
        return setStyles(mergeRect(styles, rect));
      case "unmerge":
        return setStyles(unmergeAt(styles, ref));
      case "freeze":
        // Igual que la barra: por encima y a la izquierda de la selección.
        return setStyles(freezeAt(styles, rect.top, rect.left));
      case "unfreeze":
        return setStyles(unfreeze(styles, "both"));
      case "remove-note":
        return updateCell(sheet.name, ref, { note: undefined });
      case "tag-mo":
        return setMaterialTag(sheet.name, ref, "MO");
      case "tag-md":
        return setMaterialTag(sheet.name, ref, "MD");
      case "remove-tag":
        return setMaterialTag(sheet.name, ref, null);
      case "remove-goto":
        return updateCell(sheet.name, ref, { goTo: undefined });
      case "remove-item-link":
        return updateCell(sheet.name, ref, { itemLink: undefined });
      case "note":
      case "goto":
        return setDialog({ type: action, ref });
      case "item-link":
        return setDialog({ type: "item", ref });
      case "catalog-conditions":
        return setDialog({ type: "conditions", ref });
      case "named-range":
        return setDialog({ type: "named-range" });
      case "edit-named-range":
        return setDialog({ type: "named-range", initial: regionAt(styles.namedRanges, ref) });
      case "remove-named-range": {
        const range = regionAt(styles.namedRanges, ref);
        return setStyles({
          ...styles,
          namedRanges: styles.namedRanges.filter((item) => item.id !== range?.id),
        });
      }
      case "zone":
        return setDialog({ type: "zone", initial: regionAt(styles.semiFinishedZones, ref) });
      case "remove-zone": {
        const zone = regionAt(styles.semiFinishedZones, ref);
        return setStyles({
          ...styles,
          semiFinishedZones: styles.semiFinishedZones.filter((item) => item.id !== zone?.id),
        });
      }
      case "catalog-table":
        return setDialog({
          type: "catalog-table",
          initial: regionAt(styles.itemCatalogTables, ref),
        });
      case "remove-catalog-table": {
        const table = regionAt(styles.itemCatalogTables, ref);
        return setStyles({
          ...styles,
          itemCatalogTables: styles.itemCatalogTables.filter((item) => item.id !== table?.id),
        });
      }
      case "protect":
        return setStyles({
          ...styles,
          readOnlyZones: [...styles.readOnlyZones, readOnlyZone(startCell, endCell)],
        });
      case "unprotect": {
        const zone = regionAt(styles.readOnlyZones, ref);
        return setStyles({
          ...styles,
          readOnlyZones: styles.readOnlyZones.filter((item) => item.id !== zone?.id),
        });
      }
    }
  };

  const runHeader = (kind: "row" | "column", index: number, action: HeaderMenuAction) => {
    const plural = kind === "row" ? "rows" : "columns";
    switch (action) {
      case "hide": {
        // Si la cabecera pulsada está dentro de la selección, se ocultan todas
        // las seleccionadas; si no, solo ésa.
        const [from, to] = kind === "row" ? [rect.top, rect.bottom] : [rect.left, rect.right];
        const indices =
          from <= index && index <= to
            ? Array.from({ length: to - from + 1 }, (_, offset) => from + offset)
            : [index];
        return setStyles(hideIndices(styles, plural, indices));
      }
      case "show-all":
        return setStyles(showAll(styles, plural));
      case "freeze-until":
        return setStyles(
          kind === "row"
            ? { ...styles, freezeRow: index + 1 }
            : { ...styles, freezeColumn: index + 1 },
        );
      case "unfreeze":
        return setStyles(unfreeze(styles, plural));
    }
  };

  const dialogCell = dialog && "ref" in dialog ? sheet.cells[dialog.ref] : undefined;

  return (
    <>
      {target?.kind === "cell" && (
        <GridContextMenu
          x={target.x}
          y={target.y}
          title={`${sheet.name}!${target.ref}`}
          groups={cellMenuEntries({
            sheet,
            ref: target.ref,
            rect,
            readOnlyEnabled: READ_ONLY_ZONES_ENABLED,
          })}
          onSelect={(action) => runCell(target.ref, action)}
          onClose={onCloseMenu}
        />
      )}

      {target && target.kind !== "cell" && (
        <GridContextMenu
          x={target.x}
          y={target.y}
          groups={headerMenuEntries({ sheet, kind: target.kind, index: target.index })}
          onSelect={(action) => runHeader(target.kind, target.index, action)}
          onClose={onCloseMenu}
        />
      )}

      {dialog?.type === "note" && (
        <Modal isOpen onClose={close} title={`Nota · ${dialog.ref}`}>
          <NoteForm
            initial={dialogCell?.note ?? ""}
            onSubmit={(note) => {
              updateCell(sheet.name, dialog.ref, { note });
              close();
            }}
          />
        </Modal>
      )}

      {dialog?.type === "goto" && (
        <Modal isOpen onClose={close} title={`Ir a… · ${dialog.ref}`}>
          <RefListForm
            initial={dialogCell?.goTo?.conditionCells ?? []}
            help="El destino se elige comparando el valor de estas celdas con las etiquetas de los rangos con nombre. Déjalo vacío para quitar la navegación."
            onSubmit={(refs) => {
              updateCell(sheet.name, dialog.ref, {
                goTo: refs.length > 0 ? { conditionCells: refs } : undefined,
              });
              close();
            }}
          />
        </Modal>
      )}

      {dialog?.type === "conditions" && (
        <Modal isOpen onClose={close} title={`Vínculo al catálogo · ${dialog.ref}`}>
          <RefListForm
            initial={dialogCell?.catalogConditionCells ?? []}
            help="Sus valores se comparan con las etiquetas de las tablas de catálogo para decidir a cuál se enruta la celda. Déjalo vacío para quitar las condiciones."
            onSubmit={(refs) => {
              updateCell(sheet.name, dialog.ref, {
                catalogConditionCells: refs.length > 0 ? refs : undefined,
              });
              close();
            }}
          />
        </Modal>
      )}

      {dialog?.type === "item" && (
        <ItemPickerModal
          document={document}
          sheetName={sheet.name}
          cellRef={dialog.ref}
          conditionCells={dialogCell?.catalogConditionCells ?? []}
          valueOf={valueOf}
          elementKeyOf={(ref) => sheet.cells[ref]?.elementKey}
          current={dialogCell?.itemLink}
          onPick={(link: CellItemLink) => {
            updateCell(sheet.name, dialog.ref, { itemLink: link });
            close();
          }}
          onClose={close}
        />
      )}

      {dialog?.type === "named-range" && (
        <Modal isOpen onClose={close} title="Tabla etiquetada">
          <NamedRangeForm
            startCell={startCell}
            endCell={endCell}
            initial={dialog.initial}
            submitLabel={dialog.initial ? "Guardar" : "Etiquetar rango"}
            onSubmit={(range) => {
              setStyles({ ...styles, namedRanges: upsertRegion(styles.namedRanges, range) });
              close();
            }}
          />
        </Modal>
      )}

      {dialog?.type === "zone" && (
        <Modal isOpen onClose={close} title="Zona de semi-terminado">
          <SemiFinishedZoneForm
            startCell={startCell}
            endCell={endCell}
            initial={dialog.initial}
            submitLabel={dialog.initial ? "Guardar" : "Asignar zona"}
            onSubmit={(zone) => {
              setStyles({
                ...styles,
                semiFinishedZones: upsertRegion(styles.semiFinishedZones, zone),
              });
              close();
            }}
          />
        </Modal>
      )}

      {dialog?.type === "catalog-table" && (
        <Modal isOpen onClose={close} title="Tabla de catálogo">
          <CatalogTableForm
            startCell={startCell}
            endCell={endCell}
            initial={dialog.initial}
            submitLabel={dialog.initial ? "Guardar" : "Marcar tabla"}
            onSubmit={(table) => {
              setStyles({
                ...styles,
                itemCatalogTables: upsertRegion(styles.itemCatalogTables, table),
              });
              close();
            }}
          />
        </Modal>
      )}
    </>
  );
};
