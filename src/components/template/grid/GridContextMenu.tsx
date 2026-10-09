import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { MenuGroups } from "../contextMenu";

interface Props<Action extends string> {
  /** Coordenadas del clic, relativas a la ventana. */
  x: number;
  y: number;
  title?: string;
  groups: MenuGroups<Action>;
  onSelect: (action: Action) => void;
  onClose: () => void;
}

const MARGIN = 8;

/**
 * El menú contextual, solo su presentación.
 *
 * Se coloca donde se hizo clic y, si no cabe, se recoloca para quedar entero
 * dentro de la ventana: abierto cerca del borde inferior, con catorce
 * entradas, se saldría. Se cierra con un clic fuera o con `Escape`.
 */
export const GridContextMenu = <Action extends string>({
  x,
  y,
  title,
  groups,
  onSelect,
  onClose,
}: Props<Action>) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPosition({
      left: Math.max(MARGIN, Math.min(x, window.innerWidth - width - MARGIN)),
      top: Math.max(MARGIN, Math.min(y, window.innerHeight - height - MARGIN)),
    });
  }, [x, y]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const visible = groups.filter((group) => group.length > 0);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onMouseDown={onClose}
        onContextMenu={(event) => {
          event.preventDefault();
          onClose();
        }}
      />
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-50 max-h-[85vh] min-w-64 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg"
        style={position}
      >
        {title && (
          <div className="px-3 py-1 font-mono text-xs text-gray-400">{title}</div>
        )}
        {visible.map((group, index) => (
          <Fragment key={index}>
            {(index > 0 || title) && <div className="my-1 border-t border-gray-100" />}
            {group.map((entry) => (
              <button
                key={entry.action}
                role="menuitem"
                disabled={entry.disabled}
                onClick={() => {
                  onSelect(entry.action);
                  onClose();
                }}
                className={`block w-full px-3 py-1.5 text-left hover:bg-gray-100 disabled:cursor-default disabled:text-gray-400 disabled:hover:bg-transparent ${
                  entry.tone === "danger" ? "text-red-600" : "text-gray-800"
                }`}
              >
                {entry.label}
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    </>
  );
};
