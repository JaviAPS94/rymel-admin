import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconArrowLeft,
  IconDeviceFloppy,
  IconEye,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { Layout } from "@components/Layout";
import { Button } from "@components/ui/Button";
import { FormulaBar } from "@components/template/FormulaBar";
import { FormulaModeBar } from "@components/template/FormulaModeBar";
import { FormatToolbar } from "@components/template/FormatToolbar";
import { SheetTabs } from "@components/template/SheetTabs";
import { RegionsPanel } from "@components/template/RegionsPanel";
import { CellBindingsPanel } from "@components/template/CellBindingsPanel";
import { DiagnosticsPanel } from "@components/template/DiagnosticsPanel";
import { PreviewPanel } from "@components/template/PreviewPanel";
import { TemplateGrid } from "@components/template/grid/TemplateGrid";
import {
  useDiscardDraft,
  useElementFields,
  usePublishTemplate,
  useTemplateDetail,
} from "@hooks/useTemplates";
import { useTemplateDocument } from "@hooks/useTemplateDocument";
import { useTemplateValidation } from "@hooks/useTemplateValidation";
import { useTemplateSave } from "@hooks/useTemplateSave";
import { useTemplatePreview } from "@hooks/useTemplatePreview";
import { useFormulaBuilder } from "@hooks/useFormulaBuilder";
import { positionOf, refOf, useGridSelection } from "@hooks/useGridSelection";
import {
  TemplateStatus,
  type TemplateDetail,
  type TemplateDiagnostic,
} from "@/types/template.types";

type SidePanel = "diagnostics" | "regions" | "bindings" | "preview";

/**
 * Editor de plantillas.
 *
 * Compone piezas pequeñas en vez de crecer como un componente único: la
 * rejilla, la barra de fórmulas, las pestañas, el formato y los paneles viven
 * cada uno en su archivo. Es una decisión explícita del cambio — el diseñador
 * de project-front es un solo componente de 6305 líneas, y esa es exactamente
 * la razón por la que no se pudo reutilizar aquí.
 */
export const TemplateEditorPage = () => {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const query = useTemplateDetail(Number.isFinite(id) ? id : null);
  const detail = query.data;

  return detail ? (
    <Editor key={detail.id} detailId={detail.id} />
  ) : (
    <Layout>
      <p className="text-sm text-gray-500">
        {query.isLoading ? "Cargando plantilla…" : "No se encontró la plantilla."}
      </p>
    </Layout>
  );
};

/**
 * El editor propiamente dicho.
 *
 * Va aparte para que el estado del documento se monte una sola vez, con la
 * plantilla ya cargada: un hook que arrancara con un documento vacío y luego
 * lo sustituyera perdería el historial en cada recarga.
 */
const Editor = ({ detailId }: { detailId: number }) => {
  const query = useTemplateDetail(detailId);
  const detail = query.data!;

  const validationSeed = useTemplateValidation(
    detail.document,
    detail.designSubTypeId,
  );

  const state = useTemplateDocument(detail.document, validationSeed.designFunctions);
  const validation = useTemplateValidation(state.document, detail.designSubTypeId);
  const selection = useGridSelection();
  const formula = useFormulaBuilder();
  const preview = useTemplatePreview(state.document, validation.designFunctions);
  const elementFields = useElementFields(detail.designSubTypeId);

  const publish = usePublishTemplate();
  const discard = useDiscardDraft();

  const [panel, setPanel] = useState<SidePanel>("diagnostics");
  /**
   * Qué celda se está editando. **Lo que se escribe en ella no es estado
   * aparte**: es `formula.draft`.
   *
   * Tenerlo aparte era el motivo de que la barra de fórmulas no apareciera al
   * teclear el `=`: la celda lo sabía y el constructor no, así que había que
   * salir de la celda y volver a entrar para que se enterara. Con un solo
   * dueño no hay nada que sincronizar y no puede volver a desincronizarse.
   */
  const [editing, setEditing] = useState<string | null>(null);
  const [serverDiagnostics, setServerDiagnostics] = useState<TemplateDiagnostic[]>([]);

  const save = useTemplateSave(
    detail.id,
    state.document,
    state.dirtySheets,
    detail.draftUpdatedAt,
    // Las hojas que el servidor tiene ahora: con ellas se sabe si el editor
    // añadió, quitó o reordenó alguna, cosa que no ensucia ninguna hoja.
    detail.document.sheets.map((sheet) => sheet.name),
    useCallback(
      (updated: TemplateDetail, savedSheets: string[]) => {
        for (const sheet of savedSheets) state.markSheetSaved(sheet);
        query.refetch();
        void updated;
      },
      // `state` cambia en cada edición; solo interesa `markSheetSaved`, estable.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [state.markSheetSaved],
    ),
  );

  const sheet = state.activeSheet;

  /** Aviso del navegador al salir con cambios sin guardar. */
  useEffect(() => {
    if (!state.isDirty) return;

    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.isDirty]);

  /** Teclado de la rejilla: navegación, edición y deshacer. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT") return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save.save();
        return;
      }

      const moves: Record<string, [number, number]> = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
        Enter: [1, 0],
        Tab: [0, 1],
      };

      if (moves[event.key]) {
        event.preventDefault();
        selection.move(...moves[event.key]);
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        if (!sheet) return;
        for (const ref of selection.selectedRefs) {
          state.setCellContent(sheet.name, ref, "");
        }
        return;
      }

      // Empezar a escribir sustituye el contenido, como en cualquier hoja.
      if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
        setEditing(selection.activeRef);
        formula.start(event.key, sheet?.name ?? "");
        event.preventDefault();
      } else if (event.key === "F2") {
        setEditing(selection.activeRef);
        formula.start(
          sheet?.cells[selection.activeRef]?.content ?? "",
          sheet?.name ?? "",
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selection, sheet, state, save, formula]);

  const commitEditing = useCallback(
    (move: "down" | "right" | "none") => {
      if (editing && sheet) {
        state.setCellContent(sheet.name, editing, formula.draft);
      }
      setEditing(null);
      if (move === "down") selection.move(1, 0);
      if (move === "right") selection.move(0, 1);
    },
    [editing, formula, selection, sheet, state],
  );

  /** Lleva la selección al problema que se pulsó en el panel. */
  const navigateToDiagnostic = useCallback(
    (diagnostic: TemplateDiagnostic) => {
      if (diagnostic.sheet) state.setActiveSheetName(diagnostic.sheet);

      if (diagnostic.cell) {
        const position = positionOf(diagnostic.cell);
        if (position) selection.selectRange(position, position);
        return;
      }

      if (diagnostic.regionId && diagnostic.sheet) {
        const target = state.document.sheets.find(
          (item) => item.name === diagnostic.sheet,
        );
        const region = [
          ...(target?.styles.namedRanges ?? []),
          ...(target?.styles.semiFinishedZones ?? []),
          ...(target?.styles.itemCatalogTables ?? []),
        ].find((item) => item.id === diagnostic.regionId);

        if (region) {
          const from = positionOf(region.startCell);
          const to = positionOf(region.endCell);
          if (from && to) selection.selectRange(from, to);
          setPanel("regions");
        }
      }
    },
    [selection, state],
  );

  const usedElementKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const item of state.document.sheets) {
      for (const cell of Object.values(item.cells)) {
        if (cell.elementKey) keys.add(cell.elementKey);
      }
    }
    return [...keys];
  }, [state.document.sheets]);

  const previewValue = useCallback(
    (ref: string) =>
      sheet && preview.result
        ? preview.result.values[`${sheet.name}!${ref}`]
        : undefined,
    [preview.result, sheet],
  );

  const activeCell = sheet?.cells[selection.activeRef];

  /**
   * Al cambiar de celda, la barra pasa a mostrar su contenido.
   *
   * Dos casos en los que **no**, y los dos por el mismo motivo: el borrador
   * pertenece a otra celda y reescribirlo la vacía.
   *
   * - Mientras se señalan celdas para una fórmula, la selección se mueve a
   *   propósito y lo que se escribe es de la celda de origen.
   * - Mientras se está editando una celda, el borrador es el suyo. Cambiar de
   *   celda mueve la selección antes de que el input suelte el foco, así que
   *   sin esta guarda lo que se confirmaba en la celda editada era el
   *   contenido de la celda nueva: abrir una fórmula y pinchar en otro sitio
   *   la borraba.
   */
  const formulaKey = `${sheet?.name ?? ""}!${selection.activeRef}`;
  const [lastFormulaKey, setLastFormulaKey] = useState(formulaKey);
  if (
    formulaKey !== lastFormulaKey &&
    !formula.consumesClick &&
    editing === null
  ) {
    setLastFormulaKey(formulaKey);
    formula.start(activeCell?.content ?? "", sheet?.name ?? "");
  }

  /**
   * Publicar guarda antes.
   *
   * El editor trabaja sobre su documento en memoria; el servidor publica lo
   * que tiene guardado. Sin este paso, pulsar «Publicar» con cambios sin
   * guardar respondía que no había cambios —o publicaba una versión anterior—,
   * que es lo contrario de lo que el usuario acaba de hacer.
   */
  const onPublish = async () => {
    if (save.hasPendingChanges) {
      const saved = await save.save();
      if (!saved) return;
    }

    publish.mutate(
      { id: detail.id, dto: {} },
      {
        onSuccess: (result) => {
          // El servidor valida por su cuenta: si rechaza, sus diagnósticos son
          // los que mandan, aunque el editor considerara la plantilla lista.
          setServerDiagnostics(result.published ? [] : result.diagnostics);
          if (result.published) query.refetch();
        },
      },
    );
  };

  /**
   * No se pinta la plantilla hasta tener el catálogo de fórmulas de diseño.
   *
   * Es lo que hace el diseñador, que no monta la hoja hasta tenerlo. Sin
   * esperar, las celdas que invocan una fórmula de diseño se pintan un
   * instante con `#ERROR` —al montar, `QUADRATIC` no es una función conocida—
   * y se corrigen solas cuando el catálogo llega. Corregirse solas ya está
   * garantizado; enseñar el error mientras tanto no aporta nada.
   */
  if (validation.isLoadingFunctions) {
    return (
      <Layout>
        <p className="text-sm text-gray-500">Cargando fórmulas de diseño…</p>
      </Layout>
    );
  }

  if (!sheet) {
    return (
      <Layout>
        <div className="space-y-4">
          <Header
            detail={detail}
            isDirty={state.isDirty}
            onSave={() => void save.save()}
          />
          <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            La plantilla no tiene hojas. Añade una para empezar.
          </p>
          <SheetTabs
            sheets={state.document.sheets}
            activeSheetName={state.activeSheetName}
            dirtySheets={state.dirtySheets}
            onSelect={state.setActiveSheetName}
            onAdd={state.addSheet}
            onRename={state.renameSheet}
            onRemove={state.removeSheet}
            onReorder={state.reorderSheets}
            countReferences={state.countSheetReferences}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] flex-col gap-2">
        <Header
          detail={detail}
          isDirty={state.isDirty}
          onSave={() => void save.save()}
        />

        {save.conflict && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-900">
            <IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-medium">
                La plantilla cambió en otra sesión desde que la cargaste.
              </p>
              <p>
                No se sobrescribió nada. Recarga para traer los cambios; lo que
                tengas sin guardar se perderá.
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => query.refetch()}>
                  Recargar
                </Button>
                <Button size="sm" variant="outline" onClick={save.dismissConflict}>
                  Seguir editando
                </Button>
              </div>
            </div>
          </div>
        )}

        {serverDiagnostics.length > 0 && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">
              El servidor rechazó la publicación con {serverDiagnostics.length}{" "}
              problema(s):
            </p>
            <ul className="mt-1 list-disc pl-5">
              {serverDiagnostics.map((diagnostic, index) => (
                <li key={index}>
                  {diagnostic.sheet}
                  {diagnostic.cell && `!${diagnostic.cell}`}: {diagnostic.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            title="Deshacer"
            disabled={!state.canUndo}
            onClick={state.undo}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
          >
            <IconArrowBackUp className="h-4 w-4" />
          </button>
          <button
            title="Rehacer"
            disabled={!state.canRedo}
            onClick={state.redo}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
          >
            <IconArrowForwardUp className="h-4 w-4" />
          </button>

          <FormatToolbar
            activeCell={activeCell}
            selectedRefs={selection.selectedRefs}
            rect={selection.rect}
            styles={sheet.styles}
            onApplyFormat={(patch) => {
              for (const ref of selection.selectedRefs) {
                const existing = sheet.cells[ref];
                state.updateCell(sheet.name, ref, {
                  format: { ...existing?.format, ...patch },
                });
              }
            }}
            onClearFormat={() => {
              for (const ref of selection.selectedRefs) {
                state.updateCell(sheet.name, ref, { format: undefined });
              }
            }}
            onSetStyles={(styles) => state.setSheetStyles(sheet.name, styles)}
            onMerge={() =>
              state.setSheetStyles(sheet.name, {
                ...sheet.styles,
                mergedCells: [
                  ...sheet.styles.mergedCells,
                  {
                    startCell: refOf(selection.rect.top, selection.rect.left),
                    endCell: refOf(selection.rect.bottom, selection.rect.right),
                    rowSpan: selection.rect.bottom - selection.rect.top + 1,
                    colSpan: selection.rect.right - selection.rect.left + 1,
                  },
                ],
              })
            }
            onUnmerge={() =>
              state.setSheetStyles(sheet.name, {
                ...sheet.styles,
                mergedCells: sheet.styles.mergedCells.filter(
                  (merged) =>
                    merged.startCell !== refOf(selection.rect.top, selection.rect.left),
                ),
              })
            }
          />
        </div>

        <FormulaBar
          activeRef={selection.activeRef}
          sheetName={sheet.name}
          content={activeCell?.content ?? ""}
          value={state.values[`${sheet.name}!${selection.activeRef}`] ?? ""}
          draft={formula.draft}
          onDraftChange={formula.setDraft}
          onCursorChange={formula.setCursor}
          inputRef={formula.inputRef}
          onCommit={(content) =>
            state.setCellContent(sheet.name, lastFormulaKey.split("!")[1], content)
          }
        />

        {/* Aparece sola en cuanto el contenido empieza por `=`, como en el
            diseñador: es donde se escriben las fórmulas por primera vez. */}
        {formula.isActive && (
          <FormulaModeBar
            cursor={formula.cursor}
            isPicking={formula.isPicking}
            rangeStart={formula.rangeStart}
            activeRef={selection.activeRef}
            designFunctions={validation.designFunctionCatalog}
            onTogglePicking={formula.togglePicking}
            onToggleRange={() => formula.toggleRange(selection.activeRef)}
            onInsert={formula.insert}
            onExit={() => {
              state.setCellContent(
                sheet.name,
                lastFormulaKey.split("!")[1],
                formula.draft,
              );
              formula.finish();
            }}
          />
        )}

        <div className="flex min-h-0 flex-1 gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <TemplateGrid
              sheet={sheet}
              values={state.values}
              selection={selection}
              editing={editing}
              editingValue={formula.draft}
              previewValue={preview.result ? previewValue : undefined}
              onEditingValueChange={formula.setDraft}
              onStartEditing={(ref) => {
                setEditing(ref);
                formula.start(sheet.cells[ref]?.content ?? "", sheet.name);
              }}
              onPickCell={(ref) => formula.pickCell(sheet.name, ref)}
              onCommitEditing={commitEditing}
              onCancelEditing={() => {
                setEditing(null);
                formula.start(activeCell?.content ?? "", sheet.name);
              }}
              onResizeColumn={(column, width) =>
                state.setSheetStyles(sheet.name, {
                  ...sheet.styles,
                  columnWidths: { ...sheet.styles.columnWidths, [column]: width },
                })
              }
              onResizeRow={(row, height) =>
                state.setSheetStyles(sheet.name, {
                  ...sheet.styles,
                  rowHeights: { ...sheet.styles.rowHeights, [row]: height },
                })
              }
            />

            <SheetTabs
              sheets={state.document.sheets}
              activeSheetName={state.activeSheetName}
              dirtySheets={state.dirtySheets}
              onSelect={state.setActiveSheetName}
              onAdd={state.addSheet}
              onRename={state.renameSheet}
              onRemove={state.removeSheet}
              onReorder={state.reorderSheets}
              countReferences={state.countSheetReferences}
            />
          </div>

          <div className="flex w-80 shrink-0 flex-col gap-2">
            <div className="flex gap-1 text-xs">
              {(
                [
                  ["diagnostics", `Problemas (${validation.diagnostics.length})`],
                  ["regions", "Regiones"],
                  ["bindings", "Celda"],
                  ["preview", "Vista previa"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setPanel(id)}
                  className={`flex-1 rounded px-1 py-1.5 ${
                    panel === id
                      ? "bg-rymel-blue text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1">
              {panel === "diagnostics" && (
                <DiagnosticsPanel
                  bySheet={validation.bySheet}
                  documentLevel={validation.documentLevel}
                  total={validation.diagnostics.length}
                  onNavigate={navigateToDiagnostic}
                  decimalCommaCells={state.decimalCommaCells}
                  onNormalizeDecimals={state.normalizeDecimals}
                />
              )}

              {panel === "regions" && (
                <RegionsPanel
                  styles={sheet.styles}
                  rect={selection.rect}
                  onSetStyles={(styles) => state.setSheetStyles(sheet.name, styles)}
                  onGoToRegion={(start, end) => {
                    const from = positionOf(start);
                    const to = positionOf(end);
                    if (from && to) selection.selectRange(from, to);
                  }}
                />
              )}

              {panel === "bindings" && (
                <CellBindingsPanel
                  sheetName={sheet.name}
                  activeRef={selection.activeRef}
                  cell={activeCell}
                  sheets={state.document.sheets}
                  elementFields={elementFields.data ?? []}
                  onUpdate={(patch) =>
                    state.updateCell(sheet.name, selection.activeRef, patch)
                  }
                />
              )}

              {panel === "preview" && (
                <PreviewPanel
                  preview={preview}
                  elementFields={elementFields.data ?? []}
                  usedKeys={usedElementKeys}
                  onClose={() => {
                    preview.clear();
                    setPanel("diagnostics");
                  }}
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setPanel("preview")}
              >
                <IconEye className="mr-1 h-4 w-4" />
                Vista previa
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={!validation.canPublish || publish.isPending}
                title={
                  validation.canPublish
                    ? "Publicar la plantilla"
                    : "Hay problemas por resolver antes de publicar"
                }
                onClick={() => void onPublish()}
              >
                <IconUpload className="mr-1 h-4 w-4" />
                Publicar
              </Button>
            </div>

            {detail.hasDraft && detail.status === TemplateStatus.PUBLISHED && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Se descartan los cambios sin publicar y vuelve la versión publicada. ¿Continuar?",
                    )
                  ) {
                    discard.mutate(detail.id, {
                      onSuccess: () => query.refetch(),
                    });
                  }
                }}
                className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-red-600"
              >
                <IconTrash className="h-3.5 w-3.5" />
                Descartar cambios sin publicar
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const Header = ({
  detail,
  isDirty,
  onSave,
}: {
  detail: { id: number; version: number; hasDraft: boolean; document: { name: string; code: string } };
  isDirty: boolean;
  onSave: () => void;
}) => (
  <div className="flex items-start justify-between">
    <div>
      <Link href="/templates">
        <span className="inline-flex cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-rymel-blue">
          <IconArrowLeft className="h-3.5 w-3.5" />
          Plantillas
        </span>
      </Link>
      <h1 className="text-xl font-bold text-gray-900">{detail.document.name}</h1>
      <p className="text-xs text-gray-500">
        <span className="font-mono">{detail.document.code}</span> · versión{" "}
        {detail.version}
        {isDirty && (
          <span className="ml-2 font-medium text-amber-700">
            Cambios sin guardar
          </span>
        )}
      </p>
    </div>

    <Button onClick={onSave} disabled={!isDirty}>
      <IconDeviceFloppy className="mr-1 h-4 w-4" />
      Guardar
    </Button>
  </div>
);

export default TemplateEditorPage;
