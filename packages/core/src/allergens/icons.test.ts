import { describe, expect, it } from "vitest";
import { ALLERGENS } from "./allergens";
import { ALLERGEN_ICONS } from "./icons";

describe("ALLERGEN_ICONS", () => {
  it("tiene un icono para cada uno de los 14 alérgenos", () => {
    expect(Object.keys(ALLERGEN_ICONS).sort()).toEqual([...ALLERGENS].sort());
    for (const allergen of ALLERGENS) {
      expect(ALLERGEN_ICONS[allergen].length).toBeGreaterThan(0);
    }
  });

  it("todas las formas son válidas y caben en el lienzo de 24×24", () => {
    for (const allergen of ALLERGENS) {
      for (const shape of ALLERGEN_ICONS[allergen]) {
        if (shape.type === "path") {
          expect(shape.d).toMatch(/^M/);
        } else {
          expect(shape.r).toBeGreaterThan(0);
          for (const value of [shape.cx - shape.r, shape.cy - shape.r]) {
            expect(value).toBeGreaterThanOrEqual(0);
          }
          for (const value of [shape.cx + shape.r, shape.cy + shape.r]) {
            expect(value).toBeLessThanOrEqual(24);
          }
        }
      }
    }
  });

  it("no hay dos alérgenos con el mismo dibujo", () => {
    const drawings = ALLERGENS.map((a) => JSON.stringify(ALLERGEN_ICONS[a]));
    expect(new Set(drawings).size).toBe(ALLERGENS.length);
  });
});
