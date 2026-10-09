/**
 * El editor de fórmulas cuando una fórmula invoca a otra.
 *
 * Sobre el modal montado, con los hooks de datos simulados: lo que se
 * comprueba es cómo reacciona la interfaz —qué avisa, dónde pone un error,
 * qué envía el probador—, no el servidor, que tiene su propia comprobación
 * contra la base (`check-function-composition.ts`).
 */

/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DesignFunctionType } from "@/types/designFunction.types";

const mocks = vi.hoisted(() => ({
  publish: vi.fn(),
  test: vi.fn(),
  detail: undefined as unknown,
}));

vi.mock("@hooks/useDesignFunctions", () => ({
  useDesignFunctionDetail: () => ({ data: mocks.detail, isError: false }),
  useDesignFunctionImpact: () => ({
    data: {
      designFunctionId: 7,
      subTypeCount: 1,
      subTypeNames: ["1F"],
      subDesignCount: 3,
      designCount: 2,
      staleSubDesignCount: 0,
      invokedBy: [{ id: 9, code: "DOBLE_CUADRADO", name: "Doble" }],
    },
  }),
  useDesignFunctions: () => ({
    data: {
      items: [
        { id: 7, code: "QUADRATIC", name: "Cuadrática", variables: "x", deleted: false },
        { id: 8, code: "RESTA", name: "Resta", variables: "a, b", deleted: false },
      ],
    },
  }),
  useDesignSubTypes: () => ({ data: [] }),
  useCreateDesignFunction: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateDesignFunction: () => ({
    mutate: (_: unknown, options: { onSuccess: () => void }) => options.onSuccess(),
    isPending: false,
  }),
  usePublishVersion: () => ({ mutate: mocks.publish, isPending: false }),
  useSetSubTypes: () => ({ mutate: vi.fn() }),
  useTestExpression: () => ({ mutate: mocks.test, isPending: false, data: undefined }),
}));

import { FormulaEditorModal } from "./FormulaEditorModal";

const DETAIL = {
  id: 7,
  name: "Cuadrática",
  code: "QUADRATIC",
  type: DesignFunctionType.DESIGN,
  expression: "y = RESTA(x, 1) * 2",
  variables: "x",
  constants: {},
  version: 2,
  versionId: 20,
  designSubTypeIds: [],
  invokes: [{ id: 8, code: "RESTA", name: "Resta" }],
  invokedBy: [{ id: 9, code: "DOBLE_CUADRADO", name: "Doble" }],
};

beforeEach(() => {
  mocks.publish.mockReset();
  mocks.test.mockReset();
  mocks.detail = DETAIL;
});

const expression = () => screen.getByPlaceholderText("y = x^2 + CONST_1") as HTMLTextAreaElement;

const renderModal = () =>
  render(<FormulaEditorModal isOpen functionId={7} onClose={vi.fn()} />);

describe("una fórmula que invoca a otra", () => {
  it("invocar otra fórmula no cuenta como símbolo sin declarar", () => {
    renderModal();
    expect(screen.queryByText(/Símbolos sin declarar/)).toBeNull();

    fireEvent.change(expression(), { target: { value: "y = RESTA(x, z)" } });
    expect(screen.getByText(/Símbolos sin declarar: z\./)).toBeTruthy();
  });

  it("la propia fórmula no cuenta como invocable", () => {
    renderModal();
    fireEvent.change(expression(), { target: { value: "y = QUADRATIC(x)" } });
    expect(screen.getByText(/Símbolos sin declarar: QUADRATIC/)).toBeTruthy();
  });

  it("un error de composición se muestra junto a la expresión, sin perder lo escrito", () => {
    mocks.publish.mockImplementation((_: unknown, options: { onError: (e: unknown) => void }) =>
      options.onError({
        response: {
          data: {
            message:
              "Referencia circular entre fórmulas: QUADRATIC → DOBLE_CUADRADO → QUADRATIC",
          },
        },
      }),
    );
    renderModal();
    fireEvent.change(expression(), { target: { value: "y = RESTA(x, 2)" } });
    fireEvent.click(screen.getByText("Guardar"));

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("QUADRATIC → DOBLE_CUADRADO → QUADRATIC");
    // Está junto al campo, no al pie del formulario.
    expect(alert.previousElementSibling?.textContent).toContain("Debe tener la forma");
    expect(expression().value).toBe("y = RESTA(x, 2)");

    fireEvent.change(expression(), { target: { value: "y = RESTA(x, 3)" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("el probador envía el tipo, para que el servidor resuelva las anidadas", () => {
    renderModal();
    const tester = screen.getByText("Probar la fórmula").parentElement as HTMLElement;
    fireEvent.change(tester.querySelector("input") as HTMLInputElement, {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByText("Evaluar"));
    expect(mocks.test).toHaveBeenCalledWith(
      expect.objectContaining({ type: DesignFunctionType.DESIGN, parameters: { x: 3 } }),
    );
  });

  it("muestra qué invoca, quién la invoca, y que sus diseños cuentan", () => {
    renderModal();
    expect(screen.getByText(/Invoca:/).textContent).toContain("RESTA");
    expect(screen.getByText(/La invoca:/).textContent).toContain("DOBLE_CUADRADO");
    expect(screen.getByText(/contando los que la usan a través de DOBLE_CUADRADO/)).toBeTruthy();
  });
});
