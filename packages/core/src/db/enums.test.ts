import { describe, expect, it } from "vitest";
import { ALLERGENS, type Allergen } from "../allergens/allergens";
import { Constants, type Database } from "./database.types";

// Si cambia el enum en una migración o en core sin cambiar el otro, este test
// falla. Tras cambiar una migración: `pnpm db:reset && pnpm db:types`.

type DbAllergen = Database["public"]["Enums"]["allergen"];

// Comprobación en tiempo de compilación: ambos tipos son idénticos.
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const allergenTypesMatch: Equals<Allergen, DbAllergen> = true;

describe("sincronización de enums entre core y la base de datos", () => {
  it("el enum allergen de Postgres coincide con ALLERGENS (valores y orden)", () => {
    expect(allergenTypesMatch).toBe(true);
    expect(Constants.public.Enums.allergen).toEqual(ALLERGENS);
  });
});
