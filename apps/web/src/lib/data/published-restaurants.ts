import "server-only";
import {
  groupDeclarationsByDish,
  restaurantSuitability,
  type Allergen,
  type AllergenDeclaration,
  type FilterStatus,
} from "@safebite/core";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Restaurantes publicados y verificados, leídos SOLO de la vista pública (sin
 * borradores ni dueño). La búsqueda por ciudad y el orden por cercanía se
 * hacen en el navegador: la ubicación del usuario no sale de su dispositivo.
 * Con cientos de restaurantes basta; con miles habrá que filtrar en el servidor.
 */
export async function listPublishedRestaurants() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_restaurants")
    .select("id, name, slug, city, address, latitude, longitude")
    .order("name")
    .limit(500);
  if (error) throw error;
  return data;
}

export type PublishedRestaurant = Awaited<ReturnType<typeof listPublishedRestaurants>>[number];

/** Supabase devuelve como mucho 1000 filas por consulta: se piden por páginas. */
const PAGE_SIZE = 1000;

async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE_SIZE) return rows;
  }
}

export type SuitabilitySummary = { status: FilterStatus; suitableDishes: number };

/**
 * ¿Qué puede comer este comensal en cada restaurante? Se evalúan todos los
 * platos publicados con su perfil y el mismo filtro de core que la carta
 * (restaurantSuitability). Se calcula en el servidor y solo se le devuelve a él.
 */
export async function suitabilityByRestaurant(
  profile: readonly Allergen[],
): Promise<Record<string, SuitabilitySummary>> {
  const supabase = await createSupabaseServerClient();
  const [dishes, declarations] = await Promise.all([
    fetchAllPages((from, to) =>
      supabase
        .from("public_dishes")
        .select("id, restaurant_id, category, sort_order")
        .order("id")
        .range(from, to),
    ),
    fetchAllPages((from, to) =>
      supabase
        .from("public_dish_allergens")
        .select("dish_id, allergen, level")
        .order("dish_id")
        .order("allergen")
        .range(from, to),
    ),
  ]);

  const byDish = groupDeclarationsByDish(declarations);
  type DishToEvaluate = {
    category: string | null;
    sort_order: number;
    allergens: AllergenDeclaration[];
  };
  const dishesByRestaurant = new Map<string, DishToEvaluate[]>();
  for (const dish of dishes) {
    const list = dishesByRestaurant.get(dish.restaurant_id) ?? [];
    // Un plato sin declaraciones queda con allergens = [] (el filtro: sin datos).
    list.push({ ...dish, allergens: byDish.get(dish.id) ?? [] });
    dishesByRestaurant.set(dish.restaurant_id, list);
  }

  const summary: Record<string, SuitabilitySummary> = {};
  for (const [restaurantId, restaurantDishes] of dishesByRestaurant) {
    const { status, counts } = restaurantSuitability(restaurantDishes, profile);
    summary[restaurantId] = { status, suitableDishes: counts.apto };
  }
  return summary;
}
