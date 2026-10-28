import { useMemo, useState } from 'react';
import { IconGhost2 } from '@tabler/icons-react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { usePhantomProcesses } from '@hooks/usePhantomProcesses';
import { useAddNodePhantomFamilies } from '@hooks/useBom';
import type { BomNode } from '@/types/bom.types';

interface BomPhantomFamiliesModalProps {
  bomId: number;
  node: BomNode;
  onClose: () => void;
}

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Elegir familias de fantasmas para colgarlas de un semielaborado. Agrupadas
 * por proceso, porque dos procesos pueden tener una familia con el mismo
 * nombre; las que el nodo ya tiene se ven pero no se pueden elegir.
 */
export const BomPhantomFamiliesModal = ({ bomId, node, onClose }: BomPhantomFamiliesModalProps) => {
  const { data: processes = [], isLoading, isError } = usePhantomProcesses();
  const addMutation = useAddNodePhantomFamilies(bomId);
  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState<number[]>([]);

  const already = useMemo(
    () => new Set((node.phantomFamilies ?? []).map((link) => link.family.id)),
    [node.phantomFamilies],
  );

  const groups = useMemo(() => {
    const term = normalize(search.trim());
    return processes
      .map((process) => ({
        process,
        families: process.families.filter(
          (family) =>
            term === '' ||
            normalize(family.name).includes(term) ||
            normalize(process.name).includes(term),
        ),
      }))
      .filter((group) => group.families.length > 0);
  }, [processes, search]);

  const toggle = (familyId: number) =>
    setChosen((current) =>
      current.includes(familyId) ? current.filter((id) => id !== familyId) : [...current, familyId],
    );

  const submit = () =>
    addMutation.mutate({ nodeId: node.id, familyIds: chosen }, { onSuccess: () => onClose() });

  return (
    <Modal isOpen={true} onClose={onClose} title={`Agregar fantasmas a "${node.semiFinished.code}"`} maxWidth="lg">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Buscar familia o proceso..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rymel-blue"
        />

        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
          {isLoading ? (
            <p className="text-sm text-gray-400 p-3 text-center">Cargando...</p>
          ) : isError ? (
            <p className="text-sm text-red-600 p-3 text-center">No se pudieron cargar los procesos.</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-gray-400 p-3 text-center">Sin resultados</p>
          ) : (
            groups.map(({ process, families }) => (
              <div key={process.id} role="group" aria-label={process.name}>
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
                  {process.name}
                </p>
                {families.map((family) => {
                  const added = already.has(family.id);
                  return (
                    <label
                      key={family.id}
                      className={`flex items-center gap-3 px-3 py-2 text-sm ${
                        added ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={added || chosen.includes(family.id)}
                        disabled={added}
                        onChange={() => toggle(family.id)}
                        aria-label={`${family.name} · ${process.name}`}
                      />
                      <IconGhost2 className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <span className="font-medium">{family.name}</span>
                      <span className="ml-auto text-xs text-gray-400">
                        {added ? 'ya agregada' : `${family.phantomItemsCount} fantasmas`}
                      </span>
                    </label>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-gray-500">
          El árbol muestra cuántos fantasmas de cada familia ofrece la estructura según sus tipos de equipo.
        </p>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            disabled={chosen.length === 0}
            isLoading={addMutation.isPending}
            onClick={submit}
          >
            {chosen.length > 1 ? `Agregar ${chosen.length} familias` : 'Agregar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
