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
import { Pagination } from "@components/ui/Pagination";
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
  <span
    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
      status === TemplateStatus.PUBLISHED
        ? "bg-green-100 text-green-800"
        : "bg-gray-100 text-gray-700"
    }`}
  >
    {STATUS_LABEL[status]}
  </span>
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
      <h3 className="text-lg font-bold text-gray-900">
        Dar de baja «{target.name}»
      </h3>
      <div className="mt-3 space-y-2 text-sm text-gray-700">
        {target.status === TemplateStatus.PUBLISHED && (
          <p className="rounded-md bg-amber-50 p-3 text-amber-900">
            Está publicada: los diseñadores dejarán de verla en la biblioteca.
          </p>
        )}
        <p>
          Su código <span className="font-mono">{target.code}</span> queda libre
          para otra plantilla. Los diseños ya guardados no cambian, porque cada
          uno lleva dentro su copia de las hojas.
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isPending}
          className="bg-red-600 hover:bg-red-700"
        >
          {isPending ? "Dando de baja…" : "Dar de baja"}
        </Button>
      </div>
    </div>
  </div>
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
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
              <IconFileSpreadsheet className="h-8 w-8 text-rymel-blue" />
              Plantillas
            </h1>
            <p className="mt-1 text-gray-600">
              La base sobre la que los diseñadores calculan. Solo las publicadas
              llegan a la biblioteca.
            </p>
          </div>
          <Button onClick={() => setForm({ mode: "create" })}>
            <IconPlus className="mr-1 h-4 w-4" />
            Nueva plantilla
          </Button>
        </div>

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
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as TemplateStatus | "");
              setPage(1);
            }}
            className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-rymel-blue focus:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value={TemplateStatus.PUBLISHED}>Publicadas</option>
            <option value={TemplateStatus.DRAFT}>Borradores</option>
          </select>

          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as TemplateType | "");
              setPage(1);
            }}
            className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:border-rymel-blue focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            <option value={TemplateType.DESIGN}>Diseño</option>
            <option value={TemplateType.COST}>Costo</option>
          </select>

          <select
            value={subTypeId}
            onChange={(event) => {
              setSubTypeId(
                event.target.value === "" ? "" : Number(event.target.value),
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

        {query.isLoading ? (
          <p className="text-sm text-gray-500">Cargando…</p>
        ) : data && data.items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center">
            <p className="text-gray-600">
              Ninguna plantilla coincide con los filtros.
            </p>
            <Button variant="outline" className="mt-3" onClick={clearFilters}>
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
                  <th className="px-4 py-3">Subtipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Versión</th>
                  <th className="px-4 py-3 text-right">Hojas</th>
                  <th className="px-4 py-3 text-right">Celdas</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <Link href={`/templates/${item.id}`}>
                        <span className="cursor-pointer font-medium text-gray-900 hover:text-rymel-blue">
                          {item.name}
                        </span>
                      </Link>
                      {item.description && (
                        <div className="text-xs text-gray-500">
                          {item.description}
                        </div>
                      )}
                      {/* Una plantilla vacía no tiene nada que cargar: se dice
                          aquí para que no haga falta abrirla para saberlo. */}
                      {item.sheetCount === 0 && (
                        <div className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
                          <IconAlertTriangle className="h-3.5 w-3.5" />
                          Sin hojas: no tiene contenido que cargar
                        </div>
                      )}
                      {item.hasDraft && (
                        <div className="mt-1 text-xs font-medium text-blue-700">
                          Tiene cambios sin publicar
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.type === TemplateType.COST ? "Costo" : "Diseño"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.designSubTypeName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.version}
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${
                        item.sheetCount === 0
                          ? "font-medium text-amber-700"
                          : "text-gray-600"
                      }`}
                    >
                      {item.sheetCount}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {item.cellCount.toLocaleString("es")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          title="Editar"
                          onClick={() => navigate(`/templates/${item.id}`)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-rymel-blue"
                        >
                          <IconPencil className="h-4 w-4" />
                        </button>
                        <button
                          title="Duplicar"
                          onClick={() =>
                            setForm({ mode: "duplicate", template: item })
                          }
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-rymel-blue"
                        >
                          <IconCopy className="h-4 w-4" />
                        </button>
                        <button
                          title={
                            item.hasDraft
                              ? "Publicar los cambios"
                              : "No hay cambios que publicar"
                          }
                          disabled={!item.hasDraft || publish.isPending}
                          onClick={() =>
                            publish.mutate({ id: item.id, dto: {} })
                          }
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <IconUpload className="h-4 w-4" />
                        </button>
                        <button
                          title="Dar de baja"
                          onClick={() => setDeleting(item)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
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
      </div>

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
