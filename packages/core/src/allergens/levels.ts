/**
 * Nivel que declara el establecimiento para un alérgeno en un plato.
 *
 * Fuente única de verdad: el enum `allergen_level` de Postgres debe tener
 * exactamente estos valores, en este orden.
 *
 * No existe un nivel "sin datos": la ausencia de declaración lo representa.
 */
export const ALLERGEN_LEVELS = [
  "contains", // contiene
  "may_contain", // puede contener trazas
  "free_from", // no contiene
] as const;

export type AllergenLevel = (typeof ALLERGEN_LEVELS)[number];

export function isAllergenLevel(value: unknown): value is AllergenLevel {
  return typeof value === "string" && (ALLERGEN_LEVELS as readonly string[]).includes(value);
}
