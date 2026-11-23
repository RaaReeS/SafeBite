import { ALLERGENS, type Allergen } from "../allergens/allergens";
import { ALLERGEN_KEYWORDS } from "./dictionary";

/**
 * Nivel de un alérgeno PROPUESTO al importar una carta. Nunca «no contiene»:
 * ni la IA ni el diccionario pueden declarar que un plato no lleva algo.
 */
export type SuggestedLevel = "contains" | "may_contain";

export type AllergenSuggestion = { allergen: Allergen; level: SuggestedLevel };

/** Minúsculas, sin tildes y con espacios en los bordes para buscar palabras completas. */
function normalizeText(text: string): string {
  const plain = text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
  return ` ${plain} `;
}

/** Alérgenos que sugieren las palabras del texto (nombre, descripción, ingredientes). */
export function suggestAllergens(text: string): AllergenSuggestion[] {
  const normalized = normalizeText(text);
  return ALLERGENS.filter((allergen) =>
    ALLERGEN_KEYWORDS[allergen].some((word) => normalized.includes(` ${word} `)),
  ).map((allergen) => ({ allergen, level: "contains" }));
}

/** Une varias listas de propuestas: si coinciden en un alérgeno, gana «contiene». */
export function mergeSuggestions(...lists: AllergenSuggestion[][]): AllergenSuggestion[] {
  const levels = new Map<Allergen, SuggestedLevel>();
  for (const { allergen, level } of lists.flat()) {
    if (level === "contains" || !levels.has(allergen)) levels.set(allergen, level);
  }
  return ALLERGENS.flatMap((allergen) => {
    const level = levels.get(allergen);
    return level === undefined ? [] : [{ allergen, level }];
  });
}
