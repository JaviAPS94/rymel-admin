import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  IconPlus,
  IconGhost2,
  IconUpload,
  IconDownload,
  IconFileTypeXls,
} from "@tabler/icons-react";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
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
import { usePhantomItems } from "@hooks/usePhantomItems";
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
  const [isExporting, setIsExporting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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
    page,
    limit: PAGE_SIZE,
  });

  const phantomItems = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await phantomItemService.exportPhantomItems(filters);
    } finally {
      setIsExporting(false);
    }
  };

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
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => phantomItemService.downloadTemplate()}>
                <IconFileTypeXls className="h-5 w-5 mr-2" />
                Plantilla
              </Button>
              <Button variant="outline" onClick={() => setShowImportModal(true)}>
                <IconUpload className="h-5 w-5 mr-2" />
                Importar
              </Button>
              <Button variant="outline" onClick={handleExport} isLoading={isExporting}>
                <IconDownload className="h-5 w-5 mr-2" />
                Exportar
              </Button>
              <Button variant="primary" onClick={() => navigate("/phantom-items/new")}>
                <IconPlus className="h-5 w-5 mr-2" />
                Nuevo Fantasma
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catálogo de fantasmas</CardTitle>
            <CardDescription>Total: {total} registros</CardDescription>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <Input
                placeholder="Buscar por ítem, referencia o descripción corta"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="sm:col-span-1"
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

            {!isLoading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Referencia</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Desc. corta</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo PT</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo PP</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Raíz</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Componentes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phantomItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-gray-400">
                          No hay fantasmas creados aún
                        </td>
                      </tr>
                    )}
                    {phantomItems.map((phantomItem) => (
                      <tr
                        key={phantomItem.id}
                        onClick={() => navigate(`/phantom-items/${phantomItem.id}`)}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                            {phantomItem.itemCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{phantomItem.reference}</td>
                        <td className="py-3 px-4 text-gray-700">{phantomItem.shortDescription}</td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{phantomItem.finishedProductType}</td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{phantomItem.workInProcessType}</td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{phantomItem.phantomRootCode}</td>
                        <td className="py-3 px-4 text-right text-gray-700">{phantomItem.componentsCount}</td>
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
    </Layout>
  );
};
