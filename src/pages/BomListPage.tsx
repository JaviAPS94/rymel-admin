import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconEye,
  IconSitemap,
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
import { useBoms, useDeleteBom } from '@hooks/useBom';
import { BomFormModal } from '@components/BomFormModal';
import { Layout } from '@components/Layout';
import type { BomListItem } from '@/types/bom.types';

export const BomListPage = () => {
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedBom, setSelectedBom] = useState<BomListItem | undefined>();
  const [bomToDelete, setBomToDelete] = useState<BomListItem | null>(null);

  const { data, isLoading, error } = useBoms(page, 10);
  const deleteMutation = useDeleteBom();

  const handleCreate = () => {
    setSelectedBom(undefined);
    setShowModal(true);
  };

  const handleEdit = (bom: BomListItem) => {
    setSelectedBom(bom);
    setShowModal(true);
  };

  const handleDelete = (bom: BomListItem) => {
    setBomToDelete(bom);
  };

  const confirmDelete = () => {
    if (bomToDelete) {
      deleteMutation.mutate(bomToDelete.id, {
        onSuccess: () => setBomToDelete(null),
      });
    }
  };

  const boms = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <IconSitemap className="h-8 w-8 text-rymel-blue" />
              Lista de Materiales
            </h1>
            <p className="text-gray-600 mt-1">
              Administra las listas de materiales y su estructura jerárquica
            </p>
          </div>
          <Button variant="primary" onClick={handleCreate}>
            <IconPlus className="h-5 w-5 mr-2" />
            Nuevo BOM
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de BOMs</CardTitle>
            <CardDescription>Total: {total} registros</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="text-center py-8 text-gray-500">Cargando...</div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                Error al cargar los BOMs
              </div>
            )}

            {!isLoading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Código
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Nombre
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Creado
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {boms.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-gray-400">
                          No hay BOMs creados aún
                        </td>
                      </tr>
                    )}
                    {boms.map((bom) => (
                      <tr
                        key={bom.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                            {bom.code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{bom.name}</td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {new Date(bom.createdAt).toLocaleDateString('es-MX')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/bom/${bom.id}`)}
                              className="p-2 text-gray-500 hover:text-rymel-blue hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver árbol"
                            >
                              <IconEye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleEdit(bom)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <IconEdit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(bom)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
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
              currentPage={page}
              totalPages={Math.ceil(total / 10)}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>

        {showModal && (
          <BomFormModal bom={selectedBom} onClose={() => setShowModal(false)} />
        )}

        {bomToDelete && (
          <Modal
            isOpen={true}
            onClose={() => setBomToDelete(null)}
            title="Eliminar BOM"
          >
            <div className="space-y-6">
              <p className="text-gray-600">
                ¿Estás seguro de que deseas eliminar el BOM{' '}
                <strong>{bomToDelete.code}</strong>? Esta acción también eliminará
                todos los nodos asociados.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setBomToDelete(null)}
                  className="flex-1"
                >
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
