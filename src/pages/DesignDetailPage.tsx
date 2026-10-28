import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconDownload,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import { parseElementValues, type BomSummaryCell } from "@rymel/design-template";
import { Layout } from "@components/Layout";
import { Button } from "@components/ui/Button";
import { Modal } from "@components/ui/Modal";
import { ReadOnlySheet } from "@components/design/ReadOnlySheet";
import { downloadDesignWorkbook } from "@components/design/exportDesign";
import { BOM_SHEET_NAME, useDesignBom } from "@components/design/useDesignBom";
import {
  useDeactivateDesign,
  useDesignDetail,
  useDesignVersions,
  useRecalculateDesign,
} from "@hooks/useDesigns";
import type {
  DesignDetail,
  DesignElement,
  RecalculationReport,
  SavedSheet,
  SubDesignVersions,
} from "@/types/design.types";

/**
 * Un diseño del cliente, en solo lectura, con todo lo que se sabe de él: sus
 * elementos, sus hojas y las de costos, con qué versión de cada fórmula se
 * calculó y la lista de materiales que ve el cliente. Desde aquí se exporta,
 * se recalcula si está desactualizado y se desactiva.
 */

type Tab = "summary" | "sheets" | "costs" | "bom";

const TABS: { id: Tab; label: string }[] = [
  { id: "summary", label: "Resumen" },
  { id: "sheets", label: "Hojas de diseño" },
  { id: "costs", label: "Costos" },
  { id: "bom", label: "Lista de materiales" },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });

export const DesignDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const designId = Number(id);
  const detail = useDesignDetail(designId);

  return (
    <Layout>
      {detail.isLoading && <p className="text-sm text-gray-500">Cargando diseño…</p>}
      {detail.isError && <p className="text-sm text-red-600">No se pudo cargar el diseño.</p>}
      {detail.data && <DesignView design={detail.data} />}
    </Layout>
  );
};

const DesignView = ({ design }: { design: DesignDetail }) => {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("summary");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const versions = useDesignVersions(design.id);
  const bom = useDesignBom(design);
  const deactivate = useDeactivateDesign();
  const stale = (versions.data ?? []).some((sheet) => sheet.stale);

  const exportWorkbook = async () => {
    setExporting(true);
    try {
      const bomSheet = bom.state.status === "ready" ? { name: BOM_SHEET_NAME, sheet: bom.state.sheet } : null;
      await downloadDesignWorkbook(design, bomSheet);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            onClick={() => navigate("/designs")}
            className="mb-1 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
          >
            <IconArrowLeft className="h-4 w-4" /> Diseños
          </button>
          <h1 className="font-mono text-2xl font-bold text-gray-900">{design.code}</h1>
          <p className="text-sm text-gray-500">
            {design.name} · {design.designSubType?.designType?.name ?? "—"} ·{" "}
            {design.designSubType?.name ?? "—"} · creado {formatDate(design.createdAt)} · actualizado{" "}
            {formatDate(design.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportWorkbook} disabled={exporting}>
            <IconDownload className="mr-1 h-4 w-4" />
            {exporting ? "Exportando…" : "Exportar a Excel"}
          </Button>
          {stale && (
            <Button variant="outline" size="sm" onClick={() => setRecalculating(true)}>
              <IconRefresh className="mr-1 h-4 w-4" />
              Recalcular
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setConfirmDeactivate(true)}>
            <IconTrash className="mr-1 h-4 w-4" />
            Desactivar
          </Button>
        </div>
      </div>

      {stale && (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          <IconAlertTriangle className="h-4 w-4 shrink-0" />
          Alguna hoja se calculó con una versión de fórmula que ya no es la vigente.
        </p>
      )}

      <div role="tablist" className="flex gap-1 border-b border-gray-200">
        {TABS.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              tab === item.id
                ? "border-rymel-blue font-medium text-rymel-blue"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "summary" && <Summary design={design} versions={versions.data} />}
      {tab === "sheets" && (
        <SheetPicker sheets={design.subDesigns.map((subDesign) => subDesign.data)} empty="El diseño no tiene hojas." />
      )}
      {tab === "costs" && (
        <SheetPicker
          sheets={(design.cost?.subCosts ?? []).map((subCost) => subCost.data)}
          empty="El diseño no tiene hojas de costos."
        />
      )}
      {tab === "bom" && <BomView bom={bom} />}

      <Modal isOpen={confirmDeactivate} onClose={() => setConfirmDeactivate(false)} title="¿Desactivar el diseño?">
        <p className="text-sm text-gray-700">
          <span className="font-mono">{design.code}</span> dejará de aparecer en el admin y en el
          cliente. Sus hojas y su lista de materiales ajustada quedan borradas lógicamente.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmDeactivate(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            disabled={deactivate.isPending}
            onClick={() =>
              deactivate.mutate(design.id, {
                onSuccess: () => {
                  setConfirmDeactivate(false);
                  navigate("/designs");
                },
              })
            }
          >
            Desactivar
          </Button>
        </div>
      </Modal>

      {recalculating && (
        <RecalculateModal
          designId={design.id}
          sheets={versions.data ?? []}
          onClose={() => setRecalculating(false)}
        />
      )}
    </div>
  );
};

const Summary = ({ design, versions }: { design: DesignDetail; versions?: SubDesignVersions[] }) => (
  <div className="space-y-4">
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-800">Elementos</h2>
      {design.designElements.length === 0 && <p className="text-sm text-gray-500">Sin elementos.</p>}
      {design.designElements.map(({ id, element }) => (
        <ElementCard key={id} element={element} />
      ))}
    </section>

    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-800">Versiones de fórmulas</h2>
      {!versions && <p className="text-sm text-gray-500">Cargando…</p>}
      {versions?.map((sheet) => (
        <div key={sheet.subDesignId} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-gray-800">
            {sheet.name}
            {sheet.stale ? (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">Desactualizada</span>
            ) : (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700">Al día</span>
            )}
          </div>
          {sheet.functions.length === 0 ? (
            <p className="text-xs text-gray-500">No usa fórmulas de diseño.</p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
              {sheet.functions.map((fn) => (
                <li key={fn.functionId}>
                  <span className="font-mono">{fn.code ?? `#${fn.functionId}`}</span>
                  {fn.name && fn.name !== fn.code ? ` (${fn.name})` : ""} · calculada con v
                  {fn.usedVersion ?? "?"} · vigente v{fn.currentVersion ?? "?"}
                  {fn.usedVersion !== fn.currentVersion && (
                    <span className="ml-1 text-red-700">— no es la vigente</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  </div>
);

/** Un valor de la norma, legible: texto tal cual, el resto como JSON corto. */
const readable = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
};

/** Los accesorios de la norma: arreglo, o texto JSON según de dónde venga. */
const parseAccessories = (raw: unknown): Record<string, unknown>[] => {
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [];
};

const ElementCard = ({ element }: { element: DesignElement }) => {
  const fields = useMemo(() => parseElementValues(element.values), [element.values]);
  const accessories = useMemo(
    () => parseAccessories(fields.find((field) => field.key === "accesories")?.value),
    [fields],
  );
  const characteristics = fields.filter((field) => field.key !== "accesories");

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
      <div className="text-sm">
        <span className="font-mono font-medium text-gray-900">{element.sapReference || "Sin referencia ERP"}</span>
        <span className="text-gray-500">
          {" "}
          · {element.norm?.name ?? "sin norma"}
          {element.norm?.country ? ` · ${element.norm.country.name}` : ""}
        </span>
      </div>
      <dl className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2 lg:grid-cols-3">
        {characteristics.map((field, index) => (
          <div key={`${String(field.key)}-${index}`} className="flex gap-2">
            <dt className="text-gray-500">{readable(field.name ?? field.key)}</dt>
            <dd className="font-medium text-gray-800">{readable(field.value)}</dd>
          </div>
        ))}
      </dl>
      {accessories.length > 0 && (
        <table className="w-full text-xs" aria-label="Accesorios">
          <thead className="text-left text-gray-500">
            <tr>
              <th className="py-1">Accesorio</th>
              <th>Referencia</th>
              <th>Cantidad</th>
              <th>U.M.</th>
              <th>Semielaborado</th>
            </tr>
          </thead>
          <tbody>
            {accessories.map((accessory, index) => (
              <tr key={index} className="border-t border-gray-100">
                <td className="py-1">{readable(accessory.description)}</td>
                <td className="font-mono">{readable(accessory.reference)}</td>
                <td>{readable(accessory.value)}</td>
                <td>{readable(accessory.unitOfMeasurement ?? accessory.unitMeasurement)}</td>
                <td>{readable((accessory.semiFinished as { name?: string } | undefined)?.name)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const SheetPicker = ({ sheets, empty }: { sheets: SavedSheet[]; empty: string }) => {
  const valid = sheets.filter((sheet) => sheet && typeof sheet === "object");
  const [index, setIndex] = useState(0);
  if (valid.length === 0) return <p className="text-sm text-gray-500">{empty}</p>;
  const current = valid[Math.min(index, valid.length - 1)]!;
  return (
    <div className="space-y-2">
      {valid.length > 1 && (
        <div className="flex flex-wrap gap-1" aria-label="Hojas">
          {valid.map((sheet, i) => (
            <button
              key={`${sheet.name}-${i}`}
              onClick={() => setIndex(i)}
              className={`rounded px-2 py-1 text-xs ${
                i === index ? "bg-rymel-blue text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}
      <ReadOnlySheet key={`${current.name}-${index}`} saved={current} />
    </div>
  );
};

const BomView = ({ bom }: { bom: ReturnType<typeof useDesignBom> }) => {
  const { state, toggle } = bom;
  // Qué celda despliega qué semielaborado hijo, en la lista generada
  const toggles = useMemo(() => {
    if (state.status !== "ready" || state.adjustment) return new Map<string, number>();
    return new Map(
      Object.entries(state.sheet.cells as Record<string, BomSummaryCell>)
        .filter(([, cell]) => cell.bomToggleNodeId !== undefined)
        .map(([ref, cell]) => [ref, cell.bomToggleNodeId!]),
    );
  }, [state]);

  if (state.status === "loading") return <p className="text-sm text-gray-500">Cargando la lista de materiales…</p>;
  if (state.status !== "ready") {
    return (
      <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        {state.message}
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        {state.adjustment ? (
          <span className="text-amber-800">
            Ajustada por el cliente{state.adjustment.updatedBy ? ` (${state.adjustment.updatedBy})` : ""} el{" "}
            {formatDate(state.adjustment.updatedAt)}. Es la que ve el cliente; no se modifica desde el admin.
          </span>
        ) : (
          <>Generada desde la plantilla, los accesorios de la norma y la estructura BOM, como la ve el cliente.</>
        )}
        {state.structure && (
          <>
            {" "}
            Estructura <span className="font-mono">{state.structure.code}</span> ({state.structure.name}).
          </>
        )}
      </p>
      {state.adjustment && state.changedSinceAdjustment && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          La lista generada cambió desde que el cliente hizo estos ajustes (estructura BOM, hojas del
          diseño, accesorios o catálogo).
        </p>
      )}
      <ReadOnlySheet
        saved={state.sheet}
        onCellClick={(ref) => {
          const nodeId = toggles.get(ref);
          if (nodeId === undefined) return false;
          toggle(nodeId);
          return true;
        }}
      />
    </div>
  );
};

const OUTCOME_LABELS: Record<RecalculationReport["outcomes"][number]["status"], string> = {
  recalculado: "Se recalcula",
  "sin-cambios": "Sin cambios de valor",
  omitido: "Se omite",
  fallido: "Falla",
};

/**
 * Recalcular reescribe números que alguien ya vio, así que primero se simula
 * y solo después se ofrece aplicar.
 */
const RecalculateModal = ({
  designId,
  sheets,
  onClose,
}: {
  designId: number;
  sheets: SubDesignVersions[];
  onClose: () => void;
}) => {
  const recalculate = useRecalculateDesign(designId);
  const [simulation, setSimulation] = useState<RecalculationReport | null>(null);
  const [applied, setApplied] = useState<RecalculationReport | null>(null);
  const nameOf = (id: number) => sheets.find((sheet) => sheet.subDesignId === id)?.name ?? `Hoja ${id}`;
  const report = applied ?? simulation;

  return (
    <Modal isOpen onClose={onClose} title="Recalcular el diseño" maxWidth="lg">
      <div className="space-y-3 text-sm">
        {!report && (
          <p className="text-gray-700">
            Se recalcularán las hojas desactualizadas con las versiones vigentes de sus fórmulas.
            Primero simula para ver qué cambiaría; la simulación no escribe nada.
          </p>
        )}
        {report && (
          <>
            <p className="font-medium text-gray-800">
              {applied ? "Recalculado." : "Simulación: así quedaría."} {report.recalculated} con cambios ·{" "}
              {report.unchanged} sin cambios · {report.skipped} omitidas · {report.failed} con error
            </p>
            <ul className="max-h-64 space-y-2 overflow-y-auto" aria-label="Resultado por hoja">
              {report.outcomes.map((outcome) => (
                <li key={outcome.subDesignId} className="rounded border border-gray-200 p-2">
                  <div className="font-medium">
                    {nameOf(outcome.subDesignId)} · {OUTCOME_LABELS[outcome.status]}
                  </div>
                  {outcome.reason && <div className="text-xs text-red-700">{outcome.reason}</div>}
                  {outcome.changedCells.length > 0 && (
                    <ul className="mt-1 font-mono text-xs text-gray-600">
                      {outcome.changedCells.slice(0, 20).map((change) => (
                        <li key={change.ref}>
                          {change.ref}: {String(change.before)} → {String(change.after)}
                        </li>
                      ))}
                      {outcome.changedCells.length > 20 && <li>… y {outcome.changedCells.length - 20} más</li>}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {applied ? "Cerrar" : "Cancelar"}
          </Button>
          {!applied && (
            <Button
              variant="outline"
              disabled={recalculate.isPending}
              onClick={() => recalculate.mutate(true, { onSuccess: setSimulation })}
            >
              {simulation ? "Volver a simular" : "Simular"}
            </Button>
          )}
          {simulation && !applied && (
            <Button
              disabled={recalculate.isPending}
              onClick={() => recalculate.mutate(false, { onSuccess: setApplied })}
            >
              Aplicar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DesignDetailPage;
