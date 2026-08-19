import { useState } from "react";
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconHistory,
  IconMathFunction,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { Layout } from "@components/Layout";
import { subTypeLabel } from "@services/designFunctionService";
import { Button } from "@components/ui/Button";
import { Pagination } from "@components/ui/Pagination";
import { FormulaEditorModal } from "@components/formula/FormulaEditorModal";
import { FormulaVersionsModal } from "@components/formula/FormulaVersionsModal";
import { StaleSubDesignsPanel } from "@components/formula/StaleSubDesignsPanel";
import {
  useDesignFunctionImpact,
  useDesignFunctions,
  useDesignSubTypes,
  useRemoveDesignFunction,
  useUndeleteDesignFunction,
} from "@hooks/useDesignFunctions";
import {
  DesignFunctionType,
  type DesignFunctionListItem,
} from "@/types/designFunction.types";

const TABS = [
  { id: "catalogo", label: "Catálogo" },
  { id: "desactualizados", label: "Diseños desactualizados" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const LIMIT = 20;

/** Diálogo de baja: muestra el impacto antes de pedir confirmación. */
const DeleteDialog = ({
  target,
  onCancel,
  onConfirm,
  isPending,
}: {
  target: DesignFunctionListItem;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) => {
  const impact = useDesignFunctionImpact(target.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900">
          Dar de baja «{target.name}»
        </h3>

        {impact.isLoading ? (
          <p className="mt-3 text-sm text-gray-500">Midiendo el impacto…</p>
        ) : impact.data ? (
          <div className="mt-3 space-y-2 text-sm text-gray-700">
            <p>
              Está asignada a <strong>{impact.data.subTypeCount}</strong>{" "}
              subtipo(s)
              {impact.data.subTypeNames.length > 0 &&
                `: ${impact.data.subTypeNames.join(", ")}`}
              .
            </p>
            <p>
              La usan <strong>{impact.data.subDesignCount}</strong> sub-diseño(s)
              en <strong>{impact.data.designCount}</strong> diseño(s).
            </p>
            <p className="text-gray-600">
              Dejará de ofrecerse en las hojas. Su historial y los valores ya
              calculados en los diseños se conservan.
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={onConfirm}
            isLoading={isPending}
          >
            Dar de baja
          </Button>
        </div>
      </div>
    </div>
  );
};

export const FormulasPage = () => {
  const [tab, setTab] = useState<TabId>("catalogo");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<DesignFunctionType | "">("");
  const [subTypeId, setSubTypeId] = useState<number | "">("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [editing, setEditing] = useState<number | null | undefined>(undefined);
  const [versionsOf, setVersionsOf] = useState<DesignFunctionListItem | null>(
    null
  );
  const [deleting, setDeleting] = useState<DesignFunctionListItem | null>(null);

  const subTypes = useDesignSubTypes();
  const remove = useRemoveDesignFunction();
  const undelete = useUndeleteDesignFunction();

  const query = useDesignFunctions({
    page,
    limit: LIMIT,
    search: search.trim() || undefined,
    type: type || undefined,
    designSubTypeId: subTypeId === "" ? undefined : subTypeId,
    includeDeleted,
  });

  const data = query.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
              <IconMathFunction className="h-8 w-8 text-rymel-blue" />
              Fórmulas
            </h1>
            <p className="mt-1 text-gray-600">
              Administra las fórmulas de diseño y de costo que usan las hojas de
              cálculo
            </p>
          </div>
          {tab === "catalogo" && (
            <Button onClick={() => setEditing(null)}>
              <IconPlus className="mr-1 h-4 w-4" />
              Nueva fórmula
            </Button>
          )}
        </div>

        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === item.id
                  ? "border-b-2 border-rymel-blue text-rymel-blue"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "desactualizados" ? (
          <StaleSubDesignsPanel />
        ) : (
          <>
            {/* Conflictos heredados: se muestran una vez, arriba */}
            {data && data.codeConflicts.length > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
                <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium">
                    Hay códigos que chocan entre sí
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {data.codeConflicts.map((conflict, index) => (
                      <li key={index}>{conflict}</li>
                    ))}
                  </ul>
                  <p className="mt-2">
                    Una hoja con ambas no puede distinguir a cuál se invoca.
                    Vienen de antes de que existiera esta validación; decidir
                    cuál se renombra es una decisión de negocio.
                  </p>
                </div>
              </div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-64 flex-1">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar por nombre o código…"
                  className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm focus:border-rymel-blue focus:outline-none"
                />
              </div>

              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value as DesignFunctionType | "");
                  setPage(1);
                }}
                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-rymel-blue focus:outline-none"
              >
                <option value="">Todos los tipos</option>
                <option value={DesignFunctionType.DESIGN}>Diseño</option>
                <option value={DesignFunctionType.COST}>Costo</option>
              </select>

              <select
                value={subTypeId}
                onChange={(event) => {
                  setSubTypeId(
                    event.target.value === "" ? "" : Number(event.target.value)
                  );
                  setPage(1);
                }}
                className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-rymel-blue focus:outline-none"
              >
                <option value="">Todos los subtipos</option>
                {(subTypes.data ?? []).map((subType) => (
                  <option key={subType.id} value={subType.id}>
                    {subTypeLabel(subType)}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={() => {
                    setIncludeDeleted(!includeDeleted);
                    setPage(1);
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Incluir dadas de baja
              </label>
            </div>

            {/* Listado */}
            {query.isLoading ? (
              <p className="text-sm text-gray-500">Cargando…</p>
            ) : data && data.items.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
                <p className="text-gray-600">
                  Ninguna fórmula coincide con los filtros.
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setSearch("");
                    setType("");
                    setSubTypeId("");
                    setIncludeDeleted(false);
                    setPage(1);
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Variables</th>
                      <th className="px-4 py-3">Versión</th>
                      <th className="px-4 py-3">Subtipos</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data?.items ?? []).map((item) => (
                      <tr
                        key={item.id}
                        className={item.deleted ? "bg-gray-50 opacity-60" : ""}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="max-w-md truncate text-xs text-gray-500">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-gray-800">
                            {item.code}
                          </span>
                          {item.codeConflict && (
                            <span
                              className="ml-2 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800"
                              title={item.codeConflict}
                            >
                              <IconAlertTriangle className="mr-1 h-3 w-3" />
                              choca
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.type === "DESIGN" ? "Diseño" : "Costo"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {item.variables || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          v{item.version}
                          {item.versionCount > 1 && (
                            <span className="ml-1 text-xs text-gray-400">
                              de {item.versionCount}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {item.subTypeCount}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => setVersionsOf(item)}
                              className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                              title="Historial de versiones"
                            >
                              <IconHistory className="h-4 w-4" />
                            </button>
                            {item.deleted ? (
                              <button
                                onClick={() => undelete.mutate(item.id)}
                                className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                                title="Restablecer"
                              >
                                <IconArrowBackUp className="h-4 w-4" />
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setEditing(item.id)}
                                  className="rounded p-1.5 text-rymel-blue hover:bg-blue-50"
                                  title="Editar"
                                >
                                  <IconPencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setDeleting(item)}
                                  className="rounded p-1.5 text-red-500 hover:bg-red-50"
                                  title="Dar de baja"
                                >
                                  <IconTrash className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      <FormulaEditorModal
        isOpen={editing !== undefined}
        functionId={editing ?? null}
        onClose={() => setEditing(undefined)}
      />

      <FormulaVersionsModal
        isOpen={versionsOf !== null}
        functionId={versionsOf?.id ?? null}
        functionName={versionsOf?.name ?? ""}
        onClose={() => setVersionsOf(null)}
      />

      {deleting && (
        <DeleteDialog
          target={deleting}
          isPending={remove.isPending}
          onCancel={() => setDeleting(null)}
          onConfirm={() =>
            remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
          }
        />
      )}
    </Layout>
  );
};
