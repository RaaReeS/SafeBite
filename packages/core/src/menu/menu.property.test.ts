import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ALLERGENS } from "../allergens/allergens";
import { ALLERGEN_LEVELS } from "../allergens/levels";
import { evaluateAllergens } from "../filter/evaluate";
import { buildMenu, countByStatus } from "./menu";

const RUNS = { numRuns: 1000 };

const allergenArb = fc.constantFrom(...ALLERGENS);
const declarationArb = fc.record({
  allergen: allergenArb,
  level: fc.constantFrom(...ALLERGEN_LEVELS),
});
const dishesArb = fc.uniqueArray(
  fc.record({
    id: fc.uuid(),
    category: fc.option(fc.constantFrom("Entrantes", "entrantes ", "Postres", "Principales", " "), {
      nil: null,
    }),
    sort_order: fc.integer({ min: 0, max: 50 }),
    allergens: fc.array(declarationArb, { maxLength: 20 }),
  }),
  { selector: (dish) => dish.id, maxLength: 30 },
);
const profileArb = fc.array(allergenArb, { maxLength: 14 });

describe("buildMenu: propiedades", () => {
  it("cada plato aparece exactamente una vez", () => {
    fc.assert(
      fc.property(dishesArb, profileArb, (dishes, profile) => {
        const ids = buildMenu(dishes, profile).flatMap((s) => s.dishes.map((d) => d.dish.id));
        expect([...ids].sort()).toEqual(dishes.map((d) => d.id).sort());
      }),
      RUNS,
    );
  });

  it("la evaluación de cada plato es exactamente la del filtro de core", () => {
    fc.assert(
      fc.property(dishesArb, profileArb, (dishes, profile) => {
        for (const { dish, evaluation } of buildMenu(dishes, profile).flatMap((s) => s.dishes)) {
          expect(evaluation).toEqual(evaluateAllergens(profile, dish.allergens));
        }
      }),
      RUNS,
    );
  });

  it("dentro de cada sección los platos van ordenados por sort_order", () => {
    fc.assert(
      fc.property(dishesArb, (dishes) => {
        for (const section of buildMenu(dishes, [])) {
          const orders = section.dishes.map((d) => d.dish.sort_order);
          expect(orders).toEqual([...orders].sort((a, b) => a - b));
        }
      }),
      RUNS,
    );
  });

  it("los contadores suman el total de platos", () => {
    fc.assert(
      fc.property(dishesArb, profileArb, (dishes, profile) => {
        const counts = countByStatus(buildMenu(dishes, profile));
        expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(dishes.length);
      }),
      RUNS,
    );
  });
});
