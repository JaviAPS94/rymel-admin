import { IconPlus, IconChevronDown, IconChevronRight, IconGhost2, IconAlertTriangle } from '@tabler/icons-react';
import type { BomNode, BomNodePhantomFamily } from '@/types/bom.types';
import { BomNodeType } from '@/types/bom.types';

interface BomTreeNodeProps {
  node: BomNode;
  depth: number;
  onNodeClick: (node: BomNode) => void;
  selectedNodeId: number | null;
  expandedNodes: Set<number>;
  onToggleExpand: (nodeId: number) => void;
  onFamilyClick: (family: BomNodePhantomFamily) => void;
  selectedFamilyId: number | null;
}

const nodeTypeStyle: Record<string, string> = {
  [BomNodeType.STANDARD]: 'bg-amber-50 border-amber-300 text-amber-900',
  [BomNodeType.CRITICAL]: 'bg-orange-400 border-orange-600 text-white',
  [BomNodeType.REFERENCE]: 'bg-blue-100 border-blue-300 text-blue-900',
};

const INDENT_PX = 20;

const offeredLabel = (offered: number) =>
  offered === 0
    ? 'sin fantasmas para los tipos de la estructura'
    : `${offered} fantasma${offered === 1 ? '' : 's'}`;

/** Una familia de fantasmas: hoja del semielaborado, sin tipo ni hijos. */
const PhantomFamilyLeaf = ({
  link,
  depth,
  selected,
  onClick,
}: {
  link: BomNodePhantomFamily;
  depth: number;
  selected: boolean;
  onClick: () => void;
}) => {
  const empty = link.offered === 0;
  return (
    <div className="flex items-center gap-2 py-0.5" style={{ paddingLeft: `${depth * INDENT_PX}px` }}>
      <div className="w-5 h-5 flex-shrink-0" />
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
        data-testid={`phantom-family-${link.id}`}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded border-2 border-dashed cursor-pointer
          text-xs select-none transition-all duration-150 whitespace-nowrap
          ${empty ? 'bg-amber-50 border-amber-400 text-amber-900' : 'bg-violet-50 border-violet-300 text-violet-900'}
          ${selected ? 'ring-2 ring-offset-1 ring-rymel-blue shadow-md' : 'hover:shadow-sm'}
        `}
      >
        <IconGhost2 className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="font-bold">{link.family.name}</span>
        <span className="opacity-60">· {link.process.name}</span>
        <span className={`flex items-center gap-1 ${empty ? 'font-medium' : 'opacity-60'}`}>
          {empty && <IconAlertTriangle className="h-3 w-3" />}
          {offeredLabel(link.offered)}
        </span>
      </div>
    </div>
  );
};

const BomTreeNode = ({
  node,
  depth,
  onNodeClick,
  selectedNodeId,
  expandedNodes,
  onToggleExpand,
  onFamilyClick,
  selectedFamilyId,
}: BomTreeNodeProps) => {
  const families = node.phantomFamilies ?? [];
  const childCount = (node.children?.length ?? 0) + families.length;
  const hasChildren = childCount > 0;
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
            <span className="text-[10px] opacity-40 font-normal">({childCount})</span>
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
              onFamilyClick={onFamilyClick}
              selectedFamilyId={selectedFamilyId}
            />
          ))}
          {/* Las familias van después de los semielaborados hijos */}
          {families.map((link) => (
            <PhantomFamilyLeaf
              key={`family-${link.id}`}
              link={link}
              depth={depth + 1}
              selected={selectedFamilyId === link.id}
              onClick={() => onFamilyClick(link)}
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
  onFamilyClick?: (family: BomNodePhantomFamily) => void;
  selectedFamilyId?: number | null;
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
  onFamilyClick = () => {},
  selectedFamilyId = null,
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
              onFamilyClick={onFamilyClick}
              selectedFamilyId={selectedFamilyId}
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
