import { IconPlus, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import type { BomNode } from '@/types/bom.types';
import { BomNodeType } from '@/types/bom.types';

interface BomTreeNodeProps {
  node: BomNode;
  depth: number;
  onNodeClick: (node: BomNode) => void;
  selectedNodeId: number | null;
  expandedNodes: Set<number>;
  onToggleExpand: (nodeId: number) => void;
}

const nodeTypeStyle: Record<string, string> = {
  [BomNodeType.STANDARD]: 'bg-amber-50 border-amber-300 text-amber-900',
  [BomNodeType.CRITICAL]: 'bg-orange-400 border-orange-600 text-white',
  [BomNodeType.REFERENCE]: 'bg-blue-100 border-blue-300 text-blue-900',
};

const INDENT_PX = 20;

const BomTreeNode = ({
  node,
  depth,
  onNodeClick,
  selectedNodeId,
  expandedNodes,
  onToggleExpand,
}: BomTreeNodeProps) => {
  const hasChildren = node.children?.length > 0;
  const isSelected = selectedNodeId === node.id;
  const isExpanded = expandedNodes.has(node.id);
  const colorClass = nodeTypeStyle[node.type ?? BomNodeType.STANDARD];

  return (
    <div>
      <div
        className="flex items-center gap-2 py-0.5"
        style={{ paddingLeft: `${depth * INDENT_PX}px` }}
      >
        <button
          onClick={() => hasChildren && onToggleExpand(node.id)}
          className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded transition-colors
            ${hasChildren
              ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer'
              : 'cursor-default'
            }`}
          tabIndex={hasChildren ? 0 : -1}
          aria-label={hasChildren ? (isExpanded ? 'Colapsar' : 'Expandir') : undefined}
        >
          {hasChildren && (
            isExpanded
              ? <IconChevronDown className="h-3.5 w-3.5" />
              : <IconChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        <div
          onClick={() => onNodeClick(node)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded border-2 cursor-pointer
            text-xs font-semibold select-none transition-all duration-150 whitespace-nowrap
            ${colorClass}
            ${isSelected ? 'ring-2 ring-offset-1 ring-rymel-blue shadow-md' : 'hover:shadow-sm'}
          `}
        >
          <span className="font-bold tracking-wide">{node.semiFinished.code}</span>
          <span className="font-normal opacity-75">{node.semiFinished.name}</span>
          {hasChildren && !isExpanded && (
            <span className="text-[10px] opacity-40 font-normal">({node.children.length})</span>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <BomTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onNodeClick={onNodeClick}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface BomTreeProps {
  bomCode: string;
  bomName: string;
  nodes: BomNode[];
  onNodeClick: (node: BomNode) => void;
  selectedNodeId: number | null;
  onAddRoot: () => void;
  expandedNodes: Set<number>;
  onToggleExpand: (nodeId: number) => void;
}

export const BomTree = ({
  bomCode,
  bomName,
  nodes,
  onNodeClick,
  selectedNodeId,
  onAddRoot,
  expandedNodes,
  onToggleExpand,
}: BomTreeProps) => {
  const hasNodes = nodes && nodes.length > 0;

  return (
    <div>
      {/* BOM root — alineado con los nodos */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 flex-shrink-0" />
        <div className="px-4 py-2 rounded-lg border-2 border-rymel-blue bg-white inline-flex items-center gap-3">
          <span className="text-xs font-bold text-rymel-blue uppercase tracking-wide">{bomCode}</span>
          <span className="text-xs text-gray-400 font-normal">{bomName}</span>
        </div>
      </div>

      {hasNodes ? (
        <div>
          {nodes.map((rootNode) => (
            <BomTreeNode
              key={rootNode.id}
              node={rootNode}
              depth={0}
              onNodeClick={onNodeClick}
              selectedNodeId={selectedNodeId}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center mt-8 gap-3 text-gray-400">
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
  );
};
