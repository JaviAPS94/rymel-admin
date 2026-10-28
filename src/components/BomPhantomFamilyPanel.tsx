import { IconGhost2, IconExternalLink, IconTrash } from '@tabler/icons-react';
import { Link } from 'wouter';
import { useOfferedPhantomItems } from '@hooks/useBom';
import type { BomNodePhantomFamily } from '@/types/bom.types';

interface BomPhantomFamilyPanelProps {
  bomId: number;
  link: BomNodePhantomFamily;
  parentCode: string;
  onRemove: () => void;
}

/** La familia seleccionada en el árbol: los fantasmas que ofrece la estructura. */
export const BomPhantomFamilyPanel = ({ bomId, link, parentCode, onRemove }: BomPhantomFamilyPanelProps) => {
  const { data: items, isLoading, isError } = useOfferedPhantomItems(bomId, link.family.id);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 border-b pb-2">
        <IconGhost2 className="h-4 w-4 text-violet-500" />
        Familia de fantasmas
      </div>

      <div className="space-y-0.5">
        <p className="text-lg font-bold text-gray-900">{link.family.name}</p>
        <p className="text-xs text-gray-500">{link.process.name}</p>
        <p className="text-xs text-gray-400">Bajo {parentCode}</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Fantasmas que ofrece {items ? `(${items.length})` : ''}
        </p>
        {isLoading ? (
          <p className="text-xs text-gray-400">Cargando...</p>
        ) : isError ? (
          <p className="text-xs text-red-600">No se pudieron cargar los fantasmas.</p>
        ) : !items || items.length === 0 ? (
          <p className="text-xs text-amber-700">
            Ningún fantasma de esta familia tiene un tipo de equipo de la estructura.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto border border-gray-100 rounded">
            <table className="w-full text-[11px]">
              <thead className="bg-gray-50 text-gray-500 sticky top-0">
                <tr>
                  <th className="text-left px-2 py-1 font-medium">Ítem</th>
                  <th className="text-left px-2 py-1 font-medium">Tipo PT</th>
                  <th className="text-right px-2 py-1 font-medium" title="Componentes">Comp.</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100" title={item.reference}>
                    <td className="px-2 py-1">
                      <Link href={`/phantom-items/${item.id}`} className="font-medium text-rymel-blue hover:underline">
                        {item.itemCode}
                      </Link>
                      <div className="text-gray-400 truncate max-w-[9rem]">{item.reference}</div>
                    </td>
                    <td className="px-2 py-1 text-gray-700">{item.finishedProductType}</td>
                    <td className="px-2 py-1 text-right text-gray-700">{item.componentsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Link
        href={`/phantom-items?process=${link.process.id}&family=${link.family.id}`}
        className="flex items-center gap-1 text-xs text-rymel-blue hover:underline"
      >
        <IconExternalLink className="h-3.5 w-3.5" />
        Ver en Fantasmas
      </Link>

      <button
        onClick={onRemove}
        className="w-full flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
      >
        <IconTrash className="h-4 w-4" />
        Quitar del árbol
      </button>
    </div>
  );
};
