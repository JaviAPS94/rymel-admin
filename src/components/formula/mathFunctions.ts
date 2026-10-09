/**
 * Las funciones que se pueden usar dentro de la expresión de una fórmula de
 * diseño.
 *
 * **No son las del motor de hojas.** La expresión no la evalúa
 * `@rymel/formula-engine` sino el motor cifrado, que por dentro es `mathjs`, y
 * los dos catálogos no se parecen: aquí `SUMA`, `SI`, `REDONDEAR` o `RAIZ` no
 * existen —dan «Undefined function»— y los nombres van en minúscula. Ofrecer
 * el listado de la hoja de cálculo habría sido ofrecer funciones que fallan.
 *
 * El motor **no avisa al guardar**: cifrar solo comprueba que la sintaxis se
 * pueda analizar, así que `y = RAIZ(x)` se guarda sin protestar y revienta más
 * tarde, al calcular un diseño. De ahí que valga la pena enseñar cuáles hay.
 *
 * Cada entrada está comprobada contra el motor real —cifrada y evaluada— por
 * `check-math-catalog.mjs`. Si alguien actualiza mathjs, ese script dice qué
 * dejó de ser cierto.
 */

export interface MathFunctionEntry {
  /**
   * El identificador, cuando lo hay.
   *
   * Explícito y no deducido de la firma porque el catálogo también recoge
   * notación —los operadores, el condicional— que no es ningún símbolo. Es lo
   * que distingue «esto el motor lo reconoce por su nombre» de «esto se
   * escribe así».
   */
  name?: string;
  /** Cómo se escribe, con sus argumentos. */
  signature: string;
  /** Qué hace, en una línea. */
  description: string;
  /** Lo que se inserta al elegirla; el cursor queda donde va el primer valor. */
  insert: string;
}

export interface MathFunctionGroup {
  title: string;
  entries: MathFunctionEntry[];
}

/**
 * Las fórmulas de diseño que la expresión puede invocar, como un grupo más.
 *
 * Se insertan con sus variables como marcadores —`QUADRATIC(x)`—, igual que
 * en el editor de plantillas: el orden de los argumentos es contrato, y verlo
 * escrito es la forma más barata de no equivocarlo.
 */
export const formulaGroup = (
  formulas: readonly { code: string; name: string; variables: string }[],
): MathFunctionGroup => ({
  title: "Fórmulas de diseño",
  entries: formulas.map((formula) => {
    const variables = formula.variables
      .split(",")
      .map((variable) => variable.trim())
      .filter(Boolean);
    const signature = `${formula.code}(${variables.join(", ")})`;
    return {
      name: formula.code,
      signature,
      description: formula.name,
      insert: signature,
    };
  }),
});

/**
 * Si un mensaje del servidor es un error de composición entre fórmulas.
 *
 * Esos errores son de la expresión —qué invoca y cómo—, así que se muestran
 * junto a ella y no al pie del formulario.
 */
export const isCompositionError = (message: string): boolean =>
  /Referencia circular entre fórmulas|espera \d+ argumento|no (es una fórmula activa|son fórmulas activas)|se anidan más de/.test(
    message,
  );

export const MATH_FUNCTION_GROUPS: MathFunctionGroup[] = [
  {
    title: "Potencias y raíces",
    entries: [
      {
        name: "sqrt",
        signature: "sqrt(x)",
        description: "Raíz cuadrada",
        insert: "sqrt(",
      },
      {
        name: "cbrt",
        signature: "cbrt(x)",
        description: "Raíz cúbica",
        insert: "cbrt(",
      },
      {
        name: "nthRoot",
        signature: "nthRoot(x, n)",
        description: "Raíz enésima",
        insert: "nthRoot(",
      },
      {
        name: "square",
        signature: "square(x)",
        description: "Al cuadrado",
        insert: "square(",
      },
      {
        name: "pow",
        signature: "pow(x, n)",
        description: "Potencia. `x^n` hace lo mismo",
        insert: "pow(",
      },
      {
        name: "exp",
        signature: "exp(x)",
        description: "e elevado a x",
        insert: "exp(",
      },
      {
        name: "hypot",
        signature: "hypot(a, b)",
        description: "Hipotenusa: raíz de a² + b²",
        insert: "hypot(",
      },
    ],
  },
  {
    title: "Logaritmos",
    entries: [
      {
        name: "log",
        signature: "log(x)",
        description: "Logaritmo **natural**, no en base 10",
        insert: "log(",
      },
      {
        name: "log10",
        signature: "log10(x)",
        description: "Logaritmo en base 10",
        insert: "log10(",
      },
      {
        name: "log",
        signature: "log(x, base)",
        description: "Logaritmo en la base que se indique",
        insert: "log(",
      },
    ],
  },
  {
    title: "Redondeo y signo",
    entries: [
      {
        name: "round",
        signature: "round(x, decimales)",
        description: "Redondea; sin el segundo argumento, al entero",
        insert: "round(",
      },
      {
        name: "ceil",
        signature: "ceil(x)",
        description: "Redondea hacia arriba",
        insert: "ceil(",
      },
      {
        name: "floor",
        signature: "floor(x)",
        description: "Redondea hacia abajo",
        insert: "floor(",
      },
      {
        name: "fix",
        signature: "fix(x)",
        description: "Trunca hacia cero, sin redondear",
        insert: "fix(",
      },
      {
        name: "abs",
        signature: "abs(x)",
        description: "Valor absoluto",
        insert: "abs(",
      },
      {
        name: "sign",
        signature: "sign(x)",
        description: "-1, 0 o 1 según el signo",
        insert: "sign(",
      },
      {
        name: "mod",
        signature: "mod(x, n)",
        description: "Resto de la división",
        insert: "mod(",
      },
    ],
  },
  {
    title: "Trigonometría",
    entries: [
      {
        name: "sin",
        signature: "sin(x)",
        description: "Seno, en radianes",
        insert: "sin(",
      },
      {
        name: "cos",
        signature: "cos(x)",
        description: "Coseno, en radianes",
        insert: "cos(",
      },
      {
        name: "tan",
        signature: "tan(x)",
        description: "Tangente, en radianes",
        insert: "tan(",
      },
      {
        name: "asin",
        signature: "asin(x)",
        description: "Arcoseno",
        insert: "asin(",
      },
      {
        name: "acos",
        signature: "acos(x)",
        description: "Arcocoseno",
        insert: "acos(",
      },
      {
        name: "atan",
        signature: "atan(x)",
        description: "Arcotangente",
        insert: "atan(",
      },
      {
        name: "atan2",
        signature: "atan2(y, x)",
        description: "Arcotangente de y/x con el cuadrante correcto",
        insert: "atan2(",
      },
      {
        name: "sinh",
        signature: "sinh(x)",
        description: "Seno hiperbólico",
        insert: "sinh(",
      },
      {
        name: "cosh",
        signature: "cosh(x)",
        description: "Coseno hiperbólico",
        insert: "cosh(",
      },
      {
        name: "tanh",
        signature: "tanh(x)",
        description: "Tangente hiperbólica",
        insert: "tanh(",
      },
    ],
  },
  {
    title: "Comparación y agregados",
    entries: [
      {
        name: "min",
        signature: "min(a, b)",
        description: "El menor",
        insert: "min(",
      },
      {
        name: "max",
        signature: "max(a, b)",
        description: "El mayor",
        insert: "max(",
      },
      {
        name: "mean",
        signature: "mean(a, b)",
        description: "Media",
        insert: "mean(",
      },
      {
        name: "sum",
        signature: "sum(a, b)",
        description: "Suma de los argumentos",
        insert: "sum(",
      },
    ],
  },
  {
    title: "Constantes y operadores",
    entries: [
      { name: "pi", signature: "pi", description: "3.14159…", insert: "pi" },
      { name: "e", signature: "e", description: "2.71828…", insert: "e" },
      {
        signature: "+ - * / ^",
        description: "Suma, resta, producto, división y potencia",
        insert: "",
      },
      {
        signature: "condición ? a : b",
        description: "Devuelve a si la condición se cumple, si no b",
        insert: "",
      },
    ],
  },
];

/**
 * Todo lo que el motor reconoce y por tanto **no** es un símbolo sin declarar.
 *
 * Más amplio que lo que se enseña: hay funciones válidas que no vale la pena
 * ofrecer pero que, si alguien las escribe, no deben marcarse como error. Lo
 * contrario —avisar de algo que sí funciona— entrena a ignorar los avisos.
 *
 * `ln` **no está** aquí a propósito, aunque estuvo antes: mathjs no la tiene,
 * y darla por buena era guardar sin protestar una fórmula que después falla al
 * calcular.
 */
export const KNOWN_MATH_SYMBOLS = new Set<string>([
  ...MATH_FUNCTION_GROUPS.flatMap((group) =>
    group.entries
      .map((entry) => entry.name)
      .filter((name): name is string => name !== undefined),
  ),
  // Verificadas contra el motor, pero demasiado específicas para el listado.
  "sec",
  "csc",
  "cot",
  "norm",
  "gcd",
  "lcm",
  "factorial",
  "cube",
]);
