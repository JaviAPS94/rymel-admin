/**
 * El catálogo de la expresión y el aviso de símbolos sin declarar.
 *
 * Lo que el catálogo afirma sobre el motor se comprueba contra el motor de
 * verdad, en `scripts/check-math-catalog.mjs`. Aquí se comprueba lo que se
 * puede sin él: que las dos listas no se contradigan y que no vuelva a colarse
 * un nombre que el motor no conoce.
 */

import { describe, expect, it } from "vitest";
import {
  formulaGroup,
  isCompositionError,
  KNOWN_MATH_SYMBOLS,
  MATH_FUNCTION_GROUPS,
} from "./mathFunctions";

const entries = MATH_FUNCTION_GROUPS.flatMap((group) => group.entries);

describe("el catálogo de la expresión", () => {
  it("todo lo que ofrece está entre lo que da por conocido", () => {
    // Si no, el editor ofrecería una función y a la vez avisaría de que ese
    // símbolo está sin declarar.
    for (const entry of entries) {
      if (entry.name === undefined) continue;
      expect(KNOWN_MATH_SYMBOLS.has(entry.name)).toBe(true);
    }
  });

  it("no ofrece las funciones de la hoja de cálculo", () => {
    // El motor de la expresión es mathjs y no las tiene: ofrecerlas sería
    // ofrecer fórmulas que se guardan y luego fallan al calcular.
    for (const ausente of ["SUMA", "SI", "REDONDEAR", "RAIZ", "BUSCARV"]) {
      expect(KNOWN_MATH_SYMBOLS.has(ausente)).toBe(false);
      expect(entries.some((entry) => entry.name === ausente)).toBe(false);
    }
  });

  it("no da por buena `ln`, que mathjs no tiene", () => {
    // Estuvo en la lista que había antes, así que se guardaba sin protestar.
    expect(KNOWN_MATH_SYMBOLS.has("ln")).toBe(false);
  });

  it("conoce las que faltaban en la lista anterior", () => {
    for (const nombre of ["log10", "atan", "asin", "acos", "mod", "sign"]) {
      expect(KNOWN_MATH_SYMBOLS.has(nombre)).toBe(true);
    }
  });

  it("lo que se inserta empieza por el nombre de la función", () => {
    for (const entry of entries) {
      if (entry.insert === "" || entry.name === undefined) continue;
      expect(entry.insert.startsWith(entry.name)).toBe(true);
    }
  });

  it("la notación no se ofrece como si fuera un símbolo", () => {
    // Los operadores y el condicional se escriben, no se llaman por su nombre.
    const notacion = entries.filter((entry) => entry.name === undefined);
    expect(notacion.length).toBeGreaterThan(0);
    for (const entry of notacion) expect(entry.insert).toBe("");
  });

  it("distingue el logaritmo natural del de base 10", () => {
    // En la hoja de cálculo `LOG` es base 10 y aquí `log` es natural: es la
    // clase de diferencia que no da error, da otro número.
    const log = entries.find((entry) => entry.signature === "log(x)");
    expect(log?.description).toMatch(/natural/);
    expect(entries.some((entry) => entry.signature === "log10(x)")).toBe(true);
  });
});

describe("las fórmulas de diseño como grupo", () => {
  it("se insertan con sus variables como marcadores, en su orden", () => {
    const group = formulaGroup([
      { code: "QUADRATIC", name: "Cuadrática", variables: "x" },
      { code: "RESTA", name: "Resta", variables: "a, b" },
    ]);
    expect(group.title).toBe("Fórmulas de diseño");
    expect(group.entries.map((entry) => entry.insert)).toEqual(["QUADRATIC(x)", "RESTA(a, b)"]);
    expect(group.entries[0]!.description).toBe("Cuadrática");
  });
});

describe("los errores de composición", () => {
  it.each([
    "Referencia circular entre fórmulas: A → B → A",
    "QUADRATIC espera 1 argumento(s) y recibe 2",
    '"QUADRATICA" no es una fórmula activa de tipo DESIGN',
    '"A", "B" no son fórmulas activas de tipo DESIGN',
    "Las fórmulas se anidan más de 5 niveles: A → B → C → D → E → F → G",
  ])("reconoce «%s»", (message) => {
    expect(isCompositionError(message)).toBe(true);
  });

  it("no confunde otros errores", () => {
    expect(isCompositionError("Símbolo sin declarar: z")).toBe(false);
    expect(isCompositionError("El código ya lo usa otra fórmula")).toBe(false);
  });
});
