import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ALLERGENS, type Allergen } from "../allergens/allergens";
import { ALLERGEN_LEVELS } from "../allergens/levels";
import { evaluateAllergens, type AllergenDeclaration } from "./evaluate";
import { compareStatus } from "./status";

// Tests de propiedades: fast-check genera miles de perfiles y cartas al azar y
// comprueba que las invariantes de seguridad se cumplen en todos. Si alguna
// falla, fast-check reduce el caso al ejemplo mínimo y muestra la semilla para
// reproducirlo.

const RUNS = { numRuns: 2000 };

const allergenArb = fc.constantFrom(...ALLERGENS);
const levelArb = fc.constantFrom(...ALLERGEN_LEVELS);
const declarationArb: fc.Arbitrary<AllergenDeclaration> = fc.record({
  allergen: allergenArb,
  level: levelArb,
});
const profileArb = fc.array(allergenArb, { maxLength: 20 });
const declarationsArb = fc.array(declarationArb, { maxLength: 40 });

const isKnown = (values: readonly unknown[]) => (value: unknown) => values.includes(value);

/** Declaraciones "casi válidas": alérgeno real con nivel inválido o al revés. */
const nearMissDeclarationArb = fc.oneof(
  fc.record({
    allergen: allergenArb,
    level: fc
      .oneof(
        fc.constantFrom("none", "FREE_FROM", "free-from", "traces", "", null, undefined),
        fc.string(),
      )
      .filter((v) => !isKnown(ALLERGEN_LEVELS)(v)),
  }),
  fc.record({
    allergen: fc
      .oneof(fc.constantFrom("lactose", "Gluten", "peanut", "", null), fc.string())
      .filter((v) => !isKnown(ALLERGENS)(v)),
    level: levelArb,
  }),
  fc.record({ allergen: allergenArb }),
);

/** Cualquier valor inválido como declaración. */
const junkArb = fc.array(fc.oneof(nearMissDeclarationArb, fc.anything()), { maxLength: 10 });

/** Permutación aleatoria de un array. */
const permutationOf = <T>(items: readonly T[]) =>
  fc.shuffledSubarray([...items], { minLength: items.length, maxLength: items.length });

const declarationsFor = (declarations: readonly AllergenDeclaration[], allergen: Allergen) =>
  declarations.filter((d) => d.allergen === allergen);

describe("evaluateAllergens: propiedades de seguridad", () => {
  it("nunca devuelve apto si algún alérgeno del perfil no está declarado solo como free_from", () => {
    fc.assert(
      fc.property(profileArb, declarationsArb, (profile, declarations) => {
        const { status } = evaluateAllergens(profile, declarations);
        if (status !== "apto") return;
        for (const allergen of profile) {
          const own = declarationsFor(declarations, allergen);
          expect(own.length).toBeGreaterThan(0);
          expect(own.every((d) => d.level === "free_from")).toBe(true);
        }
      }),
      RUNS,
    );
  });

  it("devuelve apto si todos los alérgenos del perfil están declarados y solo como free_from", () => {
    fc.assert(
      fc.property(profileArb, declarationsArb, (profile, declarations) => {
        const allFreeFrom = profile.every((allergen) => {
          const own = declarationsFor(declarations, allergen);
          return own.length > 0 && own.every((d) => d.level === "free_from");
        });
        if (allFreeFrom) {
          expect(evaluateAllergens(profile, declarations).status).toBe("apto");
        }
      }),
      RUNS,
    );
  });

  it("añadir una alergia al perfil nunca hace el resultado menos estricto", () => {
    fc.assert(
      fc.property(profileArb, allergenArb, declarationsArb, (profile, extra, declarations) => {
        const before = evaluateAllergens(profile, declarations).status;
        const after = evaluateAllergens([...profile, extra], declarations).status;
        expect(compareStatus(after, before)).toBeGreaterThanOrEqual(0);
      }),
      RUNS,
    );
  });

  it("añadir un 'contains' de un alérgeno del perfil siempre da no_apto", () => {
    fc.assert(
      fc.property(
        fc.array(allergenArb, { minLength: 1, maxLength: 20 }),
        declarationsArb,
        fc.nat(),
        (profile, declarations, index) => {
          const target = profile[index % profile.length] as Allergen;
          const result = evaluateAllergens(profile, [
            ...declarations,
            { allergen: target, level: "contains" },
          ]);
          expect(result.status).toBe("no_apto");
          expect(result.contains).toContain(target);
        },
      ),
      RUNS,
    );
  });

  it("añadir declaraciones de alérgenos fuera del perfil no cambia el resultado", () => {
    fc.assert(
      fc.property(profileArb, declarationsArb, declarationsArb, (profile, declarations, noise) => {
        const outside = noise.filter((d) => !profile.includes(d.allergen));
        expect(evaluateAllergens(profile, [...declarations, ...outside])).toEqual(
          evaluateAllergens(profile, declarations),
        );
      }),
      RUNS,
    );
  });

  it("el resultado no depende del orden del perfil ni de las declaraciones", () => {
    fc.assert(
      fc.property(
        profileArb.chain((p) => fc.tuple(fc.constant(p), permutationOf(p))),
        declarationsArb.chain((d) => fc.tuple(fc.constant(d), permutationOf(d))),
        ([profile, shuffledProfile], [declarations, shuffledDeclarations]) => {
          expect(evaluateAllergens(shuffledProfile, shuffledDeclarations)).toEqual(
            evaluateAllergens(profile, declarations),
          );
        },
      ),
      RUNS,
    );
  });

  it("los motivos son coherentes con el estado y con el perfil", () => {
    fc.assert(
      fc.property(profileArb, declarationsArb, (profile, declarations) => {
        const { status, contains, mayContain, missing } = evaluateAllergens(profile, declarations);
        const reasons = [...contains, ...mayContain, ...missing];

        // Solo alérgenos del perfil, sin repetir, cada uno en una sola lista.
        expect(reasons.every((a) => profile.includes(a))).toBe(true);
        expect(new Set(reasons).size).toBe(reasons.length);

        // En el orden oficial de ALLERGENS.
        for (const list of [contains, mayContain, missing]) {
          expect(list).toEqual(ALLERGENS.filter((a) => list.includes(a)));
        }

        // El estado corresponde a los motivos según la prioridad.
        const expected =
          contains.length > 0
            ? "no_apto"
            : mayContain.length > 0
              ? "posibles_trazas"
              : missing.length > 0
                ? "sin_datos"
                : "apto";
        expect(status).toBe(expected);
      }),
      RUNS,
    );
  });
});

describe("evaluateAllergens: robustez ante datos inválidos", () => {
  it("no lanza errores y las declaraciones inválidas se ignoran por completo", () => {
    fc.assert(
      fc.property(profileArb, declarationsArb, junkArb, (profile, declarations, junk) => {
        const clean = evaluateAllergens(profile, declarations);
        const dirty = evaluateAllergens(profile, [
          ...declarations,
          ...(junk as AllergenDeclaration[]),
        ]);
        expect(dirty).toEqual(clean);
      }),
      RUNS,
    );
  });

  it("un valor inválido en el perfil nunca permite apto", () => {
    fc.assert(
      fc.property(
        profileArb,
        declarationsArb,
        fc.anything().filter((v) => !(ALLERGENS as readonly unknown[]).includes(v)),
        (profile, declarations, invalid) => {
          const result = evaluateAllergens([...profile, invalid as Allergen], declarations);
          expect(result.status).not.toBe("apto");
        },
      ),
      RUNS,
    );
  });
});
