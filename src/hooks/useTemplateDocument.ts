import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildGraph,
  buildRegistry,
  evaluateCell,
  getRecalcOrder,
  parseQualifiedRef,
  QUALIFIED_REF_SOURCE,
  splitRef,
  updateCellInGraph,
  FORMULA_CIRCULAR,
  type CellValueMap,
  type CustomFunctionDefinition,
  type DepGraph,
  type FormulaValue,
} from "@rymel/formula-engine";
import {
  bookRef,
  emptySheetStyles,
  findDecimalCommaCells,
  isGraphicContent,
  normalizeDecimalComma,
  normalizeDecimalCommas,
  type DecimalCommaCell,
  type SheetStyles,
  type TemplateCell,
  type TemplateDocument,
  type TemplateSheet,
} from "@rymel/design-template";

/**
 * Valor de una celda que invoca una fórmula de diseño y todavía no se ha
 * resuelto.
 *
 * El editor calcula en local y de forma síncrona; las fórmulas de diseño solo
 * las puede resolver el servidor. Marcarlas como pendientes —y no como error—
 * es lo que evita que una plantilla correcta se vea llena de `#ERROR` mientras
 * se escribe.
 */
export const FORMULA_PENDING = "…";

/**
 * El catálogo vacío, como constante.
 *
 * Un `= []` en el parámetro construye un array nuevo en cada render, y todo lo
 * que se memoice a partir de él cambia de identidad en cada render con él.
 */
const NO_FUNCTIONS: readonly CustomFunctionDefinition[] = [];

/**
 * Cuántos pasos se pueden deshacer. Suficiente para una sesión de trabajo sin
 * que el historial crezca sin límite.
 */
const HISTORY_LIMIT = 100;

export interface UseTemplateDocumentResult {
  document: TemplateDocument;
  /** Valor calculado por referencia calificada: `Tablas!J14`. */
  values: CellValueMap;
  activeSheet: TemplateSheet | undefined;
  activeSheetName: string;
  setActiveSheetName: (name: string) => void;

  getCell: (sheetName: string, ref: string) => TemplateCell | undefined;
  getValue: (sheetName: string, ref: string) => FormulaValue;
  isCircular: (sheetName: string, ref: string) => boolean;

  setCellContent: (sheetName: string, ref: string, content: string) => void;
  updateCell: (
    sheetName: string,
    ref: string,
    patch: Partial<TemplateCell>,
  ) => void;
  setSheetStyles: (sheetName: string, styles: SheetStyles) => void;

  addSheet: (name: string) => void;
  removeSheet: (name: string) => void;
  renameSheet: (from: string, to: string) => void;
  reorderSheets: (names: string[]) => void;
  /** Cuántas fórmulas de otras hojas nombran a ésta. */
  countSheetReferences: (name: string) => number;

  /** Celdas cuyo contenido es un decimal escrito con coma. */
  decimalCommaCells: DecimalCommaCell[];
  /** Los convierte todos, de una vez y a petición. */
  normalizeDecimals: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  /** Hojas con cambios sin guardar. */
  dirtySheets: Set<string>;
  isDirty: boolean;
  markSheetSaved: (name: string) => void;
  markAllSaved: () => void;
  replaceDocument: (document: TemplateDocument) => void;
}

/** Nombre de hoja tal como debe aparecer dentro de una fórmula. */
const quoteSheetName = (name: string): string =>
  /^[A-Za-z0-9_][A-Za-z0-9_.]*$/.test(name) ? name : `'${name.replace(/'/g, "''")}'`;

/**
 * Reescribe las referencias a `from` para que apunten a `to`.
 *
 * Exportada para poder probarla: es la parte del renombrado que puede
 * estropear una plantilla en silencio si se equivoca.
 */
export const renameInFormula = (formula: string, from: string, to: string): string => {
  if (!formula.startsWith("=")) return formula;

  return formula.replace(new RegExp(QUALIFIED_REF_SOURCE, "g"), (match) => {
    const qualified = parseQualifiedRef(match);
    if (!qualified || qualified.sheet !== from) return match;
    return `${quoteSheetName(to)}!${qualified.cell}`;
  });
};

/** El libro plano que espera el motor, con las celdas de todas las hojas. */
const toBook = (
  document: TemplateDocument,
): Record<string, { formula: string }> => {
  const book: Record<string, { formula: string }> = {};
  for (const sheet of document.sheets) {
    for (const [ref, cell] of Object.entries(sheet.cells)) {
      book[bookRef(sheet.name, ref)] = { formula: cell.content };
    }
  }
  return book;
};

/**
 * Recalcula las celdas indicadas y todo lo que dependa de ellas, en orden de
 * dependencias y **a través de las hojas**.
 *
 * Vive fuera del hook para poder sembrar el estado inicial: al abrir una
 * plantilla hay que calcularla entera antes del primer render, no esperar a
 * que alguien toque una celda.
 */
const recalculateBook = (
  graph: DepGraph,
  book: Record<string, { formula: string }>,
  dirtyRefs: string[],
  previous: CellValueMap,
  registry: ReturnType<typeof buildRegistry>,
): CellValueMap => {
  const { order, circular } = getRecalcOrder(graph, dirtyRefs);
  const next: CellValueMap = { ...previous };

  // Las hojas que existen salen de las propias claves del libro. Con ellas,
  // una fórmula que apunta a una hoja inexistente da error en vez de valer
  // cero en silencio, que es la diferencia entre ver el fallo y no verlo.
  const knownSheets = new Set<string>();
  for (const ref of Object.keys(book)) {
    const { sheet } = splitRef(ref);
    if (sheet !== undefined) knownSheets.add(sheet);
  }

  const evaluate = (ref: string): void => {
    const evaluation = evaluateCell(book[ref]?.formula ?? "", next, {
      // La hoja de la celda califica sus referencias locales: sin esto, `G13`
      // en una fórmula de `Resumen` no encuentra a `Resumen!G13` y vale cero.
      sheet: splitRef(ref).sheet,
      knownSheets,
      customFunctions: registry,
    });
    next[ref] = evaluation.status === "ok" ? evaluation.value : FORMULA_PENDING;
  };

  // Las celdas sin fórmula no aparecen en el orden de recálculo —no tienen
  // dependencias— pero su valor sí cambia al escribirlas.
  const ordered = new Set(order);
  for (const ref of dirtyRefs) if (!ordered.has(ref)) evaluate(ref);
  for (const ref of order) evaluate(ref);
  for (const ref of circular) next[ref] = FORMULA_CIRCULAR;

  return next;
};

/**
 * Estado del documento de una plantilla en el editor.
 *
 * La decisión que gobierna todo lo demás: **un solo libro plano indexado por
 * referencia calificada, y un solo grafo de dependencias para toda la
 * plantilla**. No es una comodidad. Con un grafo por hoja, editar `Tablas!J14`
 * no marca como sucias las celdas de `Resumen` que la consultan con `BUSCARV`
 * —que es justo lo que hace hoy project-front, recalculando hoja por hoja en
 * un bucle—, y el editor de plantillas es precisamente el sitio donde esas
 * referencias se escriben.
 *
 * El cálculo es síncrono y local. Las fórmulas de diseño quedan pendientes
 * hasta que la vista previa las resuelva contra el servidor.
 */
export const useTemplateDocument = (
  initial: TemplateDocument,
  designFunctions: readonly CustomFunctionDefinition[] = NO_FUNCTIONS,
): UseTemplateDocumentResult => {
  const registry = useMemo(
    () => buildRegistry(designFunctions),
    [designFunctions],
  );

  // Grafo y valores de partida se calculan juntos y una sola vez: al abrir una
  // plantilla hay que tenerla calculada antes del primer render, no esperar a
  // que alguien toque una celda.
  const [initialState] = useState(() => {
    const book = toBook(initial);
    const graph = buildGraph(book);
    return {
      graph,
      values: recalculateBook(
        graph,
        book,
        Object.keys(book),
        {},
        buildRegistry(designFunctions),
      ),
    };
  });

  const graphRef = useRef<DepGraph>(initialState.graph);
  const [document, setDocument] = useState<TemplateDocument>(initial);
  const [values, setValues] = useState<CellValueMap>(initialState.values);
  const [dirtySheets, setDirtySheets] = useState<Set<string>>(new Set());

  /**
   * Historial de instantáneas del documento.
   *
   * Guardar el documento entero suena caro y no lo es: cada edición solo
   * reconstruye la hoja tocada, así que las instantáneas comparten en memoria
   * todo lo que no cambió. A cambio, deshacer es exacto —vuelve el documento
   * que había— en vez de intentar invertir cada operación.
   */
  const [past, setPast] = useState<TemplateDocument[]>([]);
  const [future, setFuture] = useState<TemplateDocument[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>(
    initial.sheets[0]?.name ?? "",
  );

  const recalculate = useCallback(
    (doc: TemplateDocument, dirtyRefs: string[], previous: CellValueMap) =>
      recalculateBook(
        graphRef.current,
        toBook(doc),
        dirtyRefs,
        previous,
        registry,
      ),
    [registry],
  );

  /** Rehace el grafo y recalcula todo. Para cambios que mueven hojas enteras. */
  const rebuild = useCallback(
    (doc: TemplateDocument) => {
      const book = toBook(doc);
      graphRef.current = buildGraph(book);
      setValues(recalculate(doc, Object.keys(book), {}));
    },
    [recalculate],
  );

  /**
   * El catálogo de fórmulas de diseño llega por red, después del primer
   * cálculo.
   *
   * Sin esto, una plantilla guardada que invoca `=QUADRATIC(5)` se abría con
   * `#ERROR` en esa celda y ahí se quedaba: al montar, el catálogo todavía
   * estaba vacío, así que `QUADRATIC` era una función que nadie conocía. El
   * panel de problemas decía que la plantilla estaba bien —él sí esperaba al
   * catálogo—, lo que hacía el fallo más difícil de creer que de ver.
   *
   * Se recalcula el libro entero cuando el catálogo cambia, y solo entonces:
   * es una vez por carga, no una por edición.
   */
  const documentRef = useRef(document);
  documentRef.current = document;
  //  Por contenido y no por identidad: un `[]` escrito en la llamada es un
  //  array nuevo en cada render, y comparar identidades ahí es un bucle.
  const catalogKey = designFunctions.map((item) => item.code).join(",");
  const seededCatalog = useRef(catalogKey);

  useEffect(() => {
    if (seededCatalog.current === catalogKey) return;
    seededCatalog.current = catalogKey;
    rebuild(documentRef.current);
  }, [catalogKey, rebuild]);

  const markDirty = useCallback((name: string) => {
    setDirtySheets((previous) => new Set(previous).add(name));
  }, []);

  /** Apila el documento actual para poder deshacer, y corta el rehacer. */
  const remember = useCallback((snapshot: TemplateDocument) => {
    setPast((previous) => [...previous.slice(-HISTORY_LIMIT + 1), snapshot]);
    setFuture([]);
  }, []);

  const setCellContent = useCallback(
    (sheetName: string, ref: string, rawContent: string) => {
      // `3,36` es como se escribe un decimal en español, y el motor no lo
      // entiende: lo tomaría por texto. Se convierte en el momento de
      // escribirlo, para que el autor vea enseguida qué quedó guardado.
      const content = normalizeDecimalComma(rawContent);
      const qualified = bookRef(sheetName, ref);
      const sheets = document.sheets.map((sheet) => {
        if (sheet.name !== sheetName) return sheet;
        const existing = sheet.cells[ref] ?? { content: "" };
        return {
          ...sheet,
          cells: { ...sheet.cells, [ref]: { ...existing, content } },
        };
      });

      const next = { ...document, sheets };
      remember(document);
      updateCellInGraph(graphRef.current, qualified, content);
      setDocument(next);
      setValues((current) => recalculate(next, [qualified], current));
      markDirty(sheetName);
    },
    [document, markDirty, recalculate, remember],
  );

  /** Cambia lo que no es contenido: formato, nota, enlaces, `elementKey`. */
  const updateCell = useCallback(
    (sheetName: string, ref: string, patch: Partial<TemplateCell>) => {
      remember(document);
      setDocument((previous) => ({
        ...previous,
        sheets: previous.sheets.map((sheet) =>
          sheet.name === sheetName
            ? {
                ...sheet,
                cells: {
                  ...sheet.cells,
                  // El patch se aplica **sobre** la celda existente: cambiar
                  // una nota no puede llevarse por delante su formato.
                  [ref]: { ...(sheet.cells[ref] ?? { content: "" }), ...patch },
                },
              }
            : sheet,
        ),
      }));
      markDirty(sheetName);
    },
    [document, markDirty, remember],
  );

  const setSheetStyles = useCallback(
    (sheetName: string, styles: SheetStyles) => {
      remember(document);
      setDocument((previous) => ({
        ...previous,
        sheets: previous.sheets.map((sheet) =>
          sheet.name === sheetName ? { ...sheet, styles } : sheet,
        ),
      }));
      markDirty(sheetName);
    },
    [document, markDirty, remember],
  );

  const addSheet = useCallback(
    (name: string) => {
      setDocument((previous) => {
        if (previous.sheets.some((sheet) => sheet.name === name)) return previous;
        const next = {
          ...previous,
          sheets: [
            ...previous.sheets,
            {
              name,
              position: previous.sheets.length,
              cells: {},
              styles: emptySheetStyles(),
            },
          ],
        };
        rebuild(next);
        return next;
      });
      markDirty(name);
      setActiveSheetName(name);
    },
    [markDirty, rebuild],
  );

  const removeSheet = useCallback(
    (name: string) => {
      setDocument((previous) => {
        const sheets = previous.sheets
          .filter((sheet) => sheet.name !== name)
          .map((sheet, position) => ({ ...sheet, position }));
        if (sheets.length === previous.sheets.length) return previous;

        const next = { ...previous, sheets };
        rebuild(next);
        setActiveSheetName((current) =>
          current === name ? (sheets[0]?.name ?? "") : current,
        );
        return next;
      });
      setDirtySheets((previous) => new Set(previous).add(name));
    },
    [rebuild],
  );

  /**
   * Renombra una hoja y **reescribe las fórmulas que la nombran**.
   *
   * Las referencias entre hojas se resuelven por nombre, así que renombrar sin
   * reescribir deja apuntando al vacío a todas las fórmulas que la citan. El
   * editor avisa antes de cuántas son (`countSheetReferences`).
   */
  const renameSheet = useCallback(
    (from: string, to: string) => {
      if (from === to) return;

      setDocument((previous) => {
        if (previous.sheets.some((sheet) => sheet.name === to)) return previous;

        const sheets = previous.sheets.map((sheet) => {
          const cells: Record<string, TemplateCell> = {};
          for (const [ref, cell] of Object.entries(sheet.cells)) {
            cells[ref] = isGraphicContent(cell.content)
              ? cell
              : { ...cell, content: renameInFormula(cell.content, from, to) };
          }
          return {
            ...sheet,
            name: sheet.name === from ? to : sheet.name,
            cells,
          };
        });

        const next = { ...previous, sheets };
        rebuild(next);
        setActiveSheetName((current) => (current === from ? to : current));
        return next;
      });

      setDirtySheets((previous) => {
        const next = new Set(previous);
        next.delete(from);
        for (const sheet of document.sheets) {
          next.add(sheet.name === from ? to : sheet.name);
        }
        return next;
      });
    },
    [document.sheets, rebuild],
  );

  const reorderSheets = useCallback(
    (names: string[]) => {
      setDocument((previous) => {
        const byName = new Map(previous.sheets.map((sheet) => [sheet.name, sheet]));
        if (
          names.length !== previous.sheets.length ||
          names.some((name) => !byName.has(name))
        ) {
          return previous;
        }

        return {
          ...previous,
          sheets: names.map((name, position) => ({
            ...byName.get(name)!,
            position,
          })),
        };
      });
    },
    [],
  );

  const countSheetReferences = useCallback(
    (name: string): number => {
      let count = 0;
      for (const sheet of document.sheets) {
        for (const cell of Object.values(sheet.cells)) {
          if (!cell.content.startsWith("=") || isGraphicContent(cell.content)) {
            continue;
          }
          const matches = cell.content.match(new RegExp(QUALIFIED_REF_SOURCE, "g"));
          if (
            matches?.some((match) => parseQualifiedRef(match)?.sheet === name)
          ) {
            count++;
          }
        }
      }
      return count;
    },
    [document.sheets],
  );

  const getCell = useCallback(
    (sheetName: string, ref: string): TemplateCell | undefined =>
      document.sheets.find((sheet) => sheet.name === sheetName)?.cells[ref],
    [document.sheets],
  );

  const getValue = useCallback(
    (sheetName: string, ref: string): FormulaValue =>
      values[bookRef(sheetName, ref)] ?? "",
    [values],
  );

  const isCircular = useCallback(
    (sheetName: string, ref: string): boolean =>
      values[bookRef(sheetName, ref)] === FORMULA_CIRCULAR,
    [values],
  );

  /**
   * Deshacer y rehacer.
   *
   * Al volver a un documento anterior se rehace el grafo entero en vez de
   * intentar deshacer sus aristas una a una: es una operación puntual, y
   * reconstruirlo cuesta menos que arriesgarse a dejarlo desincronizado con
   * las fórmulas.
   */
  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((history) => history.slice(0, -1));
    setFuture((history) => [document, ...history].slice(0, HISTORY_LIMIT));
    setDocument(previous);
    rebuild(previous);
    // Deshacer también deja la hoja como pendiente de guardar: lo que hay en
    // el servidor sigue siendo lo de antes de deshacer.
    setDirtySheets((current) => {
      const next = new Set(current);
      for (const sheet of previous.sheets) next.add(sheet.name);
      return next;
    });
  }, [document, past, rebuild]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const [next, ...rest] = future;
    setFuture(rest);
    setPast((history) => [...history.slice(-HISTORY_LIMIT + 1), document]);
    setDocument(next);
    rebuild(next);
    setDirtySheets((current) => {
      const updated = new Set(current);
      for (const sheet of next.sheets) updated.add(sheet.name);
      return updated;
    });
  }, [document, future, rebuild]);

  /** Las celdas del documento cuyo contenido es un decimal con coma. */
  const decimalCommaCells = useMemo(
    () => findDecimalCommaCells(document),
    [document],
  );

  /**
   * Convierte de una vez todos los decimales con coma del documento.
   *
   * Va aparte de la escritura porque afecta a lo que ya estaba: en la
   * plantilla real son 1200 celdas, y eso no se cambia sin que alguien lo
   * pida.
   */
  const normalizeDecimals = useCallback(() => {
    const next = normalizeDecimalCommas(document);
    if (next === document) return;

    remember(document);
    setDocument(next);
    rebuild(next);
    setDirtySheets((current) => {
      const updated = new Set(current);
      for (const cell of findDecimalCommaCells(document)) updated.add(cell.sheet);
      return updated;
    });
  }, [document, rebuild, remember]);

  const markSheetSaved = useCallback((name: string) => {
    setDirtySheets((previous) => {
      const next = new Set(previous);
      next.delete(name);
      return next;
    });
  }, []);

  const markAllSaved = useCallback(() => setDirtySheets(new Set()), []);

  const replaceDocument = useCallback(
    (next: TemplateDocument) => {
      setDocument(next);
      rebuild(next);
      setPast([]);
      setFuture([]);
      setDirtySheets(new Set());
      setActiveSheetName((current) =>
        next.sheets.some((sheet) => sheet.name === current)
          ? current
          : (next.sheets[0]?.name ?? ""),
      );
    },
    [rebuild],
  );

  const activeSheet = useMemo(
    () => document.sheets.find((sheet) => sheet.name === activeSheetName),
    [document.sheets, activeSheetName],
  );

  return {
    document,
    values,
    activeSheet,
    activeSheetName,
    setActiveSheetName,
    getCell,
    getValue,
    isCircular,
    setCellContent,
    updateCell,
    setSheetStyles,
    addSheet,
    removeSheet,
    renameSheet,
    reorderSheets,
    countSheetReferences,
    decimalCommaCells,
    normalizeDecimals,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    dirtySheets,
    isDirty: dirtySheets.size > 0,
    markSheetSaved,
    markAllSaved,
    replaceDocument,
  };
};
