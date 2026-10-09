import { useCallback, useMemo, useState } from "react";
import { IconClipboardList, IconDownload, IconSearch } from "@tabler/icons-react";
import { Layout } from "@components/Layout";
import { Button } from "@components/ui/Button";
import { Pagination } from "@components/ui/Pagination";
import { BomSheetEditor } from "@components/bom-summary/BomSheetEditor";
import { buildBomSummaryCells } from "@components/bom-summary/buildBomSummary";
import { toCsv } from "@components/bom-summary/summaryTable";
import { useBomForReference, useDesignDetail, useDesigns } from "@hooks/useDesignBom";
import type { DesignDetail, SavedCell, SavedSheet } from "@/types/designBom.types";
import type { BillOfMaterials } from "@/types/bom.types";

/**
 * Lista de materiales de los diseños guardados.
 *
 * Antes la generaba el diseñador en su pantalla; ahora se genera aquí, con
 * las mismas reglas (`buildBomSummary`, portado del cliente y fijado por su
 * prueba de paridad) y el mismo comportamiento: una hoja que se edita como
 * Excel y no se guarda con el diseño. Se exporta a CSV con lo editado.
 */
export const DesignBomPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const designs = useDesigns(page, search.trim());

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <IconClipboardList className="h-7 w-7 text-rymel-blue" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lista de materiales</h1>
            <p className="text-sm text-gray-500">
              Desglose de materiales de cada diseño, a partir de la estructura BOM de la
              referencia ERP de su elemento.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
            <label className="flex items-center gap-2 rounded border border-gray-300 px-2">
              <IconSearch className="h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por código de diseño"
                aria-label="Buscar diseño"
                className="h-9 flex-1 text-sm outline-none"
              />
            </label>

            {designs.isLoading && <p className="text-sm text-gray-500">Cargando diseños…</p>}
            {designs.isError && (
              <p className="text-sm text-red-600">No se pudieron cargar los diseños.</p>
            )}
            {designs.data && designs.data.data.length === 0 && (
              <p className="text-sm text-gray-500">Ningún diseño coincide con la búsqueda.</p>
            )}

            <ul className="divide-y divide-gray-100">
              {(designs.data?.data ?? []).map((design) => (
                <li key={design.id}>
                  <button
                    onClick={() => setSelectedId(design.id)}
                    className={`w-full px-2 py-2 text-left hover:bg-gray-50 ${
                      selectedId === design.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <div className="font-mono text-sm font-medium text-gray-900">{design.code}</div>
                    <div className="text-xs text-gray-500">
                      {design.designSubType?.name ?? "Sin subtipo"} ·{" "}
                      {design.designElements.length} elemento(s)
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {designs.data && designs.data.totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={designs.data.totalPages}
                onPageChange={setPage}
              />
            )}
          </div>

          <div>
            {selectedId === null ? (
              <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                Elige un diseño para ver su lista de materiales.
              </p>
            ) : (
              <DesignBom key={selectedId} designId={selectedId} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

/** La lista de un diseño: elemento, estructura, tabla y exportación. */
const DesignBom = ({ designId }: { designId: number }) => {
  const detail = useDesignDetail(designId);
  const [elementIndex, setElementIndex] = useState(0);

  if (detail.isLoading) return <p className="text-sm text-gray-500">Cargando diseño…</p>;
  if (detail.isError || !detail.data) {
    return <p className="text-sm text-red-600">No se pudo cargar el diseño.</p>;
  }

  return (
    <DesignBomContent
      key={elementIndex}
      design={detail.data}
      elementIndex={elementIndex}
      onElementChange={setElementIndex}
    />
  );
};

const DesignBomContent = ({
  design,
  elementIndex,
  onElementChange,
}: {
  design: DesignDetail;
  elementIndex: number;
  onElementChange: (index: number) => void;
}) => {
  const element = design.designElements[elementIndex]?.element;
  const reference = element?.sapReference?.trim() || null;
  const bom = useBomForReference(reference);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  /** Lo que se ve en la hoja, con las ediciones: es lo que se exporta. */
  const [visible, setVisible] = useState<Record<string, SavedCell> | null>(null);
  const onVisibleChange = useCallback((cells: Record<string, SavedCell>) => setVisible(cells), []);

  // Las hojas del diseño, no las de costos: las mismas que usaba el cliente.
  const sheets = useMemo<SavedSheet[]>(
    () =>
      design.subDesigns
        .map((subDesign) => subDesign.data)
        .filter((data): data is SavedSheet => data !== null && typeof data === "object"),
    [design.subDesigns],
  );

  const summary = useMemo<{ cells?: Record<string, SavedCell>; error?: string }>(() => {
    if (!bom.data || !element) return {};
    try {
      return { cells: buildBomSummaryCells(bom.data, expanded, sheets, element) };
    } catch {
      return {
        error:
          "No se pudo armar la lista con los datos de este diseño. Revisa que el elemento tenga sus características técnicas cargadas.",
      };
    }
  }, [bom.data, element, expanded, sheets]);

  const toggle = (nodeId: number) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="space-y-1">
          <h2 className="font-mono text-lg font-semibold text-gray-900">{design.code}</h2>
          {design.designElements.length > 1 ? (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Elemento
              <select
                value={elementIndex}
                onChange={(event) => onElementChange(Number(event.target.value))}
                aria-label="Elemento"
                className="h-8 rounded border border-gray-300 px-2 text-sm"
              >
                {design.designElements.map((item, index) => (
                  <option key={item.id} value={index}>
                    {item.element.sapReference || `Elemento ${item.element.id}`}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <p className="text-sm text-gray-600">
            Referencia ERP: <span className="font-mono">{reference ?? "—"}</span>
            {bom.data && (
              <>
                {" "}
                · Estructura <span className="font-mono">{bom.data.code}</span> ({bom.data.name})
              </>
            )}
          </p>
          {design.designElements.length > 1 && (
            <p className="text-xs text-gray-500">
              El diseño tiene {design.designElements.length} elementos; por omisión se usa el
              primero, como en la pantalla del diseñador.
            </p>
          )}
        </div>

        {summary.cells && visible && (
          <Button variant="outline" size="sm" onClick={() => downloadCsv(design, bom.data!, visible)}>
            <IconDownload className="mr-1 h-4 w-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      {!element && <Notice>Este diseño no tiene elemento asociado.</Notice>}
      {element && reference === null && (
        <Notice>
          Este elemento no tiene referencia ERP configurada. No se puede generar la lista de
          materiales.
        </Notice>
      )}
      {reference !== null && bom.isLoading && (
        <p className="text-sm text-gray-500">Buscando la estructura BOM…</p>
      )}
      {reference !== null && bom.isError && (
        <Notice>No se pudo consultar la estructura BOM.</Notice>
      )}
      {reference !== null && bom.data === null && (
        <Notice>
          No se encontró estructura BOM para la referencia ERP{" "}
          <span className="font-mono">{reference}</span>.
        </Notice>
      )}
      {summary.error && <Notice>{summary.error}</Notice>}

      {summary.cells && (
        <>
          {Object.keys(summary.cells).length === 0 ? (
            <Notice>La estructura no tiene semielaborados.</Notice>
          ) : (
            <>
              <p className="text-xs text-gray-500">
                Se edita como una hoja de Excel. Los cambios no se guardan con el diseño: se
                pierden al salir o al desplegar un semielaborado, y salen en la exportación.
              </p>
              {/* Desplegar rearma la hoja, como en el cliente. */}
              <BomSheetEditor
                key={[...expanded].sort().join(",")}
                cells={summary.cells}
                onToggle={toggle}
                onVisibleChange={onVisibleChange}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

const Notice = ({ children }: { children: React.ReactNode }) => (
  <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
    {children}
  </p>
);

const downloadCsv = (
  design: DesignDetail,
  bom: BillOfMaterials,
  cells: Record<string, SavedCell>,
) => {
  const blob = new Blob([toCsv(cells)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lista-de-materiales-${design.code}-${bom.code}.csv`.replace(/[^\w.-]+/g, "_");
  link.click();
  URL.revokeObjectURL(url);
};

export default DesignBomPage;
