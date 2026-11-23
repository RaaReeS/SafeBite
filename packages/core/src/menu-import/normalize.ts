import { isAllergen } from "../allergens/allergens";
import { MAX_PRICE_CENTS, parsePrice } from "./price";
import { mergeSuggestions, suggestAllergens, type AllergenSuggestion } from "./suggest";

/** Límites de texto de la tabla `dishes`: lo leído se recorta para que siempre quepa. */
export const DISH_LIMITS = {
  name: 120,
  description: 1000,
  category: 60,
  ingredients: 2000,
} as const;

/** Un plato leído de una carta, pendiente de que el restaurante lo revise. */
export type ImportedDish = {
  name: string;
  description: string | null;
  priceCents: number | null;
  category: string | null;
  ingredients: string | null;
  suggestions: AllergenSuggestion[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Texto recortado; vacío o que no es texto, null. */
function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed.slice(0, max);
}

/** Solo alérgenos oficiales con «contiene» o «puede contener»; lo demás se descarta. */
function suggestionsOf(value: unknown): AllergenSuggestion[] {
  if (!Array.isArray(value)) return [];
  const valid = value.flatMap((item): AllergenSuggestion[] =>
    isRecord(item) &&
    isAllergen(item.allergen) &&
    (item.level === "contains" || item.level === "may_contain")
      ? [{ allergen: item.allergen, level: item.level }]
      : [],
  );
  return mergeSuggestions(valid);
}

type DishTexts = Pick<ImportedDish, "name" | "description" | "category" | "ingredients">;

function textsOf(item: Record<string, unknown>): DishTexts | null {
  const name = text(item.name, DISH_LIMITS.name);
  if (name === null) return null;
  return {
    name,
    description: text(item.description, DISH_LIMITS.description),
    category: text(item.category, DISH_LIMITS.category),
    ingredients: text(item.ingredients, DISH_LIMITS.ingredients),
  };
}

/**
 * Respuesta del modelo que lee la carta (`{ dishes: [...] }`). Es una entrada no
 * fiable: se descarta lo inválido plato a plato y a las propuestas del modelo se
 * suman las del diccionario.
 */
export function parseMenuResponse(raw: unknown): ImportedDish[] {
  if (!isRecord(raw) || !Array.isArray(raw.dishes)) return [];
  return raw.dishes.flatMap((item): ImportedDish[] => {
    if (!isRecord(item)) return [];
    const texts = textsOf(item);
    if (texts === null) return [];
    // Stryker disable next-line MethodExpression: sin el filtro se busca también «null», que no es ninguna palabra del diccionario.
    const words = [texts.name, texts.description, texts.ingredients].filter(Boolean).join(" ");
    return [
      {
        ...texts,
        priceCents: parsePrice(item.price),
        suggestions: mergeSuggestions(suggestionsOf(item.allergens), suggestAllergens(words)),
      },
    ];
  });
}

/**
 * Plato revisado que envía el navegador para crearlo: se valida de nuevo (el
 * navegador no es fiable). No añade propuestas: el restaurante ya las revisó.
 */
export function normalizeImportedDish(input: unknown): ImportedDish | null {
  if (!isRecord(input)) return null;
  const texts = textsOf(input);
  if (texts === null) return null;
  const price = input.priceCents;
  const priceCents =
    typeof price === "number" && Number.isInteger(price) && price >= 0 && price <= MAX_PRICE_CENTS
      ? price
      : null;
  return { ...texts, priceCents, suggestions: suggestionsOf(input.suggestions) };
}
