import "server-only";

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

/**
 * Cartas públicas (platos y alérgenos declarados de los restaurantes publicados
 * y verificados), para que el navegador calcule dónde puede comer cada grupo
 * de personas con suitabilityByRestaurant (core). Son datos públicos.
 */
export async function listPublicMenus() {
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
  return { dishes, declarations };
}

export type PublicMenus = Awaited<ReturnType<typeof listPublicMenus>>;
