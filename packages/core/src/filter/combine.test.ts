import { describe, expect, it } from "vitest";
import type { Allergen } from "../allergens/allergens";
import { combineProfiles } from "./combine";
import { evaluateAllergens } from "./evaluate";

describe("combineProfiles: varias personas a la vez", () => {
  it("une las alergias de todos, sin repetidos y en el orden oficial", () => {
    expect(combineProfiles([["nuts", "gluten"], ["milk", "gluten"], ["eggs"]])).toEqual([
      "gluten",
      "eggs",
      "milk",
      "nuts",
    ]);
  });

  it("sin personas, o con perfiles vacíos, no hay alergias", () => {
    expect(combineProfiles([])).toEqual([]);
    expect(combineProfiles([[], []])).toEqual([]);
  });

  it("un plato apto para uno pero no para otro no es apto para el grupo", () => {
    const glutenFreeWithMilk = [
      { allergen: "gluten", level: "free_from" },
      { allergen: "milk", level: "contains" },
    ] as const;
    const group = combineProfiles([["gluten"], ["milk"]]);
    expect(evaluateAllergens(["gluten"], glutenFreeWithMilk).status).toBe("apto");
    expect(evaluateAllergens(group, glutenFreeWithMilk).status).toBe("no_apto");
  });

  it("conserva al final los valores desconocidos: el filtro nunca da apto con ellos", () => {
    const corrupt = ["inventado"] as unknown as Allergen[];
    const group = combineProfiles([["gluten"], corrupt, ["gluten"]]);
    expect(group).toEqual(["gluten", "inventado"]);
    const allFree = [{ allergen: "gluten", level: "free_from" }] as const;
    expect(evaluateAllergens(group, allFree).status).toBe("sin_datos");
  });
});
