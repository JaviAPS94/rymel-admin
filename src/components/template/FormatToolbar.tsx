import {
  IconBold,
  IconBorderAll,
  IconBorderNone,
  IconEyeOff,
  IconEye,
  IconLayoutGrid,
  IconLayoutGridRemove,
  IconPinned,
  IconPinnedOff,
} from "@tabler/icons-react";
import type {
  CellFormat,
  SheetStyles,
  TemplateCell,
} from "@rymel/design-template";
import type { Rect } from "@hooks/useGridSelection";

interface Props {
  /** Celda activa, para leer el formato que ya tiene. */
  activeCell: TemplateCell | undefined;
  selectedRefs: string[];
  rect: Rect;
  styles: SheetStyles;
  onApplyFormat: (patch: Partial<CellFormat>) => void;
  onClearFormat: () => void;
  onSetStyles: (styles: SheetStyles) => void;
  onMerge: () => void;
  onUnmerge: () => void;
}

const BORDER = "1px solid #000";

/**
 * Formato y estructura de la hoja.
 *
 * Todo se aplica **a la selección**, no a la celda activa: los bordes de una
 * tabla se ponen de una vez o no se ponen. En la plantilla real hay 1907
 * celdas con borde; a una por una no las puso nadie.
 */
export const FormatToolbar = ({
  activeCell,
  selectedRefs,
  rect,
  styles,
  onApplyFormat,
  onClearFormat,
  onSetStyles,
  onMerge,
  onUnmerge,
}: Props) => {
  const format = activeCell?.format;

  const selectedRows = Array.from(
    { length: rect.bottom - rect.top + 1 },
    (_, index) => rect.top + index,
  );
  const selectedColumns = Array.from(
    { length: rect.right - rect.left + 1 },
    (_, index) => rect.left + index,
  );

  const allRowsHidden = selectedRows.every((row) =>
    styles.hiddenRows.includes(row),
  );
  const allColumnsHidden = selectedColumns.every((column) =>
    styles.hiddenColumns.includes(column),
  );

  const toggleHidden = (kind: "rows" | "columns") => {
    const key = kind === "rows" ? "hiddenRows" : "hiddenColumns";
    const indices = kind === "rows" ? selectedRows : selectedColumns;
    const hidden = new Set(styles[key]);
    const allHidden = kind === "rows" ? allRowsHidden : allColumnsHidden;

    for (const index of indices) {
      if (allHidden) hidden.delete(index);
      else hidden.add(index);
    }

    onSetStyles({ ...styles, [key]: [...hidden].sort((a, b) => a - b) });
  };

  const isFrozen = styles.freezeRow > 0 || styles.freezeColumn > 0;

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5">
      <span className="mr-1 text-xs text-gray-500">
        {selectedRefs.length === 1
          ? selectedRefs[0]
          : `${selectedRefs.length} celdas`}
      </span>

      <ToolButton
        title="Negrita"
        action="bold"
        active={format?.bold === true}
        onClick={() => onApplyFormat({ bold: !format?.bold })}
      >
        <IconBold className="h-4 w-4" />
      </ToolButton>

      <ColorButton
        title="Color de texto"
        field="textColor"
        value={format?.textColor}
        fallback="#000000"
        onPick={(textColor) => onApplyFormat({ textColor })}
      >
        <span className="text-sm font-bold" style={{ color: format?.textColor }}>
          A
        </span>
      </ColorButton>

      <ColorButton
        title="Color de fondo"
        field="backgroundColor"
        value={format?.backgroundColor}
        fallback="#ffffff"
        onPick={(backgroundColor) => onApplyFormat({ backgroundColor })}
      >
        <span
          className="h-4 w-4 rounded border border-gray-300"
          style={{ backgroundColor: format?.backgroundColor ?? "#ffffff" }}
        />
      </ColorButton>

      <Divider />

      <ToolButton
        title="Borde en los cuatro lados"
        action="border"
        onClick={() => onApplyFormat({ border: BORDER })}
      >
        <IconBorderAll className="h-4 w-4" />
      </ToolButton>
      <ToolButton title="Quitar formato" onClick={onClearFormat}>
        <IconBorderNone className="h-4 w-4" />
      </ToolButton>

      <select
        title="Borde por lado"
        value=""
        onChange={(event) => {
          const side = event.target.value;
          if (side === "") return;
          onApplyFormat({ [side]: BORDER } as Partial<CellFormat>);
        }}
        className="h-7 rounded border border-gray-300 px-1 text-xs"
      >
        <option value="">Lado…</option>
        <option value="borderTop">Superior</option>
        <option value="borderRight">Derecho</option>
        <option value="borderBottom">Inferior</option>
        <option value="borderLeft">Izquierdo</option>
      </select>

      <Divider />

      <select
        title="Decimales a mostrar"
        data-format="decimals"
        value={format?.decimals ?? ""}
        onChange={(event) =>
          onApplyFormat({
            decimals:
              event.target.value === "" ? undefined : Number(event.target.value),
          })
        }
        className="h-7 rounded border border-gray-300 px-1 text-xs"
      >
        <option value="">Decimales</option>
        {[0, 1, 2, 3, 4].map((decimals) => (
          <option key={decimals} value={decimals}>
            {decimals}
          </option>
        ))}
      </select>

      <Divider />

      <ToolButton title="Combinar celdas" onClick={onMerge}>
        <IconLayoutGrid className="h-4 w-4" />
      </ToolButton>
      <ToolButton title="Separar celdas" onClick={onUnmerge}>
        <IconLayoutGridRemove className="h-4 w-4" />
      </ToolButton>

      <Divider />

      <ToolButton
        title={allRowsHidden ? "Mostrar filas" : "Ocultar filas"}
        onClick={() => toggleHidden("rows")}
      >
        {allRowsHidden ? (
          <IconEye className="h-4 w-4" />
        ) : (
          <IconEyeOff className="h-4 w-4" />
        )}
      </ToolButton>

      <ToolButton
        title={allColumnsHidden ? "Mostrar columnas" : "Ocultar columnas"}
        onClick={() => toggleHidden("columns")}
      >
        <span className="text-xs">{allColumnsHidden ? "◫" : "◧"}</span>
      </ToolButton>

      <ToolButton
        title={
          isFrozen
            ? "Quitar la inmovilización"
            : "Inmovilizar hasta la celda activa"
        }
        active={isFrozen}
        onClick={() =>
          onSetStyles(
            isFrozen
              ? { ...styles, freezeRow: 0, freezeColumn: 0 }
              : { ...styles, freezeRow: rect.top, freezeColumn: rect.left },
          )
        }
      >
        {isFrozen ? (
          <IconPinnedOff className="h-4 w-4" />
        ) : (
          <IconPinned className="h-4 w-4" />
        )}
      </ToolButton>
    </div>
  );
};

const Divider = () => <span className="mx-1 h-5 w-px bg-gray-200" />;

/**
 * Un selector de color con una superficie real donde pulsar.
 *
 * Antes el `input[type=color]` medía 0×0 y se apoyaba en la etiqueta que lo
 * envolvía: el selector no llegaba a abrirse y elegir un color no hacía nada.
 * Ahora el input ocupa todo el botón, invisible pero pulsable, y lo que se ve
 * debajo es solo la muestra.
 */
const ColorButton = ({
  title,
  field,
  value,
  fallback,
  onPick,
  children,
}: {
  title: string;
  field: string;
  value: string | undefined;
  fallback: string;
  onPick: (color: string) => void;
  children: React.ReactNode;
}) => (
  <span
    title={title}
    className="relative flex h-7 w-7 items-center justify-center rounded hover:bg-gray-100"
  >
    {children}
    <input
      type="color"
      data-format={field}
      value={value ?? fallback}
      onChange={(event) => onPick(event.target.value)}
      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
    />
  </span>
);

const ToolButton = ({
  title,
  action,
  active,
  onClick,
  children,
}: {
  title: string;
  /** Ancla estable para localizar el control, en pruebas y al depurar. */
  action?: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    title={title}
    data-action={action}
    onClick={onClick}
    className={`flex h-7 w-7 items-center justify-center rounded hover:bg-gray-100 ${
      active ? "bg-blue-100 text-rymel-blue" : "text-gray-600"
    }`}
  >
    {children}
  </button>
);
