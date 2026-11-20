import { useMemo, useState } from 'react';
import {
  IconAlertTriangle,
  IconEdit,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import {
  Badge,
  Button as UIButton,
  Card as UICard,
  EmptyState,
  FilterField,
  IconButton,
  Input as UIInput,
  Notice,
  Page,
  PageHeader,
  Pagination as UIPagination,
  TableCard,
  Tag,
} from '@rymel/ui';
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
    <Layout bare>
      <PageHeader
        eyebrow="Catálogos"
        title="Semielaborados"
        description={
          <>
            <strong>
              {search.trim()
                ? `${filtered.length} de ${data?.length ?? 0} registros`
                : `Total: ${data?.length ?? 0} registros`}
            </strong>{" "}
            · los que usan las estructuras, las plantillas y las normas.
          </>
        }
        actions={
          <UIButton
            variant="light"
            size="lg"
            icon={<IconPlus className="h-[18px] w-[18px]" />}
            onClick={() => setEditing(null)}
          >
            Nuevo semielaborado
          </UIButton>
        }
      />

      <Page>
        <UICard as="div" role="search" className="flex flex-wrap items-end gap-3">
          <FilterField label="Buscar" className="max-w-md">
            <UIInput
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              onClear={() => handleSearch("")}
              placeholder="Código o nombre"
              aria-label="Buscar por código o nombre"
              leftIcon={<IconSearch className="h-[18px] w-[18px]" />}
            />
          </FilterField>
        </UICard>

        {isLoading ? (
          <p className="text-sm text-gray-600">Cargando…</p>
        ) : error ? (
          <EmptyState tone="error" title="Error al cargar los semielaborados" />
        ) : (
          <TableCard
            aria-label="Semielaborados"
            minWidth={640}
            footer={
              totalPages > 1 ? (
                <UIPagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
              ) : undefined
            }
          >
            <table className="rm-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Estructuras</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-600">
                      {search.trim()
                        ? "Ningún semielaborado coincide con la búsqueda"
                        : "No hay semielaborados creados aún"}
                    </td>
                  </tr>
                )}
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Tag mono>{item.code}</Tag>
                    </td>
                    <td className="font-bold text-gray-900">{item.name}</td>
                    <td>
                      {item.bomCount > 0 ? (
                        <Badge tone="brand">{structuresLabel(item.bomCount)}</Badge>
                      ) : (
                        <span className="text-gray-600">Sin uso</span>
                      )}
                    </td>
                    <td data-align="right">
                      <div className="flex items-center justify-end gap-2">
                        <IconButton label={`Editar ${item.code}`} onClick={() => setEditing(item)}>
                          <IconEdit className="h-[18px] w-[18px]" />
                        </IconButton>
                        <span title={item.bomCount > 0 ? `Se usa en ${structuresLabel(item.bomCount)}` : undefined}>
                          <IconButton label={`Eliminar ${item.code}`} tone="danger" onClick={() => openDelete(item)}>
                            <IconTrash className="h-[18px] w-[18px]" />
                          </IconButton>
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
        )}
      </Page>

      {editing !== undefined && (
        <SemiFinishedFormModal
          semiFinished={editing ?? undefined}
          onClose={() => setEditing(undefined)}
        />
      )}

      {toDelete && (
        <Modal isOpen={true} onClose={closeDelete} title="Eliminar semielaborado">
          <div className="space-y-4">
            <p className="text-gray-600">
              ¿Estás seguro de que deseas eliminar el semielaborado <strong>{toDelete.code}</strong> (
              {toDelete.name})?
            </p>
            {toDelete.bomCount > 0 && (
              <Notice tone="warning" icon={<IconAlertTriangle className="h-[18px] w-[18px]" />}>
                Se usa en {structuresLabel(toDelete.bomCount)}. Quítalo de su árbol antes de
                eliminarlo.
              </Notice>
            )}
            {deleteError && <Notice tone="danger">{deleteError}</Notice>}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={closeDelete} className="flex-1">
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
