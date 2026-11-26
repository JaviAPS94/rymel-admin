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
import {
  Button as UIButton,
  Card as UICard,
  EmptyState,
  IconButton,
  Page,
  PageHeader,
  Pagination as UIPagination,
  TableCard,
  TitleCell,
} from '@rymel/ui';
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

  const totalPages = Math.ceil(total / 10);

  return (
    <Layout bare>
      <PageHeader
        eyebrow="Catálogos"
        title="Listados de materiales"
        description={
          <>
            <strong>
              {total} {total === 1 ? "listado" : "listados"}
            </strong>{" "}
            de materiales, cada uno con su árbol de semielaborados.
          </>
        }
        actions={
          <UIButton
            variant="light"
            size="lg"
            icon={<IconPlus className="h-[18px] w-[18px]" />}
            onClick={handleCreate}
          >
            Nuevo listado
          </UIButton>
        }
      />

      <Page>
        {isLoading ? (
          <UICard>
            <p className="m-0 text-sm text-gray-600">Cargando…</p>
          </UICard>
        ) : error ? (
          <EmptyState tone="error" title="Error al cargar los listados de materiales" />
        ) : (
          <TableCard
            aria-label="Listados de materiales"
            minWidth={720}
            footer={
              totalPages > 1 ? (
                <UIPagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={total}
                  pageSize={10}
                />
              ) : undefined
            }
          >
            <table className="rm-table">
              <thead>
                <tr>
                  <th>Listado de materiales</th>
                  <th>Creado</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {boms.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-gray-600">
                      No hay listados de materiales creados aún
                    </td>
                  </tr>
                )}
                {boms.map((bom) => (
                  <tr
                    key={bom.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/bom/${bom.id}`)}
                  >
                    <td>
                      <TitleCell
                        icon={<IconSitemap className="h-[18px] w-[18px]" />}
                        title={bom.name}
                        code={bom.code}
                      />
                    </td>
                    <td className="whitespace-nowrap text-gray-600">
                      {new Date(bom.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td data-align="right">
                      {/* Las acciones no abren la fila. */}
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <IconButton label="Ver árbol" onClick={() => navigate(`/bom/${bom.id}`)}>
                          <IconEye className="h-[18px] w-[18px]" />
                        </IconButton>
                        <IconButton label="Editar" onClick={() => handleEdit(bom)}>
                          <IconEdit className="h-[18px] w-[18px]" />
                        </IconButton>
                        <IconButton label="Eliminar" tone="danger" onClick={() => handleDelete(bom)}>
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

      {showModal && <BomFormModal bom={selectedBom} onClose={() => setShowModal(false)} />}

      {bomToDelete && (
        <Modal isOpen={true} onClose={() => setBomToDelete(null)} title="Eliminar listado de materiales">
          <div className="space-y-6">
            <p className="text-gray-600">
              ¿Estás seguro de que deseas eliminar el listado de materiales{" "}
              <strong>{bomToDelete.code}</strong>? Esta acción también eliminará todos los nodos
              asociados.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setBomToDelete(null)} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                isLoading={deleteMutation.isPending}
                className="flex-1"
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};
