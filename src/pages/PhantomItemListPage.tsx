import { useEffect, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  IconPlus,
  IconGhost2,
  IconUpload,
  IconDownload,
  IconFileTypeXls,
  IconClipboardText,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Select } from "@components/ui/Select";
import {
  Button as UIButton,
  Card as UICard,
  EmptyState,
  FilterField,
  IconButton,
  Page,
  PageHeader,
  Pagination as UIPagination,
  TableCard,
  Tag,
} from "@rymel/ui";
import { Layout } from "@components/Layout";
import { FilterSlot } from "@components/ui/FilterSlot";
import { PhantomItemImportModal } from "@components/phantom-item/PhantomItemImportModal";
import { PhantomItemPasteModal } from "@components/phantom-item/PhantomItemPasteModal";
import { PhantomProcessesModal } from "@components/phantom-item/PhantomProcessesModal";
import { ProcessTabs } from "@components/phantom-item/ProcessTabs";
import { DeletePhantomItemsDialog } from "@components/phantom-item/DeletePhantomItemsDialog";
import { useDeletePhantomItems, usePhantomItems } from "@hooks/usePhantomItems";
import { usePhantomProcesses } from "@hooks/usePhantomProcesses";
import { phantomItemService } from "@services/phantomItemService";
import { useAuthStore } from "@store/authStore";
import { Role } from "@/types/user.types";
import type { PhantomItemsFilters } from "@/types/phantom-item.types";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

export const PhantomItemListPage = () => {
  const [, navigate] = useLocation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.roles?.includes(Role.ADMIN);

  // `?process=&family=` abre un proceso con su familia filtrada (desde la estructura BOM)
  const params = new URLSearchParams(useSearch());
  const initialFamilyId = Number(params.get("family")) || undefined;
  const initialProcessId = Number(params.get("process")) || null;

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<PhantomItemsFilters>({ familyId: initialFamilyId });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showProcessesModal, setShowProcessesModal] = useState(false);
  const [exporting, setExporting] = useState<"workbook" | "process" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data: processes = [], isLoading: processesLoading } = usePhantomProcesses();
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(initialProcessId);
  // The first process until one is chosen, and again if the chosen one is gone
  const process =
    processes.find((item) => item.id === selectedProcessId) ?? processes[0] ?? null;

  const selectProcess = (id: number) => {
    setSelectedProcessId(id);
    setPage(1);
    setFilters((prev) => ({ ...prev, familyId: undefined }));
  };

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setFilters((prev) => ({ ...prev, search: searchInput || undefined }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const { data, isLoading, error } = usePhantomItems({
    ...filters,
    processId: process?.id,
    page,
    limit: PAGE_SIZE,
  });

  const phantomItems = data?.data ?? [];
  const total = data?.total ?? 0;

  // The selection belongs to what is on screen: switching process, filter or
  // page drops it for good (coming back does not bring it back), so nothing
  // is deleted that the user is not looking at. Reset while rendering, as
  // React documents for state that depends on a changing value.
  const scopeKey = JSON.stringify({ process: process?.id, filters, page });
  const [selected, setSelected] = useState<Map<number, string>>(() => new Map());
  const [selectionScope, setSelectionScope] = useState(scopeKey);
  if (selectionScope !== scopeKey) {
    setSelectionScope(scopeKey);
    setSelected(new Map());
  }
  const allSelected = phantomItems.length > 0 && phantomItems.every((item) => selected.has(item.id));

  const toggle = (id: number, itemCode: string) => {
    const ids = new Map(selected);
    if (ids.has(id)) ids.delete(id);
    else ids.set(id, itemCode);
    setSelected(ids);
  };
  const toggleAll = () =>
    setSelected(allSelected ? new Map() : new Map(phantomItems.map((item) => [item.id, item.itemCode])));

  const [pendingDelete, setPendingDelete] = useState<Map<number, string> | null>(null);
  const deleteMutation = useDeletePhantomItems();

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const ids = [...pendingDelete.keys()];
    try {
      await deleteMutation.mutateAsync(ids);
    } catch {
      return; // The hook already said nothing was deleted; the dialog stays open
    }
    setPendingDelete(null);
    setSelected(new Map());
    // The whole page is gone: go back one instead of showing an empty page
    if (ids.length >= phantomItems.length && page > 1) setPage(page - 1);
  };

  /**
   * The whole workbook, a sheet per process, is the backup; the process alone
   * respects the filters on screen.
   */
  const handleExport = async (scope: "workbook" | "process") => {
    setExporting(scope);
    try {
      if (scope === "workbook") {
        await phantomItemService.exportPhantomItems({}, undefined, "fantasmas.xlsx");
      } else if (process) {
        await phantomItemService.exportPhantomItems(
          { ...filters, processId: process.id },
          undefined,
          `fantasmas-${process.name}.xlsx`,
        );
      }
    } finally {
      setExporting(null);
    }
  };

  const familyOptions = [
    { value: "", label: "Todas las familias" },
    ...(process?.families ?? []).map((family) => ({
      value: String(family.id),
      label: `${family.name} (${family.phantomItemsCount})`,
    })),
  ];

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Layout bare>
      <PageHeader
        eyebrow="Catálogos"
        title="Fantasmas"
        description={
          <>
            <strong>
              {total} {total === 1 ? "fantasma" : "fantasmas"}
            </strong>
            {process ? ` en ${process.name}` : ""} · los ítems fantasma y sus componentes.
          </>
        }
        actions={
          isAdmin && (
            <>
              <UIButton
                variant="outlineLight"
                icon={<IconSettings className="h-[18px] w-[18px]" />}
                onClick={() => setShowProcessesModal(true)}
              >
                Procesos
              </UIButton>
              <UIButton
                variant="outlineLight"
                icon={<IconUpload className="h-[18px] w-[18px]" />}
                onClick={() => setShowImportModal(true)}
              >
                Importar libro
              </UIButton>
              <UIButton
                variant="outlineLight"
                icon={<IconDownload className="h-[18px] w-[18px]" />}
                onClick={() => handleExport("workbook")}
                loading={exporting === "workbook"}
              >
                Exportar libro
              </UIButton>
              <UIButton
                variant="outlineLight"
                icon={<IconFileTypeXls className="h-[18px] w-[18px]" />}
                onClick={() => phantomItemService.downloadTemplate()}
              >
                Plantilla
              </UIButton>
            </>
          )
        }
      />

      <Page>
        <UICard padded={false} className="overflow-hidden">
          {processesLoading && <p className="m-0 px-5 pt-5 text-sm text-gray-600">Cargando procesos…</p>}
          {processes.length > 0 && process && (
            <ProcessTabs processes={processes} selectedId={process.id} onSelect={selectProcess} />
          )}

          <div className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-rymel-blue text-rymel-yellow"
                >
                  <IconGhost2 className="h-5 w-5" />
                </span>
                <h2 className="m-0 text-xl font-extrabold text-gray-900">
                  {process ? process.name : "Catálogo de fantasmas"}
                </h2>
              </div>
              {isAdmin && process && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => setShowPasteModal(true)}>
                    <IconClipboardText className="h-4 w-4" />
                    Pegar desde Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExport("process")}
                    isLoading={exporting === "process"}
                  >
                    <IconDownload className="h-4 w-4" />
                    Exportar proceso
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/phantom-items/new?process=${process.id}`)}
                  >
                    <IconPlus className="h-4 w-4" />
                    Nuevo fantasma
                  </Button>
                </div>
              )}
            </div>

            <div role="search" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterField label="Buscar">
                <Input
                  placeholder="Ítem, referencia o descripción corta"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </FilterField>
              <FilterSlot label="Familia">
                <Select
                  value={filters.familyId ? String(filters.familyId) : ""}
                  onChange={(value) => {
                    setPage(1);
                    setFilters((prev) => ({ ...prev, familyId: value ? Number(value) : undefined }));
                  }}
                  options={familyOptions}
                  placeholder="Todas las familias"
                />
              </FilterSlot>
              <FilterField label="Tipo PT">
                <Input
                  placeholder="Tipo PT"
                  value={filters.finishedProductType ?? ""}
                  onChange={(e) => {
                    setPage(1);
                    setFilters((prev) => ({
                      ...prev,
                      finishedProductType: e.target.value || undefined,
                    }));
                  }}
                />
              </FilterField>
              <FilterField label="Raíz fantasma">
                <Input
                  placeholder="Raíz Fantasma"
                  value={filters.phantomRootCode ?? ""}
                  onChange={(e) => {
                    setPage(1);
                    setFilters((prev) => ({
                      ...prev,
                      phantomRootCode: e.target.value || undefined,
                    }));
                  }}
                />
              </FilterField>
            </div>
          </div>
        </UICard>

        {isAdmin && selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-danger-soft px-4 py-3 text-sm">
            <span className="font-semibold text-danger">
              {selected.size === 1 ? "1 fantasma seleccionado" : `${selected.size} fantasmas seleccionados`}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Map())}>
                Quitar selección
              </Button>
              <Button variant="danger" size="sm" onClick={() => setPendingDelete(new Map(selected))}>
                <IconTrash className="h-4 w-4" />
                Eliminar seleccionados
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-600">Cargando…</p>
        ) : error ? (
          <EmptyState tone="error" title="Error al cargar los fantasmas" />
        ) : (
          <TableCard
            aria-label="Fantasmas"
            minWidth={1100}
            footer={
              totalPages > 1 ? (
                <UIPagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={total}
                  pageSize={PAGE_SIZE}
                />
              ) : undefined
            }
          >
            <table className="rm-table rm-table-compact">
              <thead>
                <tr>
                  {isAdmin && (
                    <th className="w-10">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todos los de esta página"
                        checked={allSelected}
                        onChange={toggleAll}
                        disabled={phantomItems.length === 0}
                        className="size-5 cursor-pointer accent-rymel-blue"
                      />
                    </th>
                  )}
                  <th>Item</th>
                  <th>Familia</th>
                  <th>Referencia</th>
                  <th>Desc. corta</th>
                  <th>Tipo PT</th>
                  <th>Tipo PP</th>
                  <th>Raíz</th>
                  <th data-align="right">Componentes</th>
                  {isAdmin && (
                    <th>
                      <span className="sr-only">Acciones</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {phantomItems.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 10 : 8} className="py-10 text-center text-gray-600">
                      {process ? `No hay fantasmas en ${process.name}` : "No hay fantasmas creados aún"}
                    </td>
                  </tr>
                )}
                {phantomItems.map((phantomItem) => (
                  <tr
                    key={phantomItem.id}
                    onClick={() => navigate(`/phantom-items/${phantomItem.id}`)}
                    aria-selected={selected.has(phantomItem.id)}
                    className="cursor-pointer"
                  >
                    {isAdmin && (
                      // The cell, not just the box: a click a little off would open the editor
                      <td onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar ${phantomItem.itemCode}`}
                          checked={selected.has(phantomItem.id)}
                          onChange={() => toggle(phantomItem.id, phantomItem.itemCode)}
                          className="size-5 cursor-pointer accent-rymel-blue"
                        />
                      </td>
                    )}
                    <td>
                      <Tag mono>{phantomItem.itemCode}</Tag>
                    </td>
                    <td className="text-gray-600">{phantomItem.familyName ?? "—"}</td>
                    <td className="font-semibold">{phantomItem.reference}</td>
                    <td>{phantomItem.shortDescription}</td>
                    <td className="text-gray-600">{phantomItem.finishedProductType}</td>
                    <td className="text-gray-600">{phantomItem.workInProcessType}</td>
                    <td className="font-mono text-[13px] text-gray-600">{phantomItem.phantomRootCode}</td>
                    <td data-align="right" className="font-semibold tabular-nums">
                      {phantomItem.componentsCount}
                    </td>
                    {isAdmin && (
                      <td data-align="right" onClick={(event) => event.stopPropagation()}>
                        <IconButton
                          label={`Eliminar ${phantomItem.itemCode}`}
                          tone="danger"
                          onClick={() => setPendingDelete(new Map([[phantomItem.id, phantomItem.itemCode]]))}
                        >
                          <IconTrash className="h-[18px] w-[18px]" />
                        </IconButton>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}
      </Page>

      {showImportModal && (
        <PhantomItemImportModal onClose={() => setShowImportModal(false)} />
      )}
      {showPasteModal && process && (
        <PhantomItemPasteModal process={process} onClose={() => setShowPasteModal(false)} />
      )}
      {pendingDelete && (
        <DeletePhantomItemsDialog
          itemCodes={[...pendingDelete.values()]}
          isDeleting={deleteMutation.isPending}
          onConfirm={confirmDelete}
          onClose={() => setPendingDelete(null)}
        />
      )}
      {showProcessesModal && (
        <PhantomProcessesModal processes={processes} onClose={() => setShowProcessesModal(false)} />
      )}
    </Layout>
  );
};
