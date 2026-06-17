import { IconPlus } from '@tabler/icons-react';
import type { BomNode } from '@/types/bom.types';
import { BomNodeType } from '@/types/bom.types';

interface BomTreeNodeProps {
  node: BomNode;
  onNodeClick: (node: BomNode) => void;
  selectedNodeId: number | null;
}

const nodeTypeStyle: Record<string, string> = {
  [BomNodeType.STANDARD]:
    'bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-500 hover:bg-amber-100',
  [BomNodeType.CRITICAL]:
    'bg-orange-400 border-orange-600 text-white hover:bg-orange-500',
  [BomNodeType.REFERENCE]:
    'bg-blue-100 border-blue-300 text-blue-900 hover:border-blue-500 hover:bg-blue-200',
};

const BomTreeNode = ({ node, onNodeClick, selectedNodeId }: BomTreeNodeProps) => {
  const hasChildren = node.children?.length > 0;
  const isSelected = selectedNodeId === node.id;
  const colorClass = nodeTypeStyle[node.type ?? BomNodeType.STANDARD];

  return (
    <li>
      <div className="bom-node-drop">
        <button
          onClick={() => onNodeClick(node)}
          className={`
            px-4 py-2 rounded border-2 cursor-pointer min-w-[80px]
            text-center text-xs font-semibold select-none transition-all duration-150 whitespace-nowrap
            ${colorClass}
            ${isSelected ? 'ring-2 ring-offset-1 ring-rymel-blue shadow-lg scale-105' : 'hover:shadow-md'}
          `}
        >
          <span className="block font-bold tracking-wide">{node.semiFinished.code}</span>
          <span className="block font-normal opacity-75 text-[10px] mt-0.5">
            {node.semiFinished.name}
          </span>
        </button>

        {hasChildren && (
          <ul>
            {node.children.map((child) => (
              <BomTreeNode
                key={child.id}
                node={child}
                onNodeClick={onNodeClick}
                selectedNodeId={selectedNodeId}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
};

interface BomTreeProps {
  bomCode: string;
  bomName: string;
  nodes: BomNode[];
  onNodeClick: (node: BomNode) => void;
  selectedNodeId: number | null;
  onAddRoot: () => void;
}

export const BomTree = ({
  bomCode,
  bomName,
  nodes,
  onNodeClick,
  selectedNodeId,
  onAddRoot,
}: BomTreeProps) => {
  const hasNodes = nodes && nodes.length > 0;

  return (
    <div className="bom-tree-container">
      <div className="bom-tree">
        {/* BOM virtual root node */}
        <div className="flex flex-col items-center">
          <div className="px-5 py-2.5 rounded-lg border-2 border-rymel-blue bg-white text-center whitespace-nowrap shadow-sm">
            <span className="block font-bold tracking-wide text-xs text-rymel-blue uppercase">
              {bomCode}
            </span>
            <span className="block text-[10px] text-gray-500 mt-0.5 font-normal">
              {bomName}
            </span>
          </div>

          {/* Children */}
          {hasNodes ? (
            <ul>
              {nodes.map((rootNode) => (
                <BomTreeNode
                  key={rootNode.id}
                  node={rootNode}
                  onNodeClick={onNodeClick}
                  selectedNodeId={selectedNodeId}
                />
              ))}
            </ul>
          ) : (
            /* Empty state below the BOM root */
            <div className="flex flex-col items-center mt-5 gap-3 text-gray-400">
              <div className="w-px h-8 bg-gray-300" />
              <p className="text-xs">Agrega el primer nodo para comenzar</p>
              <button
                onClick={onAddRoot}
                className="flex items-center gap-2 px-4 py-2 bg-rymel-blue text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
              >
                <IconPlus className="h-4 w-4" />
                Agregar nodo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
