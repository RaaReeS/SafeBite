import { describe, expect, it } from "vitest";
import { ALLERGENS, isAllergen } from "./allergens";
import { ALLERGEN_LABELS } from "./labels";

describe("ALLERGENS", () => {
  it("contiene exactamente los 14 alérgenos del Reglamento UE 1169/2011", () => {
    expect(ALLERGENS).toHaveLength(14);
  });

  it("no tiene duplicados", () => {
    expect(new Set(ALLERGENS).size).toBe(ALLERGENS.length);
  });

  it("usa identificadores snake_case en minúsculas, válidos como valores de enum en Postgres", () => {
    for (const allergen of ALLERGENS) {
      expect(allergen).toMatch(/^[a-z][a-z_]*$/);
    }
  });
});

describe("isAllergen", () => {
  it("acepta cada alérgeno válido", () => {
    for (const allergen of ALLERGENS) {
      expect(isAllergen(allergen)).toBe(true);
    }
  });

  it.each(["", "Gluten", "lactose", "peanut", null, undefined, 1, {}])("rechaza %j", (value) => {
    expect(isAllergen(value)).toBe(false);
  });
});

describe("ALLERGEN_LABELS", () => {
  it("tiene una etiqueta no vacía en español para cada alérgeno", () => {
    for (const allergen of ALLERGENS) {
      expect(ALLERGEN_LABELS.es[allergen].trim()).not.toBe("");
    }
  });
});
