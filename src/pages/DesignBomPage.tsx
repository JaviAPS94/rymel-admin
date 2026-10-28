import { useCallback, useEffect, useMemo, useState } from "react";
import { IconClipboardList, IconDownload, IconSearch } from "@tabler/icons-react";
import { Layout } from "@components/Layout";
import { Button } from "@components/ui/Button";
import { Pagination } from "@components/ui/Pagination";
import { BomSheetEditor } from "@components/bom-summary/BomSheetEditor";
import { buildBomSummaryCells } from "@components/bom-summary/buildBomSummary";
import { bomFingerprint } from "@components/bom-summary/bomFingerprint";
import { diffBom, type DiffRow } from "@components/bom-summary/bomDiff";
import { HEADERS, toCsv } from "@components/bom-summary/summaryTable";
import {
  useBomAdjustment,
  useBomForReference,
  useBomReview,
  useDesignDetail,
} from "@hooks/useDesignBom";
import type {
  BomAdjustment,
  BomReviewFilters,
  BomReviewRow,
  BomReviewStatus,
  DesignDetail,
  SavedCell,
  SavedSheet,
} from "@/types/designBom.types";

/**
 * Revisión de las listas de materiales de los diseños del cliente.
 *
 * El admin define de qué está hecha la lista —la estructura BOM y lo que la
 * plantilla vincula—; la norma del cliente aporta los accesorios, y el
 * diseñador la ve y la ajusta. Aquí se encuentran los diseños por norma,
 * referencia, estado y fecha (no por código, que el admin no conoce de
 * antemano). Un diseño sin ajuste se genera y se edita sin guardar, como
 * antes; uno ajustado se compara con la lista generada, en solo lectura.
 */

const STATUS_LABELS: Record<BomReviewStatus, string> = {
  adjusted: "Ajustada por el cliente",
  generable: "Generable",
  "no-structure": "Sin estructura BOM",
  "no-reference": "Sin referencia ERP",
};

const STATUS_STYLES: Record<BomReviewStatus, string> = {
  adjusted: "bg-amber-100 text-amber-800",
  generable: "bg-green-100 text-green-800",
  "no-structure": "bg-gray-100 text-gray-700",
  "no-reference": "bg-red-50 text-red-700",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });

const inputClass = "h-9 w-full rounded border border-gray-300 px-2 text-sm";

export const DesignBomPage = () => {
  const [filters, setFilters] = useState<BomReviewFilters>({ page: 1, limit: 10 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const review = useBomReview(filters);

  /** Cambiar un filtro vuelve a la primera página. */
  const setFilter = <K extends keyof BomReviewFilters>(key: K, value: BomReviewFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value || undefined, page: 1 }));

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <IconClipboardList className="h-7 w-7 text-rymel-blue" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lista de materiales</h1>
            <p className="text-sm text-gray-500">
              Listas de materiales de los diseños del cliente: la estructura BOM de la referencia
              ERP, los ítems que vincula la plantilla y los accesorios de la norma, con los
              ajustes que haya hecho el diseñador.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[24rem_1fr]">
          <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
            <div className="grid gap-2" aria-label="Filtros">
              <select
                value={filters.normId ?? ""}
                onChange={(event) => setFilter("normId", Number(event.target.value) || undefined)}
                aria-label="Norma"
                className={inputClass}
              >
                <option value="">Todas las normas</option>
                {(review.data?.norms ?? []).map((norm) => (
                  <option key={norm.id} value={norm.id}>
                    {norm.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 rounded border border-gray-300 px-2">
                <IconSearch className="h-4 w-4 text-gray-400" />
                <input
                  value={filters.sapReference ?? ""}
                  onChange={(event) => setFilter("sapReference", event.target.value)}
                  placeholder="Referencia ERP del elemento"
                  aria-label="Referencia ERP"
                  className="h-9 flex-1 text-sm outline-none"
                />
              </label>
              <select
                value={filters.status ?? ""}
                onChange={(event) => setFilter("status", event.target.value as BomReviewStatus)}
                aria-label="Estado de la lista"
                className={inputClass}
              >
                <option value="">Todos los estados</option>
                {(Object.keys(STATUS_LABELS) as BomReviewStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2">
                <select
                  value={filters.dateField ?? "created"}
                  onChange={(event) =>
                    setFilter("dateField", event.target.value as "created" | "adjusted")
                  }
                  aria-label="Fecha de"
                  className="h-9 rounded border border-gray-300 px-1 text-sm"
                >
                  <option value="created">Creado</option>
                  <option value="adjusted">Ajustado</option>
                </select>
                <input
                  type="date"
                  value={filters.from ?? ""}
                  onChange={(event) => setFilter("from", event.target.value)}
                  aria-label="Desde"
                  className={inputClass}
                />
                <input
                  type="date"
                  value={filters.to ?? ""}
                  onChange={(event) => setFilter("to", event.target.value)}
                  aria-label="Hasta"
                  className={inputClass}
                />
              </div>
            </div>

            {review.isLoading && <p className="text-sm text-gray-500">Cargando diseños…</p>}
            {review.isError && (
              <p className="text-sm text-red-600">No se pudieron cargar los diseños.</p>
            )}
            {review.data && (
              <p className="text-xs text-gray-500">
                {review.data.total} diseño(s)
                {review.data.data.length === 0 ? "; ninguno coincide con los filtros." : ""}
              </p>
            )}

            <ul className="divide-y divide-gray-100">
              {(review.data?.data ?? []).map((row) => (
                <li key={row.id}>
                  <DesignRow
                    row={row}
                    selected={selectedId === row.id}
                    onSelect={() => setSelectedId(row.id)}
                  />
                </li>
              ))}
            </ul>

            {review.data && review.data.totalPages > 1 && (
              <Pagination
                currentPage={filters.page}
                totalPages={review.data.totalPages}
                onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
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

const DesignRow = ({
  row,
  selected,
  onSelect,
}: {
  row: BomReviewRow;
  selected: boolean;
  onSelect: () => void;
}) => {
  const norms = [...new Set(row.elements.map((element) => element.normName).filter(Boolean))];
  return (
    <button
      onClick={onSelect}
      className={`w-full space-y-1 px-2 py-2 text-left hover:bg-gray-50 ${selected ? "bg-blue-50" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium text-gray-900">{row.code}</span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[row.status]}`}>
          {STATUS_LABELS[row.status]}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        {norms.length > 0 ? norms.join(", ") : "Sin norma"}
        {row.country ? ` · ${row.country}` : ""}
      </div>
      <div className="font-mono text-xs text-gray-500">
        {row.elements.map((element) => element.sapReference || "sin referencia").join(" · ") ||
          "Sin elementos"}
      </div>
      {row.adjustment && (
        <div className="text-xs text-amber-700">
          Ajustada{row.adjustment.updatedBy ? ` por ${row.adjustment.updatedBy}` : ""} el{" "}
          {formatDate(row.adjustment.updatedAt)}
        </div>
      )}
    </button>
  );
};

/** La lista de un diseño: elemento, estructura, tabla y exportación. */
const DesignBom = ({ designId }: { designId: number }) => {
  const detail = useDesignDetail(designId);
  const adjustment = useBomAdjustment(designId);
  const [elementIndex, setElementIndex] = useState(0);

  if (detail.isLoading || adjustment.isLoading) {
    return <p className="text-sm text-gray-500">Cargando diseño…</p>;
  }
  if (detail.isError || !detail.data) {
    return <p className="text-sm text-red-600">No se pudo cargar el diseño.</p>;
  }
  if (adjustment.isError) {
    return <p className="text-sm text-red-600">No se pudieron cargar los ajustes del diseño.</p>;
  }
  if (adjustment.data) {
    return <AdjustedReview design={detail.data} adjustment={adjustment.data} />;
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

  const sheets = useMemo(() => designSheets(design), [design]);

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
          <Button variant="outline" size="sm" onClick={() =>
              downloadCsv(`lista-de-materiales-${design.code}-${bom.data!.code}`, visible)
            }>
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

const downloadCsv = (name: string, cells: Record<string, SavedCell>) => {
  const blob = new Blob([toCsv(cells)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`.replace(/[^\w.-]+/g, "_");
  link.click();
  URL.revokeObjectURL(url);
};

/** Las hojas del diseño, no las de costos: las mismas que usa el cliente. */
const designSheets = (design: DesignDetail): SavedSheet[] =>
  design.subDesigns
    .map((subDesign) => subDesign.data)
    .filter((data): data is SavedSheet => data !== null && typeof data === "object");

/**
 * La lista que ajustó el cliente frente a la generada ahora, en solo lectura.
 *
 * Se genera con el primer elemento del diseño y los mismos semielaborados
 * desplegados que el ajuste, que es como la generó el cliente. El aviso es el
 * mismo que ve él: la huella guardada frente a la de la lista generada ahora.
 */
const AdjustedReview = ({ design, adjustment }: { design: DesignDetail; adjustment: BomAdjustment }) => {
  const element = design.designElements[0]?.element;
  const reference = element?.sapReference?.trim() || null;
  const bom = useBomForReference(reference);
  const sheets = useMemo(() => designSheets(design), [design]);

  const generated = useMemo<Record<string, SavedCell> | null>(() => {
    if (!bom.data || !element) return null;
    try {
      return buildBomSummaryCells(bom.data, new Set(adjustment.expandedNodes), sheets, element);
    } catch {
      return null;
    }
  }, [bom.data, element, adjustment.expandedNodes, sheets]);

  const [fingerprintChanged, setFingerprintChanged] = useState<boolean | null>(null);
  useEffect(() => {
    if (!generated) return;
    let cancelled = false;
    bomFingerprint(generated).then((fingerprint) => {
      if (!cancelled) setFingerprintChanged(fingerprint !== adjustment.baseFingerprint);
    });
    return () => {
      cancelled = true;
    };
  }, [generated, adjustment.baseFingerprint]);

  const structureGone = bom.isSuccess && (bom.data === null || bom.data.id !== adjustment.bomId);
  const diff = useMemo(
    () => (generated ? diffBom(adjustment.cells, generated) : null),
    [adjustment.cells, generated],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4">
        <div className="space-y-1">
          <h2 className="font-mono text-lg font-semibold text-gray-900">{design.code}</h2>
          <p className="text-sm text-amber-800">
            Ajustada por el cliente
            {adjustment.updatedBy ? ` (${adjustment.updatedBy})` : ""} el{" "}
            {formatDate(adjustment.updatedAt)}
          </p>
          <p className="text-sm text-gray-600">
            Referencia ERP: <span className="font-mono">{reference ?? "—"}</span>
            {bom.data && (
              <>
                {" "}
                · Estructura <span className="font-mono">{bom.data.code}</span> ({bom.data.name})
              </>
            )}
          </p>
          {diff && (
            <p className="text-sm text-gray-600" aria-label="Resumen de cambios">
              {diff.counts.changed} fila(s) cambiada(s) · {diff.counts.added} añadida(s) ·{" "}
              {diff.counts.removed} quitada(s)
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCsv(`lista-de-materiales-${design.code}-ajustada`, adjustment.cells)}
          >
            <IconDownload className="mr-1 h-4 w-4" />
            Exportar ajustada
          </Button>
          {generated && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCsv(`lista-de-materiales-${design.code}-generada`, generated)}
            >
              <IconDownload className="mr-1 h-4 w-4" />
              Exportar generada
            </Button>
          )}
        </div>
      </div>

      {structureGone && (
        <Notice>
          La estructura BOM con la que se ajustó esta lista ya no corresponde a la referencia ERP
          del elemento.
        </Notice>
      )}
      {!structureGone && fingerprintChanged && (
        <Notice>
          La lista generada cambió desde que el cliente hizo estos ajustes (estructura BOM, hojas
          del diseño, accesorios o catálogo).
        </Notice>
      )}
      <p className="text-xs text-gray-500">
        Solo lectura: los ajustes son del diseñador. Verde, fila añadida; rojo, quitada; ámbar,
        cambiada, con la celda que cambió marcada.
      </p>

      <div className="grid gap-3 2xl:grid-cols-2">
        <DiffTable
          title="Ajustada por el cliente"
          rows={diff?.adjusted ?? plainRows(adjustment.cells)}
        />
        {diff ? (
          <DiffTable title="Generada ahora" rows={diff.generated} />
        ) : (
          bom.isLoading && <p className="text-sm text-gray-500">Generando la lista para comparar…</p>
        )}
      </div>
    </div>
  );
};

/** Sin lista generada con la que comparar: la ajustada, sin marcas. */
const plainRows = (cells: Record<string, SavedCell>): DiffRow[] =>
  diffBom(cells, cells).adjusted;

const ROW_STYLES: Record<DiffRow["status"], string> = {
  same: "",
  added: "bg-green-50",
  removed: "bg-red-50 line-through decoration-red-300",
  changed: "bg-amber-50",
};

const STATUS_TEXT: Record<DiffRow["status"], string> = {
  same: "",
  added: "añadida",
  removed: "quitada",
  changed: "cambiada",
};

const DiffTable = ({ title, rows }: { title: string; rows: DiffRow[] }) => (
  <section className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
    <h3 className="border-b border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800">{title}</h3>
    <table className="w-full text-xs" aria-label={title}>
      <thead className="bg-gray-50 text-left text-gray-600">
        <tr>
          {HEADERS.map((header) => (
            <th key={header} className="px-2 py-1 font-medium">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.row}
            data-status={row.status}
            title={STATUS_TEXT[row.status] || undefined}
            className={`border-t border-gray-100 ${ROW_STYLES[row.status]}`}
          >
            {row.values.map((value, index) => (
              <td
                key={index}
                data-changed={row.changedColumns.has(index) || undefined}
                className={`px-2 py-1 ${
                  row.changedColumns.has(index) ? "font-semibold ring-1 ring-inset ring-amber-400" : ""
                }`}
              >
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);

export default DesignBomPage;
