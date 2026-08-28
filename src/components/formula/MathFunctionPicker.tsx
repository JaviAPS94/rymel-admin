import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import {
  MATH_FUNCTION_GROUPS,
  type MathFunctionEntry,
} from "@components/formula/mathFunctions";

const PANEL_WIDTH = 380;
const PANEL_MAX_HEIGHT = 360;
/** Por debajo de esto no cabe una lista útil y conviene abrir hacia arriba. */
const MIN_USEFUL_HEIGHT = 240;
const MARGIN = 12;

interface Props {
  /** El botón que lo abre: de él salen las coordenadas. */
  anchor: HTMLElement | null;
  onInsert: (entry: MathFunctionEntry) => void;
  onClose: () => void;
}

interface Row {
  kind: "group" | "entry";
  title: string;
  entry?: MathFunctionEntry;
}

/**
 * Referencia de funciones para la expresión.
 *
 * **Flota, no empuja.** En línea, cuarenta entradas desplazaban hacia abajo
 * las variables, las constantes y el probador, y el modal ya vive con
 * `overflow-y-auto`: consultar qué funciones hay obligaba a perder de vista lo
 * que se estaba escribiendo. Un panel absoluto tampoco valía —lo recortaba ese
 * mismo contenedor—, así que se posiciona `fixed` a partir del botón.
 *
 * Y se busca en vez de recorrer. Cuarenta entradas repartidas en seis grupos
 * son una lista que se lee entera cada vez; con el filtro se escribe «raíz» o
 * «log» y quedan dos. Las flechas y `Enter` cierran el ciclo sin soltar el
 * teclado, que es donde están las manos al escribir una fórmula.
 */
export const MathFunctionPicker = ({ anchor, onInsert, onClose }: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    height: number;
  } | null>(null);

  // Antes de pintar, para que no se vea saltar de sitio.
  useLayoutEffect(() => {
    if (!anchor) return;

    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - MARGIN * 2;
      const above = rect.top - MARGIN * 2;
      const openUp = below < MIN_USEFUL_HEIGHT && above > below;

      setPosition({
        height: Math.min(PANEL_MAX_HEIGHT, openUp ? above : below),
        top: openUp
          ? Math.max(MARGIN, rect.top - Math.min(PANEL_MAX_HEIGHT, above) - 8)
          : rect.bottom + 8,
        left: Math.max(
          MARGIN,
          Math.min(
            rect.right - PANEL_WIDTH,
            window.innerWidth - PANEL_WIDTH - MARGIN,
          ),
        ),
      });
    };

    place();
    window.addEventListener("resize", place);
    // En captura: el modal desplaza su propio contenido, y ese scroll no
    // burbujea hasta `window`.
    window.addEventListener("scroll", place, true);

    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchor?.contains(target))
        return;
      onClose();
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [anchor, onClose]);

  const rows = useMemo<Row[]>(() => {
    const term = search.trim().toLowerCase();
    const result: Row[] = [];

    for (const group of MATH_FUNCTION_GROUPS) {
      const matches = group.entries.filter(
        (entry) =>
          term === "" ||
          entry.signature.toLowerCase().includes(term) ||
          entry.description.toLowerCase().includes(term),
      );
      if (matches.length === 0) continue;

      result.push({ kind: "group", title: group.title });
      for (const entry of matches) {
        result.push({ kind: "entry", title: entry.signature, entry });
      }
    }

    return result;
  }, [search]);

  /** Solo lo insertable participa en la navegación con flechas. */
  const selectable = useMemo(
    () =>
      rows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row.kind === "entry" && row.entry?.insert !== ""),
    [rows],
  );

  useEffect(() => setHighlighted(0), [search]);

  const move = (delta: number) => {
    if (selectable.length === 0) return;
    setHighlighted(
      (current) => (current + delta + selectable.length) % selectable.length,
    );
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      // La tecla no sube. Hoy el modal no la escucha, así que no cambia nada;
      // el día que lo haga —cerrar con `Escape` es lo esperable en un
      // formulario— arrepentirse de una búsqueda no debe cerrar el formulario
      // entero.
      event.stopPropagation();
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const chosen = selectable[highlighted]?.row.entry;
      if (chosen) onInsert(chosen);
    }
  };

  if (position === null) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Funciones disponibles"
      data-testid="math-function-picker"
      onKeyDown={onKeyDown}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: PANEL_WIDTH,
        maxHeight: position.height,
      }}
      className="z-[60] flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl"
    >
      <div className="border-b border-gray-100 p-2">
        <div className="relative">
          <IconSearch className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
          <input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar función…"
            className="h-8 w-full rounded border border-gray-300 pl-8 pr-2 text-sm focus:border-rymel-blue focus:outline-none"
          />
        </div>
        <p className="mt-1.5 px-1 text-[11px] leading-snug text-gray-500">
          Las evalúa el motor de fórmulas, que no es el de las plantillas: aquí{" "}
          <code className="font-mono">SUMA</code> y{" "}
          <code className="font-mono">RAIZ</code> no existen.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-gray-500">
            Ninguna función coincide con «{search}».
          </p>
        ) : (
          rows.map((row, index) => {
            if (row.kind === "group") {
              return (
                <p
                  key={`g-${row.title}`}
                  className="sticky top-0 bg-white px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400"
                >
                  {row.title}
                </p>
              );
            }

            const entry = row.entry!;
            const position = selectable.findIndex(
              (item) => item.index === index,
            );
            const isHighlighted = position === highlighted && position !== -1;
            const insertable = entry.insert !== "";

            return (
              <button
                key={`${entry.signature}-${index}`}
                type="button"
                disabled={!insertable}
                data-function={entry.name}
                data-highlighted={isHighlighted}
                onMouseEnter={() => position !== -1 && setHighlighted(position)}
                onClick={() => insertable && onInsert(entry)}
                className={`flex w-full items-baseline gap-2 px-3 py-1 text-left ${
                  isHighlighted ? "bg-blue-50" : ""
                } ${insertable ? "cursor-pointer" : "cursor-default"}`}
              >
                <code
                  className={`shrink-0 font-mono text-xs ${
                    insertable ? "text-rymel-blue" : "text-gray-700"
                  }`}
                >
                  {entry.signature}
                </code>
                <span className="truncate text-xs text-gray-500">
                  {entry.description}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-3 py-1.5 text-[11px] text-gray-400">
        <span>↑↓ para moverse · Enter para insertar</span>
        <span>{selectable.length} funciones</span>
      </div>
    </div>
  );
};
