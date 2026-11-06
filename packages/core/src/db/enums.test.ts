import { describe, expect, it } from "vitest";
import { ALLERGENS, type Allergen } from "../allergens/allergens";
import { ALLERGEN_LEVELS, type AllergenLevel } from "../allergens/levels";
import { Constants, type Database } from "./database.types";

// Si cambia un enum en una migración o en core sin cambiar el otro, este test
// falla. Tras cambiar una migración: `pnpm db:reset && pnpm db:types`.

type DbEnums = Database["public"]["Enums"];

// Comprobación en tiempo de compilación: ambos tipos son idénticos.
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const allergenTypesMatch: Equals<Allergen, DbEnums["allergen"]> = true;
const allergenLevelTypesMatch: Equals<AllergenLevel, DbEnums["allergen_level"]> = true;

describe("sincronización de enums entre core y la base de datos", () => {
  it("el enum allergen de Postgres coincide con ALLERGENS (valores y orden)", () => {
    expect(allergenTypesMatch).toBe(true);
    expect(Constants.public.Enums.allergen).toEqual(ALLERGENS);
  });

  it("el enum allergen_level de Postgres coincide con ALLERGEN_LEVELS (valores y orden)", () => {
    expect(allergenLevelTypesMatch).toBe(true);
    expect(Constants.public.Enums.allergen_level).toEqual(ALLERGEN_LEVELS);
  });
});
