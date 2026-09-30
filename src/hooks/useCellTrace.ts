import { useMemo } from "react";
import { analyzeExpression, type DepGraph } from "@rymel/formula-engine";
import {
  bookRef,
  isGraphicContent,
  splitBookRef,
  type TemplateDocument,
} from "@rymel/design-template";

/**
 * De qué se alimenta una celda y a quién alimenta.
 *
 * Lee el grafo con el que el editor recalcula, y no otro: el rastreo existe
 * para entender ese recálculo, y un segundo analizador podría discrepar de él
 * justo en el caso que se quiere entender.
 *
 * Es una herramienta de autoría. El diseñador no la recibe.
 */

/** Qué hay en una celda al final de una cadena de precedentes. */
export type TraceOrigin = "formula" | "literal" | "element" | "empty";

export interface TraceRef {
  sheet: string;
  /** Celda o rango, tal como se escribió: `G14`, `B3:C10`. */
  ref: string;
}

export interface TraceNode extends TraceRef {
  origin: TraceOrigin;
  /** Clave del dato del elemento, si la celda se rellena con uno. */
  elementKey?: string;
}

export interface DesignCall {
  code: string;
  /** Referencias que aparecen en sus argumentos. */
  refs: TraceRef[];
}

export interface CellTrace {
  /** Precedentes directos, agrupados como están escritos. */
  precedents: TraceRef[];
  /** Dependientes directos, celda a celda. */
  dependents: TraceRef[];
  /** Referencias calificadas a resaltar en la rejilla. */
  highlight: { precedents: Set<string>; dependents: Set<string> };
  /** Invocaciones a fórmulas de diseño: su código y sus argumentos, nunca su expresión. */
  designCalls: DesignCall[];
  /** Cadena completa por niveles; solo si se pidió. */
  chain?: TraceNode[][];
  /** Si la cadena vuelve a la celda de partida. */
  circular: boolean;
}

const split = (qualified: string): TraceRef => {
  // Las claves del grafo siempre van calificadas: el libro es el de la plantilla entera.
  const { sheet, cell } = splitBookRef(qualified);
  return { sheet: sheet ?? "", ref: cell };
};

/** Una referencia como la devuelve el análisis, llevada a su hoja. */
const qualify = (ref: string, currentSheet: string): TraceRef => {
  const separator = ref.lastIndexOf("!");
  if (separator === -1) return { sheet: currentSheet, ref };
  const sheet = ref.slice(0, separator).replace(/^'(.*)'$/, "$1").replace(/''/g, "'");
  return { sheet, ref: ref.slice(separator + 1) };
};

const originOf = (
  document: TemplateDocument,
  { sheet, ref }: TraceRef,
): Pick<TraceNode, "origin" | "elementKey"> => {
  const cell = document.sheets.find((item) => item.name === sheet)?.cells[ref];
  if (cell?.elementKey) return { origin: "element", elementKey: cell.elementKey };
  const content = cell?.content.trim() ?? "";
  if (content === "") return { origin: "empty" };
  if (content.startsWith("=") && !isGraphicContent(content)) return { origin: "formula" };
  return { origin: "literal" };
};

/**
 * El texto de los argumentos de cada invocación a `code` dentro de la fórmula,
 * respetando paréntesis anidados y literales de texto.
 */
const argumentsOf = (formula: string, code: string): string[] => {
  const found: string[] = [];
  const pattern = new RegExp(`(?<![A-Za-z0-9_.])${code}\\s*\\(`, "gi");
  for (const match of formula.matchAll(pattern)) {
    let depth = 1;
    let inString = false;
    const start = match.index! + match[0].length;
    for (let index = start; index < formula.length; index++) {
      const character = formula[index];
      if (character === '"') inString = !inString;
      if (inString) continue;
      if (character === "(") depth++;
      if (character === ")" && --depth === 0) {
        found.push(formula.slice(start, index));
        break;
      }
    }
  }
  return found;
};

export interface TraceOptions {
  /** Recorrer todos los precedentes transitivos. */
  full?: boolean;
  /** Códigos de las fórmulas de diseño, para distinguir sus invocaciones. */
  designFunctionCodes?: readonly string[];
}

export const traceCell = (
  document: TemplateDocument,
  graph: DepGraph,
  sheetName: string,
  ref: string,
  options: TraceOptions = {},
): CellTrace => {
  const start = bookRef(sheetName, ref);
  const content = document.sheets.find((item) => item.name === sheetName)?.cells[ref]?.content ?? "";
  const isFormula = content.startsWith("=") && !isGraphicContent(content);
  const analyzed = isFormula ? analyzeExpression(content) : { refs: [], calls: [] };

  const precedents = analyzed.refs.map((item) => qualify(item, sheetName));
  const highlightPrecedents = new Set(graph.precedents.get(start) ?? []);
  const highlightDependents = new Set(graph.dependents.get(start) ?? []);
  const dependents = [...highlightDependents].sort().map(split);

  const designCodes = new Set((options.designFunctionCodes ?? []).map((code) => code.toUpperCase()));
  const designCalls: DesignCall[] = [...new Set(analyzed.calls.map((call) => call.name))]
    .filter((name) => designCodes.has(name))
    .map((code) => ({
      code,
      refs: argumentsOf(content, code).flatMap((args) =>
        analyzeExpression(args).refs.map((item) => qualify(item, sheetName)),
      ),
    }));

  let circular = false;
  let chain: TraceNode[][] | undefined;

  if (options.full) {
    chain = [];
    const visited = new Set([start]);
    let frontier = [start];
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const current of frontier) {
        for (const precedent of graph.precedents.get(current) ?? []) {
          if (precedent === start) circular = true;
          if (visited.has(precedent)) continue;
          visited.add(precedent);
          next.push(precedent);
        }
      }
      if (next.length === 0) break;
      next.sort();
      chain.push(
        next.map((qualified) => {
          const node = split(qualified);
          return { ...node, ...originOf(document, node) };
        }),
      );
      frontier = next;
    }
  } else {
    // Sin la cadena completa, el ciclo se ve igual si la celda se lee a sí misma.
    circular = highlightPrecedents.has(start);
  }

  return {
    precedents,
    dependents,
    highlight: { precedents: highlightPrecedents, dependents: highlightDependents },
    designCalls,
    chain,
    circular,
  };
};

/**
 * El rastreo de la celda activa. `version` es cualquier valor que cambie cuando
 * cambia el grafo —los valores calculados lo hacen—, porque el grafo se
 * modifica en sitio y no avisa.
 */
export const useCellTrace = (
  document: TemplateDocument,
  getGraph: () => DepGraph,
  sheetName: string,
  ref: string,
  options: TraceOptions,
  version: unknown,
): CellTrace =>
  useMemo(
    () => traceCell(document, getGraph(), sheetName, ref, options),
    // `options` se desestructura para no depender de su identidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [document, getGraph, sheetName, ref, options.full, options.designFunctionCodes, version],
  );
