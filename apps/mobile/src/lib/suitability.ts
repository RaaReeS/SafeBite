import { suitabilityByRestaurant, type Allergen, type SuitabilitySummary } from "@safebite/core";
import { supabase } from "./supabase";

/**
 * ¿Dónde puede comer el usuario? Se descargan las cartas públicas (platos y
 * alérgenos declarados de los restaurantes publicados y verificados) y se
 * evalúan EN EL MÓVIL con su perfil y el mismo filtro de core que la carta:
 * el perfil de alergias no sale del dispositivo.
 */

/** Supabase devuelve como mucho 1000 filas por consulta: se piden por páginas. */
export const PAGE_SIZE = 1000;

type Page<T> = { data: T[] | null; error: unknown };

export async function fetchAllPages<T>(
  page: (from: number, to: number) => PromiseLike<Page<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < PAGE_SIZE) return rows;
  }
}

export async function getSuitability(
  profile: readonly Allergen[],
): Promise<Record<string, SuitabilitySummary>> {
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
  return suitabilityByRestaurant(dishes, declarations, profile);
}
