import { describe, expect, it } from "vitest";
import { ALLERGENS, type Allergen } from "../allergens/allergens";
import type { AllergenLevel } from "../allergens/levels";
import { evaluateAllergens, type AllergenDeclaration } from "./evaluate";
import type { FilterStatus } from "./status";

const declare = (allergen: Allergen, level: AllergenLevel): AllergenDeclaration => ({
  allergen,
  level,
});

const allDeclared = (level: AllergenLevel): AllergenDeclaration[] =>
  ALLERGENS.map((allergen) => declare(allergen, level));

// Simula datos que llegan sin tipar (API, base de datos, JSON).
const untyped = <T>(value: unknown): T => value as T;

describe("evaluateAllergens: una alergia", () => {
  it.each<[AllergenLevel | "sin declarar", FilterStatus]>([
    ["contains", "no_apto"],
    ["may_contain", "posibles_trazas"],
    ["sin declarar", "sin_datos"],
    ["free_from", "apto"],
  ])("gluten %s -> %s", (level, expected) => {
    const declarations = level === "sin declarar" ? [] : [declare("gluten", level)];
    expect(evaluateAllergens(["gluten"], declarations).status).toBe(expected);
  });
});

describe("evaluateAllergens: platos sin datos", () => {
  it("un plato sin ninguna declaración es sin_datos y lista todo el perfil como faltante", () => {
    expect(evaluateAllergens(["gluten", "milk"], [])).toEqual({
      status: "sin_datos",
      contains: [],
      mayContain: [],
      missing: ["gluten", "milk"],
    });
  });

  it("declarar otros alérgenos no cubre los del perfil", () => {
    const declarations = ALLERGENS.filter((a) => a !== "nuts").map((a) => declare(a, "free_from"));
    expect(evaluateAllergens(["nuts"], declarations)).toEqual({
      status: "sin_datos",
      contains: [],
      mayContain: [],
      missing: ["nuts"],
    });
  });

  it("los 14 declarados como free_from con un perfil de 14 alergias es apto", () => {
    expect(evaluateAllergens(ALLERGENS, allDeclared("free_from")).status).toBe("apto");
  });

  it("con un perfil de 14 alergias, basta un alérgeno sin declarar para que sea sin_datos", () => {
    const declarations = allDeclared("free_from").filter((d) => d.allergen !== "lupin");
    expect(evaluateAllergens(ALLERGENS, declarations)).toMatchObject({
      status: "sin_datos",
      missing: ["lupin"],
    });
  });
});

describe("evaluateAllergens: platos sin ingredientes", () => {
  // Solo cuentan las declaraciones de alérgenos; el texto de ingredientes nunca
  // se interpreta. Un plato sin ingredientes se evalúa igual que cualquier otro.
  const dishWithoutIngredients = (allergens: AllergenDeclaration[]) => ({
    name: "Plato sin ingredientes",
    ingredients: null,
    allergens,
  });

  it("sin ingredientes ni declaraciones es sin_datos", () => {
    const dish = dishWithoutIngredients([]);
    expect(evaluateAllergens(["eggs"], dish.allergens).status).toBe("sin_datos");
  });

  it("sin ingredientes pero con declaraciones se evalúa por las declaraciones", () => {
    expect(
      evaluateAllergens(["eggs"], dishWithoutIngredients([declare("eggs", "contains")]).allergens)
        .status,
    ).toBe("no_apto");
    expect(
      evaluateAllergens(["eggs"], dishWithoutIngredients([declare("eggs", "free_from")]).allergens)
        .status,
    ).toBe("apto");
  });
});

describe("evaluateAllergens: varias alergias a la vez", () => {
  it("contiene uno y falta otro: no_apto, con ambos motivos", () => {
    expect(evaluateAllergens(["gluten", "milk"], [declare("gluten", "contains")])).toEqual({
      status: "no_apto",
      contains: ["gluten"],
      mayContain: [],
      missing: ["milk"],
    });
  });

  it("trazas de uno y falta otro: posibles_trazas", () => {
    expect(evaluateAllergens(["gluten", "nuts"], [declare("nuts", "may_contain")])).toEqual({
      status: "posibles_trazas",
      contains: [],
      mayContain: ["nuts"],
      missing: ["gluten"],
    });
  });

  it("contiene, trazas, sin datos y no contiene a la vez: no_apto con todos los motivos", () => {
    const result = evaluateAllergens(
      ["fish", "eggs", "sesame", "celery"],
      [declare("fish", "contains"), declare("eggs", "may_contain"), declare("celery", "free_from")],
    );
    expect(result).toEqual({
      status: "no_apto",
      contains: ["fish"],
      mayContain: ["eggs"],
      missing: ["sesame"],
    });
  });

  it("todos los del perfil declarados free_from: apto", () => {
    const result = evaluateAllergens(
      ["gluten", "milk", "nuts"],
      [declare("gluten", "free_from"), declare("milk", "free_from"), declare("nuts", "free_from")],
    );
    expect(result).toEqual({ status: "apto", contains: [], mayContain: [], missing: [] });
  });
});

describe("evaluateAllergens: alérgenos fuera del perfil", () => {
  it("lo que contiene el plato y no está en el perfil no afecta", () => {
    const declarations = allDeclared("contains").map((d) =>
      d.allergen === "gluten" ? declare("gluten", "free_from") : d,
    );
    expect(evaluateAllergens(["gluten"], declarations).status).toBe("apto");
  });
});

describe("evaluateAllergens: perfil vacío", () => {
  it("devuelve apto aunque el plato no tenga declaraciones (la interfaz no muestra etiquetas)", () => {
    expect(evaluateAllergens([], [])).toEqual({
      status: "apto",
      contains: [],
      mayContain: [],
      missing: [],
    });
  });

  it("devuelve apto aunque el plato contenga alérgenos", () => {
    expect(evaluateAllergens([], allDeclared("contains")).status).toBe("apto");
  });
});

describe("evaluateAllergens: duplicados y contradicciones", () => {
  it("las alergias duplicadas en el perfil no duplican motivos", () => {
    expect(evaluateAllergens(["milk", "milk", "milk"], [declare("milk", "contains")])).toEqual({
      status: "no_apto",
      contains: ["milk"],
      mayContain: [],
      missing: [],
    });
  });

  it.each<[AllergenLevel[], FilterStatus]>([
    [["free_from", "contains"], "no_apto"],
    [["contains", "free_from"], "no_apto"],
    [["free_from", "may_contain"], "posibles_trazas"],
    [["may_contain", "free_from"], "posibles_trazas"],
    [["may_contain", "contains"], "no_apto"],
    [["contains", "may_contain", "free_from"], "no_apto"],
    [["free_from", "free_from"], "apto"],
  ])("declaraciones contradictorias %j: gana la más grave (%s)", (levels, expected) => {
    const declarations = levels.map((level) => declare("soybeans", level));
    expect(evaluateAllergens(["soybeans"], declarations).status).toBe(expected);
  });
});

describe("evaluateAllergens: datos inválidos (nunca se interpretan como 'no contiene')", () => {
  it.each([
    ["nivel desconocido", { allergen: "gluten", level: "none" }],
    ["nivel en mayúsculas", { allergen: "gluten", level: "FREE_FROM" }],
    ["nivel nulo", { allergen: "gluten", level: null }],
    ["nivel ausente", { allergen: "gluten" }],
  ])("%s: el alérgeno queda sin datos", (_, declaration) => {
    const declarations = untyped<AllergenDeclaration[]>([declaration]);
    expect(evaluateAllergens(["gluten"], declarations)).toMatchObject({
      status: "sin_datos",
      missing: ["gluten"],
    });
  });

  it("una declaración inválida no anula una válida del mismo alérgeno", () => {
    const declarations = untyped<AllergenDeclaration[]>([
      { allergen: "gluten", level: "none" },
      { allergen: "gluten", level: "contains" },
    ]);
    expect(evaluateAllergens(["gluten"], declarations).status).toBe("no_apto");
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["un texto", "gluten"],
    ["un número", 42],
    ["alérgeno desconocido", { allergen: "lactose", level: "free_from" }],
  ])("ignora entradas inválidas en las declaraciones (%s)", (_, entry) => {
    const declarations = untyped<AllergenDeclaration[]>([entry, declare("gluten", "free_from")]);
    expect(evaluateAllergens(["gluten"], declarations).status).toBe("apto");
  });

  it.each([
    ["alérgeno desconocido", "lactose"],
    ["texto vacío", ""],
    ["null", null],
  ])(
    "un valor inválido en el perfil (%s) impide el apto: el resultado es sin_datos",
    (_, value) => {
      const profile = untyped<Allergen[]>(["gluten", value]);
      expect(evaluateAllergens(profile, allDeclared("free_from"))).toEqual({
        status: "sin_datos",
        contains: [],
        mayContain: [],
        missing: [],
      });
    },
  );

  it("un valor inválido en el perfil no rebaja un no_apto", () => {
    const profile = untyped<Allergen[]>(["gluten", "lactose"]);
    expect(evaluateAllergens(profile, [declare("gluten", "contains")]).status).toBe("no_apto");
  });
});

describe("evaluateAllergens: determinismo", () => {
  it("los motivos salen en el orden oficial de ALLERGENS, sea cual sea el orden de entrada", () => {
    const result = evaluateAllergens(
      ["molluscs", "gluten", "sesame", "eggs"],
      [declare("molluscs", "contains"), declare("eggs", "contains")],
    );
    expect(result.contains).toEqual(["eggs", "molluscs"]);
    expect(result.missing).toEqual(["gluten", "sesame"]);
  });

  it("no modifica las entradas", () => {
    const profile = Object.freeze(["milk", "gluten"] as Allergen[]);
    const declarations = Object.freeze([Object.freeze(declare("milk", "contains"))]);
    expect(() => evaluateAllergens(profile, declarations)).not.toThrow();
    expect(profile).toEqual(["milk", "gluten"]);
    expect(declarations).toEqual([declare("milk", "contains")]);
  });
});

// ---------------------------------------------------------------------------
// Combinatoria exhaustiva: perfiles de 1, 2 y 3 alergias con cada combinación
// de estados por alérgeno (4^k casos). Cada caso se prueba también con "ruido":
// el resto de alérgenos (fuera del perfil) declarados como "contains".
// ---------------------------------------------------------------------------
type CellState = AllergenLevel | "undeclared";
const CELL_STATES: readonly CellState[] = ["contains", "may_contain", "free_from", "undeclared"];

function combinations(size: number): CellState[][] {
  if (size === 0) return [[]];
  return combinations(size - 1).flatMap((rest) => CELL_STATES.map((state) => [...rest, state]));
}

// Especificación expresada como tabla (sección 5 de ESPECIFICACION.md).
function expectedStatus(states: readonly CellState[]): FilterStatus {
  if (states.includes("contains")) return "no_apto";
  if (states.includes("may_contain")) return "posibles_trazas";
  if (states.includes("undeclared")) return "sin_datos";
  return "apto";
}

// Perfiles elegidos para que no siempre sean los primeros alérgenos de la lista.
const PROFILES: readonly (readonly Allergen[])[] = [
  ["gluten"],
  ["molluscs"],
  ["milk", "nuts"],
  ["sulphites", "crustaceans"],
  ["gluten", "peanuts", "molluscs"],
];

describe.each(PROFILES.map((profile) => [profile.join(" + "), profile] as const))(
  "evaluateAllergens: combinatoria exhaustiva para el perfil %s",
  (_, profile) => {
    const cases = combinations(profile.length).flatMap((states) =>
      [false, true].map((withNoise) => ({ states, withNoise })),
    );

    it.each(cases)("$states (ruido: $withNoise)", ({ states, withNoise }) => {
      const declarations: AllergenDeclaration[] = [];
      profile.forEach((allergen, index) => {
        const state = states[index];
        if (state !== undefined && state !== "undeclared") {
          declarations.push(declare(allergen, state));
        }
      });
      if (withNoise) {
        for (const allergen of ALLERGENS) {
          if (!profile.includes(allergen)) declarations.push(declare(allergen, "contains"));
        }
      }

      const pick = (state: CellState) =>
        ALLERGENS.filter((a) => profile.includes(a) && states[profile.indexOf(a)] === state);

      expect(evaluateAllergens(profile, declarations)).toEqual({
        status: expectedStatus(states),
        contains: pick("contains"),
        mayContain: pick("may_contain"),
        missing: pick("undeclared"),
      });
    });
  },
);
