import { useMemo, useState } from 'react';
import {
  IconAlertTriangle,
  IconEdit,
  IconPlus,
  IconPuzzle,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Pagination } from '@components/ui/Pagination';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@components/ui/Card';
import { Layout } from '@components/Layout';
import { SemiFinishedFormModal } from '@components/SemiFinishedFormModal';
import { useDeleteSemiFinished, useSemiFinishedAdminList } from '@hooks/useSemiFinished';
import { apiErrorMessage } from '@hooks/usePhantomProcesses';
import type { SemiFinishedAdminItem } from '@/types/bom.types';

const PAGE_SIZE = 10;

/** Sin mayúsculas ni tildes: «bobína» encuentra «Bobina». */
const fold = (text: string): string =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const structuresLabel = (count: number): string =>
  count === 1 ? '1 estructura' : `${count} estructuras`;

/**
 * El catálogo de semielaborados: los nodos del árbol de las estructuras, las
 * zonas de la plantilla y el destino de los accesorios de la norma. Se busca
 * y pagina en el navegador porque el catálogo es pequeño.
 */
export const SemiFinishedListPage = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<SemiFinishedAdminItem | null | undefined>();
  const [toDelete, setToDelete] = useState<SemiFinishedAdminItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, error } = useSemiFinishedAdminList();
  const deleteMutation = useDeleteSemiFinished();

  const filtered = useMemo(() => {
    const items = data ?? [];
    const term = fold(search.trim());
    if (!term) return items;
    return items.filter(
      (item) => fold(item.code).includes(term) || fold(item.name).includes(term),
    );
  }, [data, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openDelete = (item: SemiFinishedAdminItem) => {
    setDeleteError(null);
    setToDelete(item);
  };

  const closeDelete = () => {
    setToDelete(null);
    setDeleteError(null);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: closeDelete,
      onError: (err) =>
        setDeleteError(apiErrorMessage(err, 'Error al eliminar el semielaborado')),
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <IconPuzzle className="h-8 w-8 text-rymel-blue" />
              Semielaborados
            </h1>
            <p className="text-gray-600 mt-1">
              Los semielaborados que usan las estructuras, las plantillas y las normas
            </p>
          </div>
          <Button variant="primary" onClick={() => setEditing(null)}>
            <IconPlus className="h-5 w-5 mr-2" />
            Nuevo semielaborado
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Catálogo</CardTitle>
            <CardDescription>
              {search.trim()
                ? `${filtered.length} de ${data?.length ?? 0} registros`
                : `Total: ${data?.length ?? 0} registros`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="mb-4 flex items-center gap-2 rounded border border-gray-300 px-2 sm:max-w-sm">
              <IconSearch className="h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Buscar por código o nombre"
                aria-label="Buscar por código o nombre"
                className="h-9 flex-1 text-sm outline-none"
              />
            </label>

            {isLoading && (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Error al cargar los semielaborados
              </div>
            )}

            {!isLoading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Código</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Nombre</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Estructuras
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-gray-400">
                          {search.trim()
                            ? 'Ningún semielaborado coincide con la búsqueda'
                            : 'No hay semielaborados creados aún'}
                        </td>
                      </tr>
                    )}
                    {rows.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                            {item.code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{item.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {item.bomCount > 0 ? structuresLabel(item.bomCount) : 'Sin uso'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditing(item)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                              aria-label={`Editar ${item.code}`}
                            >
                              <IconEdit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openDelete(item)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={
                                item.bomCount > 0
                                  ? `Se usa en ${structuresLabel(item.bomCount)}`
                                  : 'Eliminar'
                              }
                              aria-label={`Eliminar ${item.code}`}
                            >
                              <IconTrash className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>

        {editing !== undefined && (
          <SemiFinishedFormModal
            semiFinished={editing ?? undefined}
            onClose={() => setEditing(undefined)}
          />
        )}

        {toDelete && (
          <Modal isOpen={true} onClose={closeDelete} title="Eliminar semielaborado">
            <div className="space-y-6">
              <p className="text-gray-600">
                ¿Estás seguro de que deseas eliminar el semielaborado{' '}
                <strong>{toDelete.code}</strong> ({toDelete.name})?
              </p>
              {toDelete.bomCount > 0 && (
                <div className="flex gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-sm">
                  <IconAlertTriangle className="h-5 w-5 shrink-0" />
                  <span>
                    Se usa en {structuresLabel(toDelete.bomCount)}. Quítalo de su árbol
                    antes de eliminarlo.
                  </span>
                </div>
              )}
              {deleteError && (
                <div
                  role="alert"
                  className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm"
                >
                  {deleteError}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={closeDelete} className="flex-1">
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={confirmDelete}
                  isLoading={deleteMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};
