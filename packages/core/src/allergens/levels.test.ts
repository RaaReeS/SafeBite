import { describe, expect, it } from "vitest";
import { ALLERGEN_LEVELS, isAllergenLevel } from "./levels";

describe("ALLERGEN_LEVELS", () => {
  it("contiene exactamente los tres niveles declarables, sin duplicados", () => {
    expect(ALLERGEN_LEVELS).toEqual(["contains", "may_contain", "free_from"]);
  });
});

describe("isAllergenLevel", () => {
  it("acepta cada nivel válido", () => {
    for (const level of ALLERGEN_LEVELS) {
      expect(isAllergenLevel(level)).toBe(true);
    }
  });

  // Un nivel desconocido nunca debe pasar por válido: el filtro lo tratará como
  // "sin datos" y no como "no contiene".
  it.each(["", "Contains", "traces", "none", "unknown", "no_data", null, undefined, 0, false, {}])(
    "rechaza %j",
    (value) => {
      expect(isAllergenLevel(value)).toBe(false);
    },
  );
});
