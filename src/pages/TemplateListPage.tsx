import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  IconAlertTriangle,
  IconCopy,
  IconFileSpreadsheet,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { Layout } from "@components/Layout";
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
import {
  TemplateFormModal,
  type TemplateFormValues,
} from "@components/template/TemplateFormModal";
import { subTypeLabel } from "@services/designFunctionService";
import { useDesignSubTypes } from "@hooks/useDesignFunctions";
import {
  useCreateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  usePublishTemplate,
  useTemplates,
} from "@hooks/useTemplates";
import {
  TemplateStatus,
  TemplateType,
  type TemplateListItem,
} from "@/types/template.types";

const LIMIT = 20;

const STATUS_LABEL: Record<TemplateStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicada",
};

const StatusBadge = ({ status }: { status: TemplateStatus }) => (
  <Badge tone={status === TemplateStatus.PUBLISHED ? "success" : "neutral"} dot>
    {STATUS_LABEL[status]}
  </Badge>
);

/** Diálogo de baja. La plantilla deja de ofrecerse y su código queda libre. */
const DeleteDialog = ({
  target,
  onCancel,
  onConfirm,
  isPending,
}: {
  target: TemplateListItem;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) => (
  <Modal isOpen onClose={onCancel} title={`Dar de baja «${target.name}»`}>
    <div className="space-y-3 text-sm text-gray-700">
      {target.status === TemplateStatus.PUBLISHED && (
        <Notice tone="warning">
          Está publicada: los diseñadores dejarán de verla en la biblioteca.
        </Notice>
      )}
      <p>
        Su código <span className="font-mono">{target.code}</span> queda libre para otra plantilla.
        Los diseños ya guardados no cambian, porque cada uno lleva dentro su copia de las hojas.
      </p>
    </div>
    <div className="mt-6 flex justify-end gap-2">
      <Button variant="outline" onClick={onCancel} disabled={isPending}>
        Cancelar
      </Button>
      <Button variant="danger" onClick={onConfirm} disabled={isPending}>
        {isPending ? "Dando de baja…" : "Dar de baja"}
      </Button>
    </div>
  </Modal>
);

/**
 * Listado de plantillas de diseño.
 *
 * Las columnas de hojas y celdas no son adorno: son lo que distingue una
 * plantilla terminada de una vacía sin abrirla. Tres de las cuatro plantillas
 * que había en producción no tenían una sola hoja y se ofrecían a los
 * diseñadores como si sirvieran; nadie lo notó porque nada lo mostraba.
 */
export const TemplateListPage = () => {
  const [, navigate] = useLocation();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TemplateType | "">("");
  const [status, setStatus] = useState<TemplateStatus | "">("");
  const [subTypeId, setSubTypeId] = useState<number | "">("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [form, setForm] = useState<{
    mode: "create" | "edit" | "duplicate";
    template?: TemplateListItem;
  } | null>(null);
  const [deleting, setDeleting] = useState<TemplateListItem | null>(null);

  const subTypes = useDesignSubTypes();
  const query = useTemplates({
    page,
    limit: LIMIT,
    search: search.trim() || undefined,
    type: type || undefined,
    status: status || undefined,
    designSubTypeId: subTypeId === "" ? undefined : subTypeId,
    includeDeleted,
  });

  const create = useCreateTemplate();
  const duplicate = useDuplicateTemplate();
  const publish = usePublishTemplate();
  const remove = useDeleteTemplate();

  const data = query.data;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;

  const clearFilters = () => {
    setSearch("");
    setType("");
    setStatus("");
    setSubTypeId("");
    setIncludeDeleted(false);
    setPage(1);
  };

  const submitForm = (values: TemplateFormValues) => {
    if (form?.mode === "duplicate" && form.template) {
      duplicate.mutate(
        {
          id: form.template.id,
          dto: {
            code: values.code,
            name: values.name,
            designSubTypeId: values.designSubTypeId,
          },
        },
        {
          onSuccess: (template) => {
            setForm(null);
            navigate(`/templates/${template.id}`);
          },
        },
      );
      return;
    }

    create.mutate(values, {
      onSuccess: (template) => {
        setForm(null);
        navigate(`/templates/${template.id}`);
      },
    });
  };

  return (
    <Layout bare>
      <PageHeader
        eyebrow="Administración"
        title="Plantillas"
        description={
          data ? (
            <>
              <strong>
                {data.total} {data.total === 1 ? "plantilla" : "plantillas"}
              </strong>
              . La base sobre la que calculan los diseñadores; solo las publicadas llegan a la
              biblioteca.
            </>
          ) : (
            "La base sobre la que calculan los diseñadores. Solo las publicadas llegan a la biblioteca."
          )
        }
        actions={
          <UIButton
            variant="light"
            size="lg"
            icon={<IconPlus className="h-[18px] w-[18px]" />}
            onClick={() => setForm({ mode: "create" })}
          >
            Nueva plantilla
          </UIButton>
        }
      />

      <Page>
        <UICard as="div" role="search" className="flex flex-wrap items-end gap-3">
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
          <FilterField label="Estado">
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as TemplateStatus | "");
                setPage(1);
              }}
              className={nativeFieldClass}
            >
              <option value="">Todos los estados</option>
              <option value={TemplateStatus.PUBLISHED}>Publicadas</option>
              <option value={TemplateStatus.DRAFT}>Borradores</option>
            </select>
          </FilterField>
          <FilterField label="Tipo">
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value as TemplateType | "");
                setPage(1);
              }}
              className={nativeFieldClass}
            >
              <option value="">Todos los tipos</option>
              <option value={TemplateType.DESIGN}>Diseño</option>
              <option value={TemplateType.COST}>Costo</option>
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
        </UICard>

        {query.isLoading ? (
          <p className="text-sm text-gray-600">Cargando…</p>
        ) : data && data.items.length === 0 ? (
          <EmptyState
            title="Ninguna plantilla coincide con los filtros."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            }
          />
        ) : (
          <TableCard
            aria-label="Plantillas"
            minWidth={1040}
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
                  <th>Plantilla</th>
                  <th>Tipo</th>
                  <th>Subtipo</th>
                  <th>Estado</th>
                  <th data-align="right">Versión</th>
                  <th data-align="right">Hojas</th>
                  <th data-align="right">Celdas</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(data?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-start gap-3.5">
                        <RowIcon>
                          <IconFileSpreadsheet className="h-[18px] w-[18px]" />
                        </RowIcon>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <Link
                            href={`/templates/${item.id}`}
                            className="font-bold text-gray-900 no-underline hover:text-rymel-indigo"
                          >
                            {item.name}
                          </Link>
                          <span className="font-mono text-[12.5px] text-gray-600">{item.code}</span>
                          {item.description && (
                            <span className="text-[13px] text-gray-600">{item.description}</span>
                          )}
                          {/* Una plantilla vacía no tiene nada que cargar: se dice
                              aquí para que no haga falta abrirla para saberlo. */}
                          {(item.sheetCount === 0 || item.hasDraft) && (
                            <span className="mt-1 flex flex-wrap gap-1.5">
                              {item.sheetCount === 0 && (
                                <Badge tone="warning" icon={<IconAlertTriangle className="h-3.5 w-3.5" />}>
                                  Sin hojas: no tiene contenido que cargar
                                </Badge>
                              )}
                              {item.hasDraft && <Badge tone="brand">Tiene cambios sin publicar</Badge>}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone={item.type === TemplateType.COST ? "neutral" : "brand"} dot>
                        {item.type === TemplateType.COST ? "Costo" : "Diseño"}
                      </Badge>
                    </td>
                    <td className="text-gray-600">{item.designSubTypeName ?? "—"}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td data-align="right" className="tabular-nums">
                      <Tag mono>v{item.version}</Tag>
                    </td>
                    <td
                      data-align="right"
                      className={`font-semibold tabular-nums ${item.sheetCount === 0 ? "text-warning" : ""}`}
                    >
                      {item.sheetCount}
                    </td>
                    <td data-align="right" className="font-semibold tabular-nums">
                      {item.cellCount.toLocaleString("es")}
                    </td>
                    <td data-align="right">
                      <div className="flex justify-end gap-2">
                        <IconButton label="Editar" onClick={() => navigate(`/templates/${item.id}`)}>
                          <IconPencil className="h-[18px] w-[18px]" />
                        </IconButton>
                        <IconButton
                          label="Duplicar"
                          onClick={() => setForm({ mode: "duplicate", template: item })}
                        >
                          <IconCopy className="h-[18px] w-[18px]" />
                        </IconButton>
                        <IconButton
                          label={item.hasDraft ? "Publicar los cambios" : "No hay cambios que publicar"}
                          disabled={!item.hasDraft || publish.isPending}
                          onClick={() => publish.mutate({ id: item.id, dto: {} })}
                        >
                          <IconUpload className="h-[18px] w-[18px]" />
                        </IconButton>
                        <IconButton label="Dar de baja" tone="danger" onClick={() => setDeleting(item)}>
                          <IconTrash className="h-[18px] w-[18px]" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}
      </Page>

      {form && (
        <TemplateFormModal
          mode={form.mode}
          template={form.template}
          onCancel={() => setForm(null)}
          onSubmit={submitForm}
          isPending={create.isPending || duplicate.isPending}
        />
      )}

      {deleting && (
        <DeleteDialog
          target={deleting}
          onCancel={() => setDeleting(null)}
          isPending={remove.isPending}
          onConfirm={() =>
            remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
          }
        />
      )}
    </Layout>
  );
};

export default TemplateListPage;
