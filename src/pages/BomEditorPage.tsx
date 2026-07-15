import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import {
  IconArrowLeft,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSitemap,
  IconInfoCircle,
} from '@tabler/icons-react';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';
import { Layout } from '@components/Layout';
import { BomTree } from '@components/BomTree';
import { BomNodeFormModal } from '@components/BomNodeFormModal';
import { BomFormModal } from '@components/BomFormModal';
import { useBom, useDeleteBomNode } from '@hooks/useBom';
import { BomNodeType, type BomNode, type BomListItem } from '@/types/bom.types';

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

  const [selectedNode, setSelectedNode] = useState<BomNode | null>(null);
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [showEditNodeModal, setShowEditNodeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditBomModal, setShowEditBomModal] = useState(false);
  const [addingChildOf, setAddingChildOf] = useState<BomNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const handleNodeClick = (node: BomNode) => {
    setSelectedNode((prev) => (prev?.id === node.id ? null : node));
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
          setSelectedNode(null);
          setShowDeleteConfirm(false);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32 text-gray-400">
          Cargando árbol BOM...
        </div>
      </Layout>
    );
  }

  if (error || !bom) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p className="text-red-500">Error al cargar el BOM</p>
          <Button variant="outline" onClick={() => navigate('/bom')}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
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

  return (
    <Layout>
      <div className="flex flex-col h-full gap-4">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/bom')}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <IconArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <IconSitemap className="h-6 w-6 text-rymel-blue" />
                <h1 className="text-2xl font-bold text-gray-900">{bom.code}</h1>
                <button
                  onClick={() => setShowEditBomModal(true)}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Editar BOM"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{bom.name}</p>
            </div>
          </div>

          {/* Leyenda */}
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <span className="font-medium">Tipos:</span>
            <span className="px-2 py-1 bg-amber-50 border border-amber-300 text-amber-800 rounded">
              Estándar
            </span>
            <span className="px-2 py-1 bg-orange-400 border border-orange-600 text-white rounded">
              Crítico
            </span>
            <span className="px-2 py-1 bg-blue-100 border border-blue-300 text-blue-900 rounded">
              Referencia
            </span>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Tree area */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-auto">
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
            </div>
          </div>
        </div>
      </div>

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
                variant="primary"
                onClick={confirmDeleteNode}
                isLoading={deleteMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
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

function treeDepth(nodes: BomNode[]): number {
  if (!nodes || nodes.length === 0) return 0;
  return 1 + Math.max(...nodes.map((n) => treeDepth(n.children ?? [])));
}
