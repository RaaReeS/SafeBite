import { ALLERGENS, isAllergen, type Allergen } from "../allergens/allergens";
import { isAllergenLevel, type AllergenLevel } from "../allergens/levels";
import {
  evaluateAllergens,
  type AllergenDeclaration,
  type AllergenEvaluation,
} from "../filter/evaluate";
import { FILTER_STATUSES, type FilterStatus } from "../filter/status";

/**
 * Modelo de la carta que comparten la web (carta por QR y vista previa) y la
 * app móvil: agrupa los platos por categoría y evalúa cada uno con el filtro
 * de core. Ninguna interfaz debe repetir esta lógica.
 */

/** Lo mínimo que necesita un plato para mostrarse en la carta. */
export type MenuDishInput = {
  category: string | null;
  sort_order: number;
  allergens: readonly AllergenDeclaration[];
};

export type EvaluatedDish<T extends MenuDishInput> = {
  dish: T;
  evaluation: AllergenEvaluation;
};

export type MenuSection<T extends MenuDishInput> = {
  /** Nombre de la categoría tal como lo escribió el restaurante; null = sin categoría. */
  category: string | null;
  dishes: EvaluatedDish<T>[];
};

/**
 * Nombre visible (sin espacios sobrantes) y clave para agrupar (sin distinguir
 * mayúsculas). Una categoría vacía o de solo espacios cuenta como "sin categoría".
 */
function categoryOf(category: string | null): { name: string; key: string } | null {
  const name = category?.trim() ?? "";
  if (name === "") return null;
  // Stryker disable next-line MethodExpression: pasar a mayúsculas agruparía igual (equivalente).
  return { name, key: name.toLocaleLowerCase("es") };
}

/**
 * Agrupa los platos por categoría (en el orden en que aparecen según
 * sort_order; los platos sin categoría, al final) y evalúa cada uno frente al
 * perfil de alergias.
 */
export function buildMenu<T extends MenuDishInput>(
  dishes: readonly T[],
  profile: readonly Allergen[],
): MenuSection<T>[] {
  const ordered = [...dishes].sort((a, b) => a.sort_order - b.sort_order);
  const sections = new Map<string | null, MenuSection<T>>();

  for (const dish of ordered) {
    const category = categoryOf(dish.category);
    const key = category?.key ?? null;
    let section = sections.get(key);
    if (section === undefined) {
      section = { category: category?.name ?? null, dishes: [] };
      sections.set(key, section);
    }
    section.dishes.push({ dish, evaluation: evaluateAllergens(profile, dish.allergens) });
  }

  const uncategorized = sections.get(null);
  sections.delete(null);
  return uncategorized === undefined
    ? [...sections.values()]
    : [...sections.values(), uncategorized];
}

/** Número de platos en cada estado. */
export function countByStatus<T extends MenuDishInput>(
  sections: readonly MenuSection<T>[],
): Record<FilterStatus, number> {
  const counts = Object.fromEntries(FILTER_STATUSES.map((status) => [status, 0])) as Record<
    FilterStatus,
    number
  >;
  for (const section of sections) {
    for (const { evaluation } of section.dishes) counts[evaluation.status] += 1;
  }
  return counts;
}

/**
 * Agrupa filas de dish_allergens (o de la vista public_dish_allergens) por
 * plato. Un plato sin filas no aparece: sus alérgenos quedarán "sin datos".
 */
export function groupDeclarationsByDish(
  rows: readonly { dish_id: string; allergen: Allergen; level: AllergenLevel }[],
): Map<string, AllergenDeclaration[]> {
  const grouped = new Map<string, AllergenDeclaration[]>();
  for (const { dish_id, allergen, level } of rows) {
    const list = grouped.get(dish_id) ?? [];
    list.push({ allergen, level });
    grouped.set(dish_id, list);
  }
  return grouped;
}

/** Del mejor al peor resultado de un plato, para resumir un restaurante. */
const BEST_FIRST: readonly FilterStatus[] = ["apto", "posibles_trazas", "sin_datos", "no_apto"];

export type RestaurantSuitability = {
  /**
   * El mejor resultado entre sus platos. Solo es `apto` si al menos un plato es
   * apto según lo declarado; un restaurante sin platos queda `sin_datos`.
   */
  status: FilterStatus;
  counts: Record<FilterStatus, number>;
};

/**
 * Resume un restaurante frente a un perfil de alergias: ¿hay algo que esta
 * persona pueda comer? Cada plato se evalúa con el mismo filtro que la carta.
 */
export function restaurantSuitability<T extends MenuDishInput>(
  dishes: readonly T[],
  profile: readonly Allergen[],
): RestaurantSuitability {
  const counts = countByStatus(buildMenu(dishes, profile));
  const status = BEST_FIRST.find((candidate) => counts[candidate] > 0) ?? "sin_datos";
  return { status, counts };
}

/** Plato publicado, tal como lo dan las vistas públicas, para resumir por restaurante. */
export type PublishedDishRow = {
  id: string;
  restaurant_id: string;
  category: string | null;
  sort_order: number;
};

export type SuitabilitySummary = { status: FilterStatus; suitableDishes: number };

/**
 * Resume todos los restaurantes publicados frente a un perfil: para cada uno,
 * restaurantSuitability con sus platos y las declaraciones de cada plato. Lo
 * usan el mapa de la web y el de la app. Un restaurante sin platos no aparece
 * (la interfaz lo trata como "sin datos").
 */
export function suitabilityByRestaurant(
  dishes: readonly PublishedDishRow[],
  declarations: readonly { dish_id: string; allergen: Allergen; level: AllergenLevel }[],
  profile: readonly Allergen[],
): Record<string, SuitabilitySummary> {
  const byDish = groupDeclarationsByDish(declarations);
  const byRestaurant = new Map<string, (MenuDishInput & { id: string })[]>();
  for (const dish of dishes) {
    const list = byRestaurant.get(dish.restaurant_id) ?? [];
    // Un plato sin declaraciones queda con allergens = [] (el filtro: sin datos).
    list.push({ ...dish, allergens: byDish.get(dish.id) ?? [] });
    byRestaurant.set(dish.restaurant_id, list);
  }

  const summary: Record<string, SuitabilitySummary> = {};
  for (const [restaurantId, restaurantDishes] of byRestaurant) {
    const { status, counts } = restaurantSuitability(restaurantDishes, profile);
    summary[restaurantId] = { status, suitableDishes: counts.apto };
  }
  return summary;
}

/** Gravedad de cada nivel, para quedarse con la declaración más grave. */
const TABLE_SEVERITY: Record<AllergenLevel, number> = { contains: 2, may_contain: 1, free_from: 0 };

export type AllergenTableRow<T extends MenuDishInput> = {
  dish: T;
  /** Nivel declarado de cada uno de los 14 alérgenos; null = sin declarar. */
  levels: Record<Allergen, AllergenLevel | null>;
};

export type AllergenTableSection<T extends MenuDishInput> = {
  category: string | null;
  rows: AllergenTableRow<T>[];
};

/**
 * Tabla de alérgenos de la carta (platos × 14 alérgenos), para imprimir. Mismo
 * orden y agrupación por categoría que la carta. Si un alérgeno tiene varias
 * declaraciones, gana la más grave (como en el filtro); las inválidas se ignoran
 * y el alérgeno queda sin declarar, nunca como "no contiene".
 */
export function buildAllergenTable<T extends MenuDishInput>(
  dishes: readonly T[],
): AllergenTableSection<T>[] {
  return buildMenu(dishes, []).map((section) => ({
    category: section.category,
    rows: section.dishes.map(({ dish }) => {
      const levels = Object.fromEntries(ALLERGENS.map((allergen) => [allergen, null])) as Record<
        Allergen,
        AllergenLevel | null
      >;
      for (const declaration of dish.allergens) {
        const { allergen, level } = declaration as { allergen: unknown; level: unknown };
        if (!isAllergen(allergen) || !isAllergenLevel(level)) continue;
        const previous = levels[allergen];
        // Stryker disable next-line EqualityOperator: misma gravedad = mismo nivel, así que `>` y `>=` son equivalentes.
        if (previous === null || TABLE_SEVERITY[level] > TABLE_SEVERITY[previous]) {
          levels[allergen] = level;
        }
      }
      return { dish, levels };
    }),
  }));
}
