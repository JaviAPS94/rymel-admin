import { useMemo, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSitemap,
  IconInfoCircle,
  IconGhost2,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Layout } from '@components/Layout';
import {
  Badge,
  Button as UIButton,
  Card as UICard,
  EmptyState,
  HeaderChip,
  IconButton,
  Page,
  PageHeader,
  Tag,
} from '@rymel/ui';
import { BomTree } from '@components/BomTree';
import { BomNodeFormModal } from '@components/BomNodeFormModal';
import { BomFormModal } from '@components/BomFormModal';
import { BomPhantomFamiliesModal } from '@components/BomPhantomFamiliesModal';
import { BomPhantomFamilyPanel } from '@components/BomPhantomFamilyPanel';
import { BomProductTypesModal } from '@components/BomProductTypesModal';
import { useBom, useDeleteBomNode, useRemoveNodePhantomFamily } from '@hooks/useBom';
import {
  BomNodeType,
  type BomNode,
  type BomListItem,
  type BomNodePhantomFamily,
} from '@/types/bom.types';

const typeLabels: Record<string, string> = {
  [BomNodeType.STANDARD]: 'Estándar',
  [BomNodeType.CRITICAL]: 'Crítico',
  [BomNodeType.REFERENCE]: 'Referencia',
};

const typeBadgeColors: Record<string, string> = {
  [BomNodeType.STANDARD]: 'bg-amber-100 text-amber-800',
  [BomNodeType.CRITICAL]: 'bg-orange-100 text-orange-800',
  [BomNodeType.REFERENCE]: 'bg-blue-100 text-blue-800',
};

export const BomEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const bomId = Number(id);

  const { data: bom, isLoading, error } = useBom(bomId);
  const deleteMutation = useDeleteBomNode(bomId);
  const removeFamilyMutation = useRemoveNodePhantomFamily(bomId);

  // La selección se guarda por id y se busca en el árbol de ahora, para que
  // los contadores de las familias estén al día tras cada cambio
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedFamilyId, setSelectedFamilyId] = useState<number | null>(null);
  const [showAddFamiliesModal, setShowAddFamiliesModal] = useState(false);
  const [showProductTypesModal, setShowProductTypesModal] = useState(false);
  const [familyToRemove, setFamilyToRemove] = useState<BomNodePhantomFamily | null>(null);
  const selectedNode = useMemo(
    () => (bom && selectedNodeId !== null ? findNode(bom.nodes, selectedNodeId) : null),
    [bom, selectedNodeId],
  );
  const selectedFamily = useMemo(
    () => (bom && selectedFamilyId !== null ? findFamily(bom.nodes, selectedFamilyId) : null),
    [bom, selectedFamilyId],
  );
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showEditNodeModal, setShowEditNodeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditBomModal, setShowEditBomModal] = useState(false);
  const [addingChildOf, setAddingChildOf] = useState<BomNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const handleNodeClick = (node: BomNode) => {
    setSelectedFamilyId(null);
    setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
  };

  const handleFamilyClick = (link: BomNodePhantomFamily) => {
    setSelectedNodeId(null);
    setSelectedFamilyId((prev) => (prev === link.id ? null : link.id));
  };

  const handleAddFamilies = () => {
    if (selectedNode) {
      setExpandedNodes((prev) => new Set([...prev, selectedNode.id]));
    }
    setShowAddFamiliesModal(true);
  };

  const confirmRemoveFamily = () => {
    if (familyToRemove) {
      removeFamilyMutation.mutate(familyToRemove.id, {
        onSuccess: () => {
          setSelectedFamilyId(null);
          setFamilyToRemove(null);
        },
      });
    }
  };

  const handleToggleExpand = (nodeId: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleAddRoot = () => {
    setAddingChildOf(null);
    setShowAddNodeModal(true);
  };

  const handleAddChild = () => {
    if (selectedNode) {
      setExpandedNodes((prev) => new Set([...prev, selectedNode.id]));
    }
    setAddingChildOf(selectedNode);
    setShowAddNodeModal(true);
  };

  const handleEditNode = () => {
    setShowEditNodeModal(true);
  };

  const handleDeleteNode = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteNode = () => {
    if (selectedNode) {
      deleteMutation.mutate(selectedNode.id, {
        onSuccess: () => {
          setSelectedNodeId(null);
          setShowDeleteConfirm(false);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Layout bare>
        <PageHeader back={{ label: 'Listados de materiales', href: '/bom' }} title="Cargando listado de materiales…" />
        <Page>
          <div className="h-40 animate-pulse rounded-[20px] border border-gray-200 bg-white" />
        </Page>
      </Layout>
    );
  }

  if (error || !bom) {
    return (
      <Layout bare>
        <PageHeader back={{ label: 'Listados de materiales', href: '/bom' }} title="No se pudo cargar el listado de materiales" />
        <Page>
          <EmptyState tone="error" title="Error al cargar el listado de materiales" />
        </Page>
      </Layout>
    );
  }

  const bomAsListItem: BomListItem = {
    id: bom.id,
    code: bom.code,
    name: bom.name,
    createdAt: bom.createdAt,
    updatedAt: bom.updatedAt,
  };
  const productTypes = bom.productTypes ?? [];

  return (
    <Layout bare>
      <PageHeader
        icon={<IconSitemap />}
        back={{ label: 'Listados de materiales', onClick: () => navigate('/bom') }}
        title={bom.name}
        meta={<HeaderChip mono>{bom.code}</HeaderChip>}
        actions={
          <UIButton
            variant="outlineLight"
            icon={<IconEdit className="h-[18px] w-[18px]" />}
            onClick={() => setShowEditBomModal(true)}
          >
            Editar listado
          </UIButton>
        }
      />

      <Page>
        {/* Contexto del árbol: tipos de equipo y leyenda */}
        <UICard as="div" className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="font-semibold text-gray-600">Tipos de equipo:</span>
            {productTypes.length === 0 ? (
              <Badge tone="warning" icon={<IconAlertTriangle className="h-3.5 w-3.5" />}>
                Sin tipos de equipo: se ofrecen todos los fantasmas
              </Badge>
            ) : (
              productTypes.map((code) => <Tag key={code}>{code}</Tag>)
            )}
            <IconButton label="Editar tipos de equipo" onClick={() => setShowProductTypesModal(true)}>
              <IconEdit className="h-4 w-4" />
            </IconButton>
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
            <span className="font-semibold">Tipos:</span>
            <span className="px-2 py-1 bg-amber-50 border border-amber-300 text-amber-800 rounded-md">
              Estándar
            </span>
            <span className="px-2 py-1 bg-orange-400 border border-orange-600 text-white rounded-md">
              Crítico
            </span>
            <span className="px-2 py-1 bg-blue-100 border border-blue-300 text-blue-900 rounded-md">
              Referencia
            </span>
            <span className="px-2 py-1 bg-violet-50 border-2 border-dashed border-violet-300 text-violet-900 rounded-md flex items-center gap-1">
              <IconGhost2 className="h-3 w-3" />
              Familia de fantasmas
            </span>
          </div>
        </UICard>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Tree area */}
          <div className="flex-1 bg-white rounded-[20px] border border-gray-200 overflow-auto">
            <div className="p-4 min-w-max min-h-full">
              <BomTree
                bomCode={bom.code}
                bomName={bom.name}
                nodes={bom.nodes}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedNode?.id ?? null}
                onAddRoot={handleAddRoot}
                expandedNodes={expandedNodes}
                onToggleExpand={handleToggleExpand}
                onFamilyClick={handleFamilyClick}
                selectedFamilyId={selectedFamily?.link.id ?? null}
              />
            </div>
          </div>

          {/* Side panel */}
          <div className="w-64 flex-shrink-0 flex flex-col gap-3">
            {/* Add root node button when tree is not empty */}
            {bom.nodes.length > 0 && (
              <Button variant="outline" onClick={handleAddRoot} className="w-full">
                <IconPlus className="h-4 w-4 mr-2" />
                Nodo raíz
              </Button>
            )}

            {/* Selected node actions */}
            {selectedNode ? (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 border-b pb-2">
                  <IconInfoCircle className="h-4 w-4 text-rymel-blue" />
                  Nodo seleccionado
                </div>

                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900">
                    {selectedNode.semiFinished.code}
                  </p>
                  <p className="text-xs text-gray-500">{selectedNode.semiFinished.name}</p>
                  {selectedNode.type && (
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${typeBadgeColors[selectedNode.type]}`}
                    >
                      {typeLabels[selectedNode.type]}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddChild}
                    className="w-full"
                  >
                    <IconPlus className="h-4 w-4 mr-1" />
                    Agregar hijo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddFamilies}
                    className="w-full"
                  >
                    <IconGhost2 className="h-4 w-4 mr-1" />
                    Agregar fantasmas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditNode}
                    className="w-full"
                  >
                    <IconEdit className="h-4 w-4 mr-1" />
                    Editar nodo
                  </Button>
                  <button
                    onClick={handleDeleteNode}
                    className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <IconTrash className="h-4 w-4" />
                    Eliminar nodo
                  </button>
                </div>
              </div>
            ) : selectedFamily ? (
              <BomPhantomFamilyPanel
                bomId={bomId}
                link={selectedFamily.link}
                parentCode={selectedFamily.parent.semiFinished.code}
                onRemove={() => setFamilyToRemove(selectedFamily.link)}
              />
            ) : (
              <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                Haz clic en un nodo del árbol para ver sus acciones
              </div>
            )}

            {/* Stats */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Estadísticas
              </p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total nodos</span>
                <span className="font-semibold text-gray-800">{countNodes(bom.nodes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Niveles</span>
                <span className="font-semibold text-gray-800">{treeDepth(bom.nodes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Familias de fantasmas</span>
                <span className="font-semibold text-gray-800">{countFamilies(bom.nodes)}</span>
              </div>
            </div>
          </div>
        </div>
      </Page>

      {/* Modals */}
      {showAddNodeModal && (
        <BomNodeFormModal
          bomId={bomId}
          parentNode={addingChildOf}
          onClose={() => {
            setShowAddNodeModal(false);
            setAddingChildOf(null);
          }}
        />
      )}

      {showEditNodeModal && selectedNode && (
        <BomNodeFormModal
          bomId={bomId}
          editingNode={selectedNode}
          onClose={() => setShowEditNodeModal(false)}
        />
      )}

      {showAddFamiliesModal && selectedNode && (
        <BomPhantomFamiliesModal
          bomId={bomId}
          node={selectedNode}
          onClose={() => setShowAddFamiliesModal(false)}
        />
      )}

      {showProductTypesModal && (
        <BomProductTypesModal
          bomId={bomId}
          current={productTypes}
          onClose={() => setShowProductTypesModal(false)}
        />
      )}

      {familyToRemove && (
        <Modal isOpen={true} onClose={() => setFamilyToRemove(null)} title="Quitar familia">
          <div className="space-y-5">
            <p className="text-gray-600 text-sm">
              ¿Quitar <strong>{familyToRemove.family.name}</strong> ({familyToRemove.process.name}) del
              árbol? Los fantasmas no se modifican.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setFamilyToRemove(null)} className="flex-1">
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={confirmRemoveFamily}
                isLoading={removeFamilyMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Quitar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showEditBomModal && (
        <BomFormModal
          bom={bomAsListItem}
          onClose={() => setShowEditBomModal(false)}
        />
      )}

      {showDeleteConfirm && selectedNode && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteConfirm(false)}
          title="Eliminar nodo"
        >
          <div className="space-y-5">
            <p className="text-gray-600 text-sm">
              ¿Estás seguro de eliminar el nodo{' '}
              <strong>{selectedNode.semiFinished.code}</strong>? También se
              eliminarán todos sus nodos hijos.
              {countFamilies([selectedNode]) > 0 &&
                ` Se quitarán ${countFamilies([selectedNode])} familia(s) de fantasmas.`}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteNode}
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

function countNodes(nodes: BomNode[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countNodes(n.children ?? []), 0);
}

function countFamilies(nodes: BomNode[]): number {
  return nodes.reduce(
    (acc, n) => acc + (n.phantomFamilies?.length ?? 0) + countFamilies(n.children ?? []),
    0,
  );
}

function findNode(nodes: BomNode[], id: number): BomNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}

function findFamily(
  nodes: BomNode[],
  linkId: number,
): { link: BomNodePhantomFamily; parent: BomNode } | null {
  for (const node of nodes) {
    const link = node.phantomFamilies?.find((l) => l.id === linkId);
    if (link) return { link, parent: node };
    const found = findFamily(node.children ?? [], linkId);
    if (found) return found;
  }
  return null;
}

function treeDepth(nodes: BomNode[]): number {
  if (!nodes || nodes.length === 0) return 0;
  return 1 + Math.max(...nodes.map((n) => treeDepth(n.children ?? [])));
}
