import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { columnIndexToLabel } from "@rymel/formula-engine";
import {
  GRID_COLUMNS,
  GRID_ROWS,
  isReadOnly,
  type TemplateCell,
  type TemplateSheet,
} from "@rymel/design-template";
import type { CellValueMap, FormulaValue } from "@rymel/formula-engine";
import { GridCell } from "./GridCell";
import { refOf, type UseGridSelectionResult } from "@hooks/useGridSelection";
import { isInsideRange } from "./range";

const DEFAULT_COLUMN_WIDTH = 96;
const DEFAULT_ROW_HEIGHT = 28;
const HEADER_WIDTH = 48;
const HEADER_HEIGHT = 28;

/**
 * Filas y columnas que se dibujan fuera de la ventana visible.
 *
 * Sin margen, desplazarse deja huecos en blanco durante un fotograma. Con
 * demasiado, la virtualización deja de servir para algo.
 */
const OVERSCAN = 6;

interface Props {
  sheet: TemplateSheet;
  values: CellValueMap;
  selection: UseGridSelectionResult;
  /** Celda en edición, si la hay. */
  editing: string | null;
  editingValue: string;
  onEditingValueChange: (value: string) => void;
  onStartEditing: (ref: string) => void;
  onCommitEditing: (move: "down" | "right" | "none") => void;
  onCancelEditing: () => void;
  /** Devuelve el valor de la vista previa, si la hay, para esa celda. */
  previewValue?: (ref: string) => FormulaValue | undefined;
  onResizeColumn: (column: number, width: number) => void;
  onResizeRow: (row: number, height: number) => void;
  onContextMenu?: (ref: string, event: React.MouseEvent) => void;
  onRowHeaderContextMenu?: (row: number, event: React.MouseEvent) => void;
  onColumnHeaderContextMenu?: (column: number, event: React.MouseEvent) => void;
  /**
   * Ofrece la celda al modo fórmula antes de seleccionarla. Si la consume, la
   * selección no se mueve: se está señalando una referencia, no navegando.
   */
  onPickCell?: (ref: string) => boolean;
  /** Si la celda alimenta a la activa o la usa, para resaltarla. */
  traceOf?: (ref: string) => "precedent" | "dependent" | undefined;
}

/**
 * La rejilla de la plantilla.
 *
 * Mismas dimensiones que el diseñador de project-front —250 × 50— porque es
 * contrato: una plantilla escrita aquí tiene que caber allá, y la hoja
 * `Tablas` real llega a la fila 232 y `Resumen` a la columna `AH`.
 *
 * Se dibuja solo la ventana visible. Renderizar las 12 500 celdas es lo que
 * hace el diseñador, y ya le cuesta; aquí es peor caso, porque en un editor se
 * escribe celda a celda durante horas.
 */
export const TemplateGrid = ({
  sheet,
  values,
  selection,
  editing,
  editingValue,
  onEditingValueChange,
  onStartEditing,
  onCommitEditing,
  onCancelEditing,
  previewValue,
  onResizeColumn,
  onResizeRow,
  onContextMenu,
  onRowHeaderContextMenu,
  onColumnHeaderContextMenu,
  onPickCell,
  traceOf,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ top: 0, left: 0, height: 600, width: 900 });
  const [dragging, setDragging] = useState(false);

  /**
   * Si el puntero se ha movido de verdad desde que se pulsó.
   *
   * Arrastrar no es lo único que hace entrar el puntero en otra celda: al
   * seleccionar una celda con fórmula aparece la barra del modo fórmula, la
   * rejilla baja y las celdas pasan por debajo de un puntero que no se ha
   * movido. Sin esta distinción eso se leía como un arrastre y marcaba las
   * dos o tres celdas que habían desfilado por encima.
   */
  const pointerMoved = useRef(false);

  const columnWidth = useCallback(
    (column: number) => sheet.styles.columnWidths[column] ?? DEFAULT_COLUMN_WIDTH,
    [sheet.styles.columnWidths],
  );
  const rowHeight = useCallback(
    (row: number) => sheet.styles.rowHeights[row] ?? DEFAULT_ROW_HEIGHT,
    [sheet.styles.rowHeights],
  );

  const hiddenRows = useMemo(
    () => new Set(sheet.styles.hiddenRows),
    [sheet.styles.hiddenRows],
  );
  const hiddenColumns = useMemo(
    () => new Set(sheet.styles.hiddenColumns),
    [sheet.styles.hiddenColumns],
  );

  /** Desplazamiento acumulado de cada fila y columna, saltando las ocultas. */
  const { rowOffsets, totalHeight } = useMemo(() => {
    const offsets: number[] = [];
    let accumulated = 0;
    for (let row = 0; row < GRID_ROWS; row++) {
      offsets.push(accumulated);
      if (!hiddenRows.has(row)) accumulated += rowHeight(row);
    }
    return { rowOffsets: offsets, totalHeight: accumulated };
  }, [hiddenRows, rowHeight]);

  const { columnOffsets, totalWidth } = useMemo(() => {
    const offsets: number[] = [];
    let accumulated = 0;
    for (let column = 0; column < GRID_COLUMNS; column++) {
      offsets.push(accumulated);
      if (!hiddenColumns.has(column)) accumulated += columnWidth(column);
    }
    return { columnOffsets: offsets, totalWidth: accumulated };
  }, [hiddenColumns, columnWidth]);

  const visibleRows = useMemo(() => {
    const rows: number[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      if (hiddenRows.has(row)) continue;
      const top = rowOffsets[row];
      if (
        top + rowHeight(row) >= viewport.top - OVERSCAN * DEFAULT_ROW_HEIGHT &&
        top <= viewport.top + viewport.height + OVERSCAN * DEFAULT_ROW_HEIGHT
      ) {
        rows.push(row);
      }
    }
    return rows;
  }, [hiddenRows, rowOffsets, rowHeight, viewport]);

  const visibleColumns = useMemo(() => {
    const columns: number[] = [];
    for (let column = 0; column < GRID_COLUMNS; column++) {
      if (hiddenColumns.has(column)) continue;
      const left = columnOffsets[column];
      if (
        left + columnWidth(column) >=
          viewport.left - OVERSCAN * DEFAULT_COLUMN_WIDTH &&
        left <= viewport.left + viewport.width + OVERSCAN * DEFAULT_COLUMN_WIDTH
      ) {
        columns.push(column);
      }
    }
    return columns;
  }, [hiddenColumns, columnOffsets, columnWidth, viewport]);

  /**
   * Lo que se dibuja: la ventana visible más lo inmovilizado.
   *
   * Las filas y columnas inmovilizadas tienen que estar siempre, aunque el
   * desplazamiento las haya dejado fuera de la ventana: son precisamente las
   * que no deben perderse de vista. La plantilla real inmoviliza siete filas.
   */
  const renderedRows = useMemo(() => {
    const frozen: number[] = [];
    for (let row = 0; row < sheet.styles.freezeRow; row++) {
      if (!hiddenRows.has(row)) frozen.push(row);
    }
    return [...new Set([...frozen, ...visibleRows])].sort((a, b) => a - b);
  }, [sheet.styles.freezeRow, hiddenRows, visibleRows]);

  const renderedColumns = useMemo(() => {
    const frozen: number[] = [];
    for (let column = 0; column < sheet.styles.freezeColumn; column++) {
      if (!hiddenColumns.has(column)) frozen.push(column);
    }
    return [...new Set([...frozen, ...visibleColumns])].sort((a, b) => a - b);
  }, [sheet.styles.freezeColumn, hiddenColumns, visibleColumns]);

  /** Celdas combinadas, indexadas por su celda superior izquierda. */
  const merges = useMemo(() => {
    const byStart = new Map<string, { rowSpan: number; colSpan: number }>();
    const covered = new Set<string>();

    for (const merged of sheet.styles.mergedCells) {
      byStart.set(merged.startCell, {
        rowSpan: merged.rowSpan,
        colSpan: merged.colSpan,
      });

      const start = merged.startCell.match(/^([A-Z]+)(\d+)$/);
      if (!start) continue;
      const startRow = Number(start[2]) - 1;
      const startColumn = columnOffsets.findIndex(
        (_, index) => columnIndexToLabel(index) === start[1],
      );
      for (let row = startRow; row < startRow + merged.rowSpan; row++) {
        for (
          let column = startColumn;
          column < startColumn + merged.colSpan;
          column++
        ) {
          const ref = refOf(row, column);
          if (ref !== merged.startCell) covered.add(ref);
        }
      }
    }

    return { byStart, covered };
  }, [sheet.styles.mergedCells, columnOffsets]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () =>
      setViewport({
        top: container.scrollTop,
        left: container.scrollLeft,
        height: container.clientHeight,
        width: container.clientWidth,
      });

    update();
    container.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(container);

    return () => {
      container.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  /** Redimensionado de columna o fila, arrastrando el borde de su encabezado. */
  const startResize = (
    kind: "column" | "row",
    index: number,
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const start = kind === "column" ? event.clientX : event.clientY;
    const initial = kind === "column" ? columnWidth(index) : rowHeight(index);

    const onMove = (moveEvent: MouseEvent) => {
      const delta = (kind === "column" ? moveEvent.clientX : moveEvent.clientY) - start;
      const size = Math.max(kind === "column" ? 40 : 18, initial + delta);
      if (kind === "column") onResizeColumn(index, size);
      else onResizeRow(index, size);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const zoneOf = useCallback(
    (ref: string) =>
      sheet.styles.semiFinishedZones.find((zone) =>
        isInsideRange(ref, zone.startCell, zone.endCell),
      ),
    [sheet.styles.semiFinishedZones],
  );

  const namedRangeStart = useMemo(
    () => new Set(sheet.styles.namedRanges.map((range) => range.startCell)),
    [sheet.styles.namedRanges],
  );

  return (
    <div className="relative flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Esquina fija */}
      <div
        className="absolute left-0 top-0 z-30 border-b border-r border-gray-300 bg-gray-100"
        style={{ width: HEADER_WIDTH, height: HEADER_HEIGHT }}
      />

      {/* Encabezado de columnas */}
      <div
        className="absolute top-0 z-20 overflow-hidden border-b border-gray-300 bg-gray-100"
        style={{ left: HEADER_WIDTH, right: 0, height: HEADER_HEIGHT }}
      >
        <div
          className="relative h-full"
          style={{ width: totalWidth, transform: `translateX(${-viewport.left}px)` }}
        >
          {visibleColumns.map((column) => (
            <div
              key={column}
              className={`absolute flex h-full items-center justify-center border-r border-gray-300 text-xs font-medium ${
                selection.rect.left <= column && column <= selection.rect.right
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-600"
              }`}
              style={{ left: columnOffsets[column], width: columnWidth(column) }}
              onContextMenu={(event) => onColumnHeaderContextMenu?.(column, event)}
              onClick={() =>
                selection.selectRange(
                  { row: 0, column },
                  { row: GRID_ROWS - 1, column },
                )
              }
            >
              {columnIndexToLabel(column)}
              <span
                onMouseDown={(event) => startResize("column", column, event)}
                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-rymel-blue"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Encabezado de filas */}
      <div
        className="absolute left-0 z-20 overflow-hidden border-r border-gray-300 bg-gray-100"
        style={{ top: HEADER_HEIGHT, bottom: 0, width: HEADER_WIDTH }}
      >
        <div
          className="relative w-full"
          style={{ height: totalHeight, transform: `translateY(${-viewport.top}px)` }}
        >
          {visibleRows.map((row) => (
            <div
              key={row}
              className={`absolute flex w-full items-center justify-center border-b border-gray-300 text-xs font-medium ${
                selection.rect.top <= row && row <= selection.rect.bottom
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-600"
              }`}
              style={{ top: rowOffsets[row], height: rowHeight(row) }}
              onContextMenu={(event) => onRowHeaderContextMenu?.(row, event)}
              onClick={() =>
                selection.selectRange(
                  { row, column: 0 },
                  { row, column: GRID_COLUMNS - 1 },
                )
              }
            >
              {row + 1}
              <span
                onMouseDown={(event) => startResize("row", row, event)}
                className="absolute bottom-0 left-0 h-1 w-full cursor-row-resize hover:bg-rymel-blue"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Celdas */}
      <div
        ref={containerRef}
        className="absolute overflow-auto"
        style={{ top: HEADER_HEIGHT, left: HEADER_WIDTH, right: 0, bottom: 0 }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onMouseMove={() => {
          pointerMoved.current = true;
        }}
      >
        <div className="relative" style={{ width: totalWidth, height: totalHeight }}>
          {renderedRows.map((row) =>
            renderedColumns.map((column) => {
              const ref = refOf(row, column);
              if (merges.covered.has(ref)) return null;

              const span = merges.byStart.get(ref);
              const width = span
                ? spanSize(columnWidth, column, span.colSpan, hiddenColumns)
                : columnWidth(column);
              const height = span
                ? spanSize(rowHeight, row, span.rowSpan, hiddenRows)
                : rowHeight(row);

              const cell: TemplateCell | undefined = sheet.cells[ref];
              const qualified = `${sheet.name}!${ref}`;

              // Lo inmovilizado se compensa con el desplazamiento, así que se
              // queda quieto mientras el resto se mueve por debajo.
              const rowFrozen = row < sheet.styles.freezeRow;
              const columnFrozen = column < sheet.styles.freezeColumn;

              return (
                <GridCell
                  key={ref}
                  cellRef={ref}
                  cell={cell}
                  value={previewValue?.(ref) ?? values[qualified] ?? ""}
                  frozen={
                    rowFrozen && columnFrozen
                      ? "both"
                      : rowFrozen
                        ? "rows"
                        : columnFrozen
                          ? "columns"
                          : undefined
                  }
                  style={{
                    position: "absolute",
                    top: rowOffsets[row] + (rowFrozen ? viewport.top : 0),
                    left: columnOffsets[column] + (columnFrozen ? viewport.left : 0),
                    width,
                    height,
                    // Por encima de las celdas normales, para que no las tape
                    // el contenido que pasa por debajo.
                    zIndex: rowFrozen || columnFrozen ? 10 : undefined,
                  }}
                  isActive={selection.isActive(row, column)}
                  isSelected={selection.isSelected(row, column)}
                  isEditing={editing === ref}
                  editingValue={editingValue}
                  zone={zoneOf(ref)}
                  isNamedRangeStart={namedRangeStart.has(ref)}
                  onEditingValueChange={onEditingValueChange}
                  onCommitEditing={onCommitEditing}
                  onCancelEditing={onCancelEditing}
                  readOnly={isReadOnly(sheet.styles, ref)}
                  trace={traceOf?.(ref)}
                  onMouseDown={(event) => {
                    // El botón derecho no selecciona: colapsaría la selección
                    // justo antes de abrir el menú que opera sobre ella.
                    if (event.button !== 0) return;
                    if (onPickCell?.(ref)) return;
                    selection.select(row, column, event.shiftKey);
                    setDragging(true);
                    pointerMoved.current = false;
                  }}
                  onMouseEnter={() => {
                    if (dragging && pointerMoved.current) {
                      selection.select(row, column, true);
                    }
                  }}
                  onDoubleClick={() => onStartEditing(ref)}
                  onContextMenu={(event) => onContextMenu?.(ref, event)}
                />
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
};

/** Tamaño total de un rango combinado, saltando lo oculto. */
const spanSize = (
  sizeOf: (index: number) => number,
  start: number,
  span: number,
  hidden: Set<number>,
): number => {
  let total = 0;
  for (let index = start; index < start + span; index++) {
    if (!hidden.has(index)) total += sizeOf(index);
  }
  return total || sizeOf(start);
};
