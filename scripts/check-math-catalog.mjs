/**
 * El catálogo de funciones de la expresión dice la verdad.
 *
 * Cada símbolo que el editor ofrece —o da por bueno al avisar de símbolos sin
 * declarar— se cifra y se evalúa contra el motor real. El motor **no valida
 * los nombres al guardar**: cifrar solo comprueba que la sintaxis se pueda
 * analizar, así que `y = RAIZ(x)` se guarda sin protestar y falla más tarde,
 * al calcular un diseño. Un catálogo equivocado no da la cara aquí: la da en
 * producción.
 *
 * Necesita el motor levantado.
 *
 *   node scripts/check-math-catalog.mjs
 */

import { readFileSync } from "node:fs";

const BASE = process.env.SECURE_FUNCTION_ENGINE_URL ?? "http://localhost:5000";

/** Argumentos con los que cada símbolo produce un número. */
const CALLS = {
  sqrt: "sqrt(9)",
  cbrt: "cbrt(27)",
  nthRoot: "nthRoot(27, 3)",
  square: "square(4)",
  pow: "pow(3, 2)",
  exp: "exp(1)",
  hypot: "hypot(3, 4)",
  log: "log(10)",
  log10: "log10(100)",
  round: "round(1.567, 2)",
  ceil: "ceil(1.2)",
  floor: "floor(1.8)",
  fix: "fix(-1.8)",
  abs: "abs(-5)",
  sign: "sign(-3)",
  mod: "mod(10, 3)",
  sin: "sin(1)",
  cos: "cos(1)",
  tan: "tan(1)",
  asin: "asin(0.5)",
  acos: "acos(0.5)",
  atan: "atan(1)",
  atan2: "atan2(1, 2)",
  sinh: "sinh(1)",
  cosh: "cosh(1)",
  tanh: "tanh(1)",
  min: "min(5, 2)",
  max: "max(5, 2)",
  mean: "mean(2, 4)",
  sum: "sum(2, 4)",
  pi: "pi",
  e: "e",
  sec: "sec(1)",
  csc: "csc(1)",
  cot: "cot(1)",
  norm: "norm(-3)",
  gcd: "gcd(8, 6)",
  lcm: "lcm(8, 6)",
  factorial: "factorial(5)",
  cube: "cube(3)",
};

/** Las del motor de hojas: aquí deben fallar, y el catálogo no debe ofrecerlas. */
const NO_DEBEN_EXISTIR = ["SUMA(1, 2)", "SI(1 > 0, 2, 3)", "REDONDEAR(1.2, 1)", "RAIZ(9)", "ln(10)"];

const post = async (path, body) => {
  const response = await fetch(`${BASE}/function-engine/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  try {
    return { ok: response.ok, data: JSON.parse(text) };
  } catch {
    return { ok: false, data: text };
  }
};

/** Evalúa `y = <expr>` de punta a punta y devuelve el número, o `null`. */
const evaluar = async (expr) => {
  const cifrado = await post("encrypt", { plainTextFunction: `y = ${expr}` });
  if (!cifrado.ok) return null;

  const evaluado = await post("evaluate-function", {
    encryptedFunction: cifrado.data.encrypted,
    parameters: {},
    constants: {},
  });

  return evaluado.ok && typeof evaluado.data?.result === "number"
    ? evaluado.data.result
    : null;
};

const catalogo = readFileSync(
  new URL("../src/components/formula/mathFunctions.ts", import.meta.url),
  "utf8",
);

/** Los símbolos que el catálogo declara conocidos, leídos del propio módulo. */
const declarados = [
  ...new Set([
    ...[...catalogo.matchAll(/name: "([A-Za-z_][A-Za-z0-9_]*)"/g)].map(
      (match) => match[1],
    ),
    ...[...catalogo.matchAll(/^\s{2}"([a-z][A-Za-z0-9_]*)",$/gm)].map(
      (match) => match[1],
    ),
  ]),
];

let fallos = 0;

console.log(`Comprobando ${declarados.length} símbolos contra ${BASE}\n`);

for (const symbol of declarados) {
  const call = CALLS[symbol];

  if (call === undefined) {
    console.log(` FALLA ${symbol} — el catálogo lo declara y aquí no hay con qué probarlo`);
    fallos++;
    continue;
  }

  const result = await evaluar(call);
  if (result === null) {
    console.log(` FALLA ${symbol} — el motor no lo reconoce (${call})`);
    fallos++;
  } else {
    console.log(`  ok   ${call} = ${result}`);
  }
}

console.log("\nY las que no deben existir aquí:");
for (const call of NO_DEBEN_EXISTIR) {
  const result = await evaluar(call);
  if (result === null) {
    console.log(`  ok   ${call} no existe, como se esperaba`);
  } else {
    console.log(` FALLA ${call} existe y da ${result}: el catálogo debería ofrecerla`);
    fallos++;
  }
}

console.log(
  fallos === 0
    ? "\nEl catálogo dice la verdad."
    : `\n${fallos} discrepancia(s) entre el catálogo y el motor.`,
);

process.exit(fallos === 0 ? 0 : 1);
