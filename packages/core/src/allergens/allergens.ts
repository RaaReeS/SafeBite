/**
 * Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011, anexo II).
 *
 * Fuente única de verdad: el enum `allergen` de Postgres debe tener exactamente
 * estos valores, en este orden.
 */
export const ALLERGENS = [
  "gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soybeans",
  "milk",
  "nuts",
  "celery",
  "mustard",
  "sesame",
  "sulphites",
  "lupin",
  "molluscs",
] as const;

export type Allergen = (typeof ALLERGENS)[number];

export function isAllergen(value: unknown): value is Allergen {
  return typeof value === "string" && (ALLERGENS as readonly string[]).includes(value);
}
