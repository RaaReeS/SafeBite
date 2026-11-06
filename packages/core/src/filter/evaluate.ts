import { ALLERGENS, isAllergen, type Allergen } from "../allergens/allergens";
import { isAllergenLevel, type AllergenLevel } from "../allergens/levels";
import type { FilterStatus } from "./status";

/** Lo que declara el establecimiento sobre un alérgeno de un plato o producto. */
export type AllergenDeclaration = {
  allergen: Allergen;
  level: AllergenLevel;
};

export type AllergenEvaluation = {
  status: FilterStatus;
  /** Alérgenos del perfil declarados como "contiene". */
  contains: Allergen[];
  /** Alérgenos del perfil declarados como "puede contener trazas". */
  mayContain: Allergen[];
  /** Alérgenos del perfil sin declaración válida. */
  missing: Allergen[];
};

const LEVEL_SEVERITY: Record<AllergenLevel, number> = {
  contains: 2,
  may_contain: 1,
  free_from: 0,
};

function isValidDeclaration(value: unknown): value is AllergenDeclaration {
  if (typeof value !== "object" || value === null) return false;
  const { allergen, level } = value as Record<string, unknown>;
  return isAllergen(allergen) && isAllergenLevel(level);
}

/**
 * Evalúa un plato o producto frente al perfil de alergias de un usuario.
 *
 * Reglas (ante la duda, nunca `apto`):
 * - Solo es `apto` si TODOS los alérgenos del perfil están declarados
 *   explícitamente como `free_from`.
 * - Un alérgeno sin declaración, o con una declaración inválida, cuenta como
 *   "sin datos", nunca como "no contiene".
 * - Si un alérgeno tiene varias declaraciones, gana la más grave.
 * - Un valor inválido en el perfil impide el `apto` (resultado `sin_datos`).
 * - Perfil vacío: `apto` (la interfaz no muestra etiquetas en ese caso).
 * - Prioridad: no_apto > posibles_trazas > sin_datos > apto.
 *
 * El texto libre de ingredientes nunca se tiene en cuenta.
 */
export function evaluateAllergens(
  userAllergens: readonly Allergen[],
  declarations: readonly AllergenDeclaration[],
): AllergenEvaluation {
  const profile = new Set<Allergen>();
  let profileHasInvalidValues = false;
  for (const value of userAllergens) {
    if (isAllergen(value)) {
      profile.add(value);
    } else {
      profileHasInvalidValues = true;
    }
  }

  const declared = new Map<Allergen, AllergenLevel>();
  for (const declaration of declarations) {
    if (!isValidDeclaration(declaration)) continue;
    const previous = declared.get(declaration.allergen);
    if (previous === undefined || LEVEL_SEVERITY[declaration.level] > LEVEL_SEVERITY[previous]) {
      declared.set(declaration.allergen, declaration.level);
    }
  }

  const contains: Allergen[] = [];
  const mayContain: Allergen[] = [];
  const missing: Allergen[] = [];
  for (const allergen of ALLERGENS) {
    if (!profile.has(allergen)) continue;
    const level = declared.get(allergen);
    if (level === undefined) {
      missing.push(allergen);
    } else if (level === "contains") {
      contains.push(allergen);
    } else if (level === "may_contain") {
      mayContain.push(allergen);
    }
  }

  let status: FilterStatus;
  if (contains.length > 0) {
    status = "no_apto";
  } else if (mayContain.length > 0) {
    status = "posibles_trazas";
  } else if (missing.length > 0 || profileHasInvalidValues) {
    status = "sin_datos";
  } else {
    status = "apto";
  }

  return { status, contains, mayContain, missing };
}
