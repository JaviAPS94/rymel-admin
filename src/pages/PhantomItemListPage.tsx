import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
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
import { Pagination } from "@components/ui/Pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/Card";
import { Layout } from "@components/Layout";
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

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<PhantomItemsFilters>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showProcessesModal, setShowProcessesModal] = useState(false);
  const [exporting, setExporting] = useState<"workbook" | "process" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { data: processes = [], isLoading: processesLoading } = usePhantomProcesses();
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <IconGhost2 className="h-8 w-8 text-rymel-blue" />
              Fantasmas
            </h1>
            <p className="text-gray-600 mt-1">
              Administra los ítems fantasma y sus componentes
            </p>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowProcessesModal(true)}>
                <IconSettings className="h-5 w-5 mr-2" />
                Procesos
              </Button>
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <IconUpload className="h-5 w-5 mr-2" />
                Importar libro
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport("workbook")}
                isLoading={exporting === "workbook"}
              >
                <IconDownload className="h-5 w-5 mr-2" />
                Exportar libro
              </Button>
              <Button variant="outline" onClick={() => phantomItemService.downloadTemplate()}>
                <IconFileTypeXls className="h-5 w-5 mr-2" />
                Plantilla
              </Button>
            </div>
          )}
        </div>

        {processesLoading && (
          <div className="text-center py-4 text-gray-500">Cargando procesos...</div>
        )}

        {processes.length > 0 && process && (
          <ProcessTabs processes={processes} selectedId={process.id} onSelect={selectProcess} />
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{process ? process.name : "Catálogo de fantasmas"}</CardTitle>
                <CardDescription>Total: {total} registros</CardDescription>
              </div>
              {isAdmin && process && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowPasteModal(true)}>
                    <IconClipboardText className="h-4 w-4 mr-2" />
                    Pegar desde Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport("process")}
                    isLoading={exporting === "process"}
                  >
                    <IconDownload className="h-4 w-4 mr-2" />
                    Exportar proceso
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/phantom-items/new?process=${process.id}`)}
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Nuevo fantasma
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">
              <Input
                placeholder="Buscar por ítem, referencia o descripción corta"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="sm:col-span-1"
              />
              <Select
                value={filters.familyId ? String(filters.familyId) : ""}
                onChange={(value) => {
                  setPage(1);
                  setFilters((prev) => ({ ...prev, familyId: value ? Number(value) : undefined }));
                }}
                options={familyOptions}
                placeholder="Todas las familias"
              />
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
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Error al cargar los fantasmas
              </div>
            )}

            {isAdmin && selected.size > 0 && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm">
                <span className="text-red-800">
                  {selected.size === 1 ? "1 fantasma seleccionado" : `${selected.size} fantasmas seleccionados`}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Map())}>
                    Quitar selección
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setPendingDelete(new Map(selected))}>
                    <IconTrash className="h-4 w-4 mr-2" />
                    Eliminar seleccionados
                  </Button>
                </div>
              </div>
            )}

            {!isLoading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      {isAdmin && (
                        <th className="w-10 py-3 pl-4">
                          <input
                            type="checkbox"
                            aria-label="Seleccionar todos los de esta página"
                            checked={allSelected}
                            onChange={toggleAll}
                            disabled={phantomItems.length === 0}
                            className="h-4 w-4 cursor-pointer accent-rymel-blue"
                          />
                        </th>
                      )}
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Familia</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Referencia</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Desc. corta</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo PT</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo PP</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Raíz</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Componentes</th>
                      {isAdmin && <th className="w-12" />}
                    </tr>
                  </thead>
                  <tbody>
                    {phantomItems.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 10 : 8} className="text-center py-10 text-gray-400">
                          {process ? `No hay fantasmas en ${process.name}` : "No hay fantasmas creados aún"}
                        </td>
                      </tr>
                    )}
                    {phantomItems.map((phantomItem) => (
                      <tr
                        key={phantomItem.id}
                        onClick={() => navigate(`/phantom-items/${phantomItem.id}`)}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                          selected.has(phantomItem.id) ? "bg-red-50/60" : ""
                        }`}
                      >
                        {isAdmin && (
                          // The cell, not just the box: a click a little off would open the editor
                          <td className="py-3 pl-4" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              aria-label={`Seleccionar ${phantomItem.itemCode}`}
                              checked={selected.has(phantomItem.id)}
                              onChange={() => toggle(phantomItem.id, phantomItem.itemCode)}
                              className="h-4 w-4 cursor-pointer accent-rymel-blue"
                            />
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                            {phantomItem.itemCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">{phantomItem.familyName ?? "—"}</td>
                        <td className="py-3 px-4 text-gray-700">{phantomItem.reference}</td>
                        <td className="py-3 px-4 text-gray-700">{phantomItem.shortDescription}</td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{phantomItem.finishedProductType}</td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{phantomItem.workInProcessType}</td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{phantomItem.phantomRootCode}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{phantomItem.componentsCount}</td>
                        {isAdmin && (
                          <td className="py-3 pr-4 text-right">
                            <button
                              type="button"
                              title="Eliminar"
                              aria-label={`Eliminar ${phantomItem.itemCode}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setPendingDelete(new Map([[phantomItem.id, phantomItem.itemCode]]));
                              }}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              currentPage={page}
              totalPages={Math.ceil(total / PAGE_SIZE)}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>

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
