import { useCallback, useReducer, useRef } from "react";
import {
  consumesCellClick,
  formulaBuilderReducer,
  initialFormulaBuilderState,
  type FormulaBuilderState,
} from "@rymel/formula-engine";

export interface UseFormulaBuilderResult extends FormulaBuilderState {
  /** El input de la barra, para devolverle el foco tras insertar. */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Si el clic en una celda lo va a consumir la fórmula. */
  consumesClick: boolean;

  start: (draft: string, sheet: string) => void;
  setDraft: (draft: string) => void;
  setCursor: (cursor: number) => void;
  togglePicking: () => void;
  toggleRange: (activeRef: string) => void;
  insert: (text: string) => void;
  /** Resuelve el clic en una celda. `true` si lo consumió la fórmula. */
  pickCell: (sheet: string, ref: string) => boolean;
  finish: () => void;
}

/**
 * La atadura con React de la construcción de fórmulas.
 *
 * **Toda la lógica vive en `@rymel/formula-engine`**: cuándo calificar una
 * referencia, cuándo entrecomillar el nombre de una hoja, cómo se forma un
 * rango. Aquí solo queda el estado de React y devolver el foco al input, que
 * es lo único que no se puede compartir con el diseñador.
 *
 * Duplicar la lógica habría sido lo rápido: dos implementaciones de lo mismo
 * que acaban divergiendo, y entonces la misma acción produce dos fórmulas
 * distintas en dos sitios.
 */
export const useFormulaBuilder = (): UseFormulaBuilderResult => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, dispatch] = useReducer(
    formulaBuilderReducer,
    undefined,
    initialFormulaBuilderState,
  );

  /**
   * Devuelve el foco a la barra con el cursor detrás de lo insertado.
   *
   * Va tras el repintado porque el input todavía tiene el texto anterior: sin
   * esperar, el cursor acabaría en un sitio que ya no existe.
   */
  const restoreFocus = useCallback((cursor: number) => {
    window.setTimeout(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      const at = Math.min(cursor, input.value.length);
      input.setSelectionRange(at, at);
    }, 0);
  }, []);

  const insert = useCallback(
    (text: string) => {
      dispatch({ type: "insert", text });
      restoreFocus(state.cursor + text.length);
    },
    [restoreFocus, state.cursor],
  );

  const pickCell = useCallback(
    (sheet: string, ref: string): boolean => {
      if (!consumesCellClick(state)) return false;
      dispatch({ type: "pick", sheet, ref });
      restoreFocus(state.cursor + ref.length);
      return true;
    },
    [restoreFocus, state],
  );

  return {
    ...state,
    inputRef,
    consumesClick: consumesCellClick(state),
    start: useCallback(
      (draft: string, sheet: string) => dispatch({ type: "start", draft, sheet }),
      [],
    ),
    setDraft: useCallback((draft: string) => dispatch({ type: "draft", draft }), []),
    setCursor: useCallback(
      (cursor: number) => dispatch({ type: "cursor", cursor }),
      [],
    ),
    togglePicking: useCallback(() => dispatch({ type: "togglePicking" }), []),
    toggleRange: useCallback(
      (activeRef: string) => dispatch({ type: "toggleRange", activeRef }),
      [],
    ),
    insert,
    pickCell,
    finish: useCallback(() => dispatch({ type: "finish" }), []),
  };
};
