import { useState, type FormEvent } from 'react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { useAddBomNode, useUpdateBomNode, useSemiFinished } from '@hooks/useBom';
import { BomNodeType, type BomNode, type CreateBomNodeDto, type UpdateBomNodeDto } from '@/types/bom.types';

interface BomNodeFormModalProps {
  bomId: number;
  parentNode?: BomNode | null;
  editingNode?: BomNode | null;
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  [BomNodeType.STANDARD]: 'Estándar',
  [BomNodeType.CRITICAL]: 'Crítico',
  [BomNodeType.REFERENCE]: 'Referencia',
};

const typeColors: Record<string, string> = {
  [BomNodeType.STANDARD]: 'bg-amber-50 border-amber-300 text-amber-800',
  [BomNodeType.CRITICAL]: 'bg-orange-400 border-orange-500 text-white',
  [BomNodeType.REFERENCE]: 'bg-blue-100 border-blue-300 text-blue-900',
};

export const BomNodeFormModal = ({
  bomId,
  parentNode,
  editingNode,
  onClose,
}: BomNodeFormModalProps) => {
  const addMutation = useAddBomNode(bomId);
  const updateMutation = useUpdateBomNode(bomId);
  const { data: semiFinishedList, isLoading: loadingSF } = useSemiFinished();

  const [semiFinishedId, setSemiFinishedId] = useState<number>(
    editingNode?.semiFinished.id ?? 0,
  );
  const [type, setType] = useState<BomNodeType>(
    editingNode?.type ?? BomNodeType.STANDARD,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const filtered = (semiFinishedList ?? []).filter(
    (sf) =>
      sf.code.toLowerCase().includes(search.toLowerCase()) ||
      sf.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!semiFinishedId) {
      setErrors({ semiFinished: 'Selecciona un semielaborado' });
      return;
    }

    if (editingNode) {
      const data: UpdateBomNodeDto = { semiFinishedId, type };
      updateMutation.mutate({ nodeId: editingNode.id, data }, { onSuccess: () => onClose() });
    } else {
      const data: CreateBomNodeDto = {
        semiFinishedId,
        type,
        ...(parentNode ? { parentId: parentNode.id } : {}),
      };
      addMutation.mutate(data, { onSuccess: () => onClose() });
    }
  };

  const isLoading = addMutation.isPending || updateMutation.isPending;
  const isEditing = !!editingNode;

  const title = isEditing
    ? 'Editar nodo'
    : parentNode
      ? `Agregar hijo de "${parentNode.semiFinished.code}"`
      : 'Agregar nodo raíz';

  return (
    <Modal isOpen={true} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Semi-finished selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Semielaborado</label>

          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rymel-blue"
          />

          {loadingSF ? (
            <p className="text-sm text-gray-400 py-2">Cargando...</p>
          ) : (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 p-3 text-center">Sin resultados</p>
              ) : (
                filtered.map((sf) => (
                  <button
                    key={sf.id}
                    type="button"
                    onClick={() => setSemiFinishedId(sf.id)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors ${
                      semiFinishedId === sf.id
                        ? 'bg-rymel-blue text-white'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="font-semibold min-w-[60px]">{sf.code}</span>
                    <span className="opacity-75 truncate">{sf.name}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {errors.semiFinished && (
            <p className="text-xs text-red-600">{errors.semiFinished}</p>
          )}
        </div>

        {/* Node type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tipo de nodo</label>
          <div className="flex gap-2">
            {Object.values(BomNodeType).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 px-3 rounded border-2 text-xs font-semibold transition-all ${
                  type === t
                    ? typeColors[t] + ' ring-2 ring-offset-1 ring-rymel-blue'
                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {typeLabels[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
            {isEditing ? 'Actualizar' : 'Agregar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
