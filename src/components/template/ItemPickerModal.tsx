import { useMemo, useState } from "react";
import type { CellItemLink, TemplateDocument } from "@rymel/design-template";
import { Modal } from "@components/ui/Modal";
import { catalogRows, catalogTables, matchCatalogTables, type ValueOf } from "./catalog";

interface Props {
  document: TemplateDocument;
  sheetName: string;
  cellRef: string;
  /** Celdas de condición de la celda, en su propia hoja. */
  conditionCells: string[];
  /** El valor que la vista previa da a una celda, o el calculado en local. */
  valueOf: ValueOf;
  /** Si una celda de condición se rellena con un dato del elemento. */
  elementKeyOf: (ref: string) => string | undefined;
  current?: CellItemLink;
  onPick: (link: CellItemLink) => void;
  onClose: () => void;
}

/**
 * Vincular una celda a un ítem eligiendo su fila, no escribiendo su
 * identificador.
 *
 * Enruta como lo hacía el diseñador: si la celda tiene condiciones, ofrece
 * primero las tablas cuyas etiquetas contienen todos sus valores. Aquí los
 * valores salen de la vista previa, porque en el editor no hay elemento; si
 * una condición depende de un dato del elemento, se avisa de que el enrutado
 * real será otro.
 */
export const ItemPickerModal = ({
  document,
  sheetName,
  cellRef,
  conditionCells,
  valueOf,
  elementKeyOf,
  current,
  onPick,
  onClose,
}: Props) => {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");

  const conditionValues = conditionCells.map((ref) => valueOf(sheetName, ref));
  const fromElement = conditionCells
    .map((ref) => elementKeyOf(ref))
    .filter((key): key is string => key !== undefined);

  const all = catalogTables(document);
  const matched = matchCatalogTables(document, conditionValues);
  const tables = showAll ? all : matched;

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return tables.flatMap(({ sheetName: tableSheet, table }) => {
      const sheet = document.sheets.find((item) => item.name === tableSheet);
      if (!sheet) return [];
      return catalogRows(sheet, table, valueOf)
        .filter(
          (row) =>
            needle === "" ||
            row.itemId.toLowerCase().includes(needle) ||
            row.description.toLowerCase().includes(needle),
        )
        .map((row) => ({ ...row, tableSheet, table }));
    });
  }, [document.sheets, search, tables, valueOf]);

  return (
    <Modal isOpen onClose={onClose} title={`Vincular ${sheetName}!${cellRef}`} maxWidth="xl">
      {all.length === 0 ? (
        <p className="text-sm text-gray-600">
          La plantilla no declara ninguna tabla de catálogo. Selecciona el rango
          del catálogo, haz clic derecho y elige «Marcar como tabla de
          catálogo»; después vuelve aquí.
        </p>
      ) : (
        <div className="space-y-3">
          {conditionCells.length > 0 && (
            <div className="rounded bg-gray-50 px-2 py-1.5 text-xs text-gray-600">
              Condiciones:{" "}
              {conditionCells.map((ref, index) => (
                <span key={ref} className="mr-2 font-mono">
                  {ref} = «{conditionValues[index] || "vacía"}»
                </span>
              ))}
              {fromElement.length > 0 && (
                <p className="mt-1 text-purple-700">
                  Depende del dato del elemento {fromElement.join(", ")}: se usa
                  el valor de prueba de la vista previa, y el enrutado real
                  dependerá del elemento.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por identificador o descripción"
              aria-label="Buscar ítem"
              autoFocus
              className="h-8 flex-1 rounded border border-gray-300 px-2 text-sm"
            />
            {conditionCells.length > 0 && (
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(event) => setShowAll(event.target.checked)}
                />
                Ver todas las tablas
              </label>
            )}
          </div>

          {tables.length === 0 ? (
            <p className="text-sm text-gray-600">
              Ninguna tabla tiene todas las etiquetas de las condiciones.{" "}
              <button onClick={() => setShowAll(true)} className="text-rymel-blue hover:underline">
                Ver todas las tablas
              </button>
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto rounded border border-gray-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 text-left text-xs text-gray-500">
                  <tr>
                    <th className="px-2 py-1">Tabla</th>
                    <th className="px-2 py-1">Ítem</th>
                    <th className="px-2 py-1">Descripción</th>
                    <th className="px-2 py-1">U.M.</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const selected =
                      current?.catalogTableId === row.table.id && current.itemId === row.itemId;
                    return (
                      <tr
                        key={`${row.table.id}|${row.ref}`}
                        onClick={() =>
                          onPick({
                            catalogSheetName: row.tableSheet,
                            catalogTableId: row.table.id,
                            itemId: row.itemId,
                          })
                        }
                        className={`cursor-pointer border-t border-gray-100 hover:bg-blue-50 ${
                          selected ? "bg-blue-100" : ""
                        }`}
                      >
                        <td className="px-2 py-1 text-xs text-gray-500">{row.table.name}</td>
                        <td className="px-2 py-1 font-mono">{row.itemId}</td>
                        <td className="px-2 py-1">{row.description}</td>
                        <td className="px-2 py-1">{row.um}</td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2 py-3 text-center text-xs text-gray-500">
                        Ningún ítem coincide con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
