import { memo, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { FormulaValue } from "@rymel/formula-engine";
import {
  isGraphicContent,
  type SemiFinishedZone,
  type TemplateCell,
} from "@rymel/design-template";

/**
 * Color de una zona de semielaborado, por su código.
 *
 * La misma paleta que usa el diseñador de project-front, para que una zona se
 * vea igual en los dos sitios: el autor la pinta aquí y el diseñador la
 * reconoce allá.
 */
const ZONE_COLORS: Record<string, { bg: string; border: string }> = {
  BOBINA: { bg: "#fef3c7", border: "#f59e0b" },
  NUCLEO: { bg: "#dbeafe", border: "#3b82f6" },
  TANQUEMETALMECANICA: { bg: "#e0e7ff", border: "#6366f1" },
  TANQUEPINTADO: { bg: "#f3e8ff", border: "#a855f7" },
  ENSAMBLEFINAL: { bg: "#dcfce7", border: "#22c55e" },
};

const DEFAULT_ZONE_COLOR = { bg: "#f3f4f6", border: "#9ca3af" };

interface Props {
  cellRef: string;
  cell: TemplateCell | undefined;
  value: FormulaValue;
  style: CSSProperties;
  isActive: boolean;
  isSelected: boolean;
  isEditing: boolean;
  editingValue: string;
  zone?: SemiFinishedZone;
  isNamedRangeStart: boolean;
  /** Si la celda pertenece a una fila o columna inmovilizada. */
  frozen?: "rows" | "columns" | "both";
  onEditingValueChange: (value: string) => void;
  onCommitEditing: (move: "down" | "right" | "none") => void;
  onCancelEditing: () => void;
  onMouseDown: (event: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onDoubleClick: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
}

/** Lo que se muestra: el valor calculado, con sus decimales si los declara. */
const displayValue = (cell: TemplateCell | undefined, value: FormulaValue): string => {
  if (cell && isGraphicContent(cell.content)) return "▦ gráfico";
  if (value === "" || value === undefined || value === null) return "";

  const decimals = cell?.format?.decimals;
  if (typeof value === "number" && decimals !== undefined) {
    return value.toFixed(decimals);
  }
  return String(value);
};

/** Color del texto si la celda declara formato condicional y el valor entra. */
const conditionalColor = (
  cell: TemplateCell | undefined,
  value: FormulaValue,
): string | undefined => {
  const rule = cell?.format?.conditionalFormat;
  if (!rule || typeof value !== "number") return undefined;
  if (rule.min !== undefined && value < rule.min) return undefined;
  if (rule.max !== undefined && value > rule.max) return undefined;
  return rule.color;
};

const GridCellComponent = ({
  cellRef,
  cell,
  value,
  style,
  isActive,
  isSelected,
  isEditing,
  editingValue,
  zone,
  isNamedRangeStart,
  frozen,
  onEditingValueChange,
  onCommitEditing,
  onCancelEditing,
  onMouseDown,
  onMouseEnter,
  onDoubleClick,
  onContextMenu,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(
        editingValue.length,
        editingValue.length,
      );
    }
    // Solo al entrar en edición: mover el cursor en cada tecla lo haría
    // imposible de escribir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const format = cell?.format;
  const zoneColor = zone
    ? (ZONE_COLORS[zone.semiFinishedCode] ?? DEFAULT_ZONE_COLOR)
    : undefined;

  const background =
    format?.backgroundColor ?? zoneColor?.bg ?? (isSelected ? "#eff6ff" : undefined);

  const isError = typeof value === "string" && value.startsWith("#");

  /**
   * Los bordes se arman aparte, y solo con lo que la celda declara.
   *
   * No es manía: React escribe cada propiedad del objeto de estilo, y una
   * propiedad `undefined` la escribe como cadena vacía. Poner `border` junto a
   * `borderTop`, `borderRight`, `borderBottom` y `borderLeft` en `undefined`
   * hacía que los cuatro lados **borraran** el borde que el atajo acababa de
   * poner. En la plantilla real son 1907 celdas con borde, y no se veía
   * ninguna.
   */
  const borders: CSSProperties = {};
  if (format?.border !== undefined) borders.border = format.border;
  if (format?.borderTop !== undefined) borders.borderTop = format.borderTop;
  if (format?.borderRight !== undefined) borders.borderRight = format.borderRight;
  if (format?.borderBottom !== undefined) {
    borders.borderBottom = format.borderBottom;
  }
  if (format?.borderLeft !== undefined) borders.borderLeft = format.borderLeft;

  return (
    <div
      // La referencia va en el DOM para poder comprobar qué se pinta en cada
      // celda, y para localizarla al depurar.
      data-cell={cellRef}
      data-frozen={frozen}
      data-selected={isSelected}
      style={{
        ...style,
        backgroundColor: background,
        color: conditionalColor(cell, value) ?? format?.textColor,
        fontWeight: format?.bold ? 600 : undefined,
        ...borders,
        outline: isActive ? "2px solid #2563eb" : undefined,
        outlineOffset: isActive ? "-2px" : undefined,
        boxShadow: zoneColor ? `inset 0 0 0 1px ${zoneColor.border}` : undefined,
      }}
      className={`flex items-center overflow-hidden border-b border-r border-gray-200 px-1 text-xs ${
        isError ? "text-red-600" : ""
      } ${typeof value === "number" ? "justify-end" : "justify-start"}`}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      title={cell?.note ?? (cell?.content?.startsWith("=") ? cell.content : undefined)}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editingValue}
          onChange={(event) => onEditingValueChange(event.target.value)}
          onBlur={() => onCommitEditing("none")}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onCommitEditing("down");
            } else if (event.key === "Tab") {
              event.preventDefault();
              onCommitEditing("right");
            } else if (event.key === "Escape") {
              event.preventDefault();
              onCancelEditing();
            }
          }}
          className="h-full w-full border-none bg-white px-0 text-xs outline-none"
        />
      ) : (
        <>
          <span className="truncate">{displayValue(cell, value)}</span>

          {/* Señales de lo que la celda declara, para que no haya que abrirla */}
          <span className="ml-auto flex shrink-0 items-center gap-0.5">
            {cell?.elementKey && (
              <span
                title={`Se rellena con el dato "${cell.elementKey}" del elemento`}
                className="text-[9px] text-purple-600"
              >
                ⬤
              </span>
            )}
            {cell?.itemLink && (
              <span title="Enlazada a un ítem del catálogo" className="text-[9px] text-emerald-600">
                ◆
              </span>
            )}
            {cell?.goTo && (
              <span title="Navega a un rango con nombre" className="text-[9px] text-blue-600">
                ➔
              </span>
            )}
            {cell?.options && cell.options.length > 0 && (
              <span title="Lista desplegable" className="text-[9px] text-gray-500">
                ▾
              </span>
            )}
            {cell?.note && (
              <span title={cell.note} className="text-[9px] text-amber-600">
                ✎
              </span>
            )}
            {isNamedRangeStart && (
              <span title={`Inicio de un rango con nombre (${cellRef})`} className="text-[9px] text-indigo-600">
                ▣
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
};

/**
 * Memoizada por sus datos: al escribir en una celda, las demás visibles no
 * tienen por qué volver a dibujarse. Con 250 × 50 celdas la diferencia entre
 * memoizar y no hacerlo se nota al teclear.
 */
export const GridCell = memo(GridCellComponent);
