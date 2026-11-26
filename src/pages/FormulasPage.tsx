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
import { Modal } from "@components/ui/Modal";
import { nativeFieldClass } from "@components/ui/fieldClasses";
import {
  Badge,
  Button as UIButton,
  Card as UICard,
  Checkbox,
  EmptyState,
  FilterField,
  IconButton,
  Input as UIInput,
  Notice,
  Page,
  PageHeader,
  Pagination as UIPagination,
  RowIcon,
  TableCard,
  Tag,
} from "@rymel/ui";
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
    <Modal isOpen onClose={onCancel} title={`Dar de baja «${target.name}»`}>
      {impact.isLoading ? (
        <p className="text-sm text-gray-600">Midiendo el impacto…</p>
      ) : impact.data ? (
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            Está asignada a <strong>{impact.data.subTypeCount}</strong> subtipo(s)
            {impact.data.subTypeNames.length > 0 && `: ${impact.data.subTypeNames.join(", ")}`}.
          </p>
          <p>
            La usan <strong>{impact.data.subDesignCount}</strong> sub-diseño(s) en{" "}
            <strong>{impact.data.designCount}</strong> diseño(s).
          </p>
          <p className="text-gray-600">
            Dejará de ofrecerse en las hojas. Su historial y los valores ya calculados en los
            diseños se conservan.
          </p>
        </div>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isPending}>
          Dar de baja
        </Button>
      </div>
    </Modal>
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

  const clearFilters = () => {
    setSearch("");
    setType("");
    setSubTypeId("");
    setIncludeDeleted(false);
    setPage(1);
  };

  return (
    <Layout bare>
      <PageHeader
        eyebrow="Administración"
        title="Fórmulas"
        description={
          data && tab === "catalogo" ? (
            <>
              <strong>
                {data.total} {data.total === 1 ? "fórmula" : "fórmulas"}
              </strong>{" "}
              de diseño y de costo para las hojas de cálculo.
            </>
          ) : (
            "Las fórmulas de diseño y de costo que usan las hojas de cálculo."
          )
        }
        actions={
          tab === "catalogo" && (
            <UIButton
              variant="light"
              size="lg"
              icon={<IconPlus className="h-[18px] w-[18px]" />}
              onClick={() => setEditing(null)}
            >
              Nueva fórmula
            </UIButton>
          )
        }
      />

      <Page>
        <UICard padded={false} className="overflow-hidden">
          <div role="tablist" aria-label="Fórmulas" className="flex gap-1 overflow-x-auto border-b border-gray-200 px-5">
            {TABS.map((item) => {
              const selected = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setTab(item.id)}
                  className={`h-[60px] cursor-pointer whitespace-nowrap border-0 border-b-[3px] border-solid bg-transparent px-4 text-[15px] transition-colors ${
                    selected
                      ? "border-rymel-blue font-bold text-rymel-blue"
                      : "border-transparent font-semibold text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {tab === "catalogo" && (
            <div role="search" className="flex flex-wrap items-end gap-3 p-5">
              <FilterField label="Buscar" className="flex-[2_1_280px]">
                <UIInput
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  onClear={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  placeholder="Nombre o código…"
                  leftIcon={<IconSearch className="h-[18px] w-[18px]" />}
                />
              </FilterField>
              <FilterField label="Tipo">
                <select
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value as DesignFunctionType | "");
                    setPage(1);
                  }}
                  className={nativeFieldClass}
                >
                  <option value="">Todos los tipos</option>
                  <option value={DesignFunctionType.DESIGN}>Diseño</option>
                  <option value={DesignFunctionType.COST}>Costo</option>
                </select>
              </FilterField>
              <FilterField label="Subtipo">
                <select
                  value={subTypeId}
                  onChange={(event) => {
                    setSubTypeId(event.target.value === "" ? "" : Number(event.target.value));
                    setPage(1);
                  }}
                  className={nativeFieldClass}
                >
                  <option value="">Todos los subtipos</option>
                  {(subTypes.data ?? []).map((subType) => (
                    <option key={subType.id} value={subType.id}>
                      {subTypeLabel(subType)}
                    </option>
                  ))}
                </select>
              </FilterField>
              <div className="flex h-[46px] items-center">
                <Checkbox
                  label="Incluir dadas de baja"
                  checked={includeDeleted}
                  onCheckedChange={(checked) => {
                    setIncludeDeleted(checked);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          )}
        </UICard>

        {tab === "desactualizados" ? (
          <StaleSubDesignsPanel />
        ) : (
          <>
            {/* Conflictos heredados: se muestran una vez, arriba */}
            {data && data.codeConflicts.length > 0 && (
              <Notice tone="warning" title="Hay códigos que chocan entre sí">
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {data.codeConflicts.map((conflict, index) => (
                    <li key={index}>{conflict}</li>
                  ))}
                </ul>
                <span className="mt-2 block">
                  Una hoja con ambas no puede distinguir a cuál se invoca. Vienen de antes de que
                  existiera esta validación; decidir cuál se renombra es una decisión de negocio.
                </span>
              </Notice>
            )}

            {query.isLoading ? (
              <p className="text-sm text-gray-600">Cargando…</p>
            ) : data && data.items.length === 0 ? (
              <EmptyState
                title="Ninguna fórmula coincide con los filtros."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <TableCard
                aria-label="Fórmulas"
                footer={
                  totalPages > 1 ? (
                    <UIPagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={setPage}
                      totalItems={data?.total}
                      pageSize={LIMIT}
                    />
                  ) : undefined
                }
              >
                <table className="rm-table">
                  <thead>
                    <tr>
                      <th>Fórmula</th>
                      <th>Tipo</th>
                      <th>Variables</th>
                      <th>Versión</th>
                      <th data-align="right">Subtipos</th>
                      <th>
                        <span className="sr-only">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.items ?? []).map((item) => (
                      <tr key={item.id} className={item.deleted ? "opacity-60" : ""}>
                        <td>
                          <div className="flex items-center gap-3.5">
                            <RowIcon>
                              <IconMathFunction className="h-[18px] w-[18px]" />
                            </RowIcon>
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <span className="font-bold text-gray-900">{item.name}</span>
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[12.5px] text-gray-600">{item.code}</span>
                                {item.codeConflict && (
                                  <span title={item.codeConflict}>
                                    <Badge tone="warning" icon={<IconAlertTriangle className="h-3.5 w-3.5" />}>
                                      choca
                                    </Badge>
                                  </span>
                                )}
                                {item.deleted && <Badge>Dada de baja</Badge>}
                              </span>
                              {item.description && (
                                <span className="max-w-md truncate text-[13px] text-gray-600">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge tone={item.type === "DESIGN" ? "brand" : "neutral"} dot>
                            {item.type === "DESIGN" ? "Diseño" : "Costo"}
                          </Badge>
                        </td>
                        <td className="font-mono text-[12.5px] text-gray-600">{item.variables || "—"}</td>
                        <td className="whitespace-nowrap">
                          <Tag mono>v{item.version}</Tag>
                          {item.versionCount > 1 && (
                            <span className="ml-1.5 text-[13px] text-gray-600">de {item.versionCount}</span>
                          )}
                        </td>
                        <td data-align="right" className="font-semibold tabular-nums">
                          {item.subTypeCount}
                        </td>
                        <td data-align="right">
                          <div className="flex justify-end gap-2">
                            <IconButton label="Historial de versiones" onClick={() => setVersionsOf(item)}>
                              <IconHistory className="h-[18px] w-[18px]" />
                            </IconButton>
                            {item.deleted ? (
                              <IconButton label="Restablecer" onClick={() => undelete.mutate(item.id)}>
                                <IconArrowBackUp className="h-[18px] w-[18px]" />
                              </IconButton>
                            ) : (
                              <>
                                <IconButton label="Editar" onClick={() => setEditing(item.id)}>
                                  <IconPencil className="h-[18px] w-[18px]" />
                                </IconButton>
                                <IconButton label="Dar de baja" tone="danger" onClick={() => setDeleting(item)}>
                                  <IconTrash className="h-[18px] w-[18px]" />
                                </IconButton>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
            )}
          </>
        )}
      </Page>

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
