import { useMemo, useState } from 'react';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { usePhantomProductTypes, useSetBomProductTypes } from '@hooks/useBom';

interface BomProductTypesModalProps {
  bomId: number;
  current: string[];
  onClose: () => void;
}

const sameCode = (a: string, b: string) => a.trim().toUpperCase() === b.trim().toUpperCase();

/**
 * Los Tipos PT que soporta la estructura, elegidos de los que tienen los
 * fantasmas, tal como están escritos. Un tipo de la estructura que ya ningún
 * fantasma tiene se conserva y se marca.
 */
export const BomProductTypesModal = ({ bomId, current, onClose }: BomProductTypesModalProps) => {
  const { data: options = [], isLoading, isError } = usePhantomProductTypes();
  const setMutation = useSetBomProductTypes(bomId);
  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState<string[]>(current);

  const rows = useMemo(() => {
    const orphans = current
      .filter((code) => !options.some((option) => sameCode(option.code, code)))
      .map((code) => ({ code, count: 0 }));
    const term = search.trim().toUpperCase();
    return [...options, ...orphans].filter((row) => term === '' || row.code.toUpperCase().includes(term));
  }, [options, current, search]);

  const isChosen = (code: string) => chosen.some((c) => sameCode(c, code));
  const toggle = (code: string) =>
    setChosen((list) => (isChosen(code) ? list.filter((c) => !sameCode(c, code)) : [...list, code]));

  return (
    <Modal isOpen={true} onClose={onClose} title="Tipos de equipo de la estructura" maxWidth="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Cada familia del árbol ofrece solo los fantasmas con uno de estos Tipos PT. Sin ninguno, se ofrecen todos.
        </p>
        <input
          type="text"
          placeholder="Buscar tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rymel-blue"
        />
        <div className="max-h-72 overflow-y-auto border border-gray-200 rounded-lg grid grid-cols-2 gap-px bg-gray-100">
          {isLoading ? (
            <p className="col-span-2 bg-white text-sm text-gray-400 p-3 text-center">Cargando...</p>
          ) : isError ? (
            <p className="col-span-2 bg-white text-sm text-red-600 p-3 text-center">
              No se pudieron cargar los tipos.
            </p>
          ) : rows.length === 0 ? (
            <p className="col-span-2 bg-white text-sm text-gray-400 p-3 text-center">Sin resultados</p>
          ) : (
            rows.map((row) => (
              <label key={row.code} className="flex items-center gap-2 px-3 py-2 text-sm bg-white hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChosen(row.code)}
                  onChange={() => toggle(row.code)}
                  aria-label={row.code}
                />
                <span className="font-semibold text-gray-800">{row.code}</span>
                <span className={`ml-auto text-xs ${row.count === 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                  {row.count === 0 ? 'sin fantasmas' : row.count}
                </span>
              </label>
            ))
          )}
        </div>
        <p className="text-xs text-gray-500">{chosen.length} seleccionado(s)</p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            isLoading={setMutation.isPending}
            onClick={() => setMutation.mutate(chosen, { onSuccess: () => onClose() })}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
