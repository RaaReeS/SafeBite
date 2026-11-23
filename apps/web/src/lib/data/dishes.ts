import "server-only";
import { groupDeclarationsByDish, normalizeImportedDish } from "@safebite/core";
import { notFound } from "next/navigation";
import { findMyRestaurantForDownload, getMyRestaurant } from "@/lib/data/restaurants";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DISH_COLUMNS =
  "id, restaurant_id, name, description, price_cents, category, ingredients, is_active, sort_order, updated_at, allergen_suggestions";

/**
 * Alérgenos propuestos al importar la carta (pendientes de confirmar). Se
 * validan con la misma lógica que lo que envía el navegador.
 */
export function suggestionsOf(dish: { name: string; allergen_suggestions: unknown }) {
  return (
    normalizeImportedDish({ name: dish.name, suggestions: dish.allergen_suggestions })
      ?.suggestions ?? []
  );
}

/** Platos de un restaurante del dueño con sesión (404 si el restaurante no es suyo). */
export async function listMyDishes(restaurantId: string) {
  const restaurant = await getMyRestaurant(restaurantId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dishes")
    .select(`${DISH_COLUMNS}, dish_allergens(count)`)
    .eq("restaurant_id", restaurant.id)
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return { restaurant, dishes: data };
}

/** Un plato de un restaurante del dueño con sesión (404 si no existe o no es suyo). */
export async function getMyDish(restaurantId: string, dishId: string) {
  const restaurant = await getMyRestaurant(restaurantId);
  if (!isUuid(dishId)) notFound();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dishes")
    .select(DISH_COLUMNS)
    .eq("id", dishId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  if (error) throw error;
  if (data === null) notFound();
  return { restaurant, dish: data };
}

/** Alérgenos declarados de un plato del dueño con sesión. */
export async function listMyDishAllergens(restaurantId: string, dishId: string) {
  const { dish } = await getMyDish(restaurantId, dishId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dish_allergens")
    .select("allergen, level")
    .eq("dish_id", dish.id);
  if (error) throw error;
  return data;
}

/** Número de alérgenos declarados a partir del count embebido de PostgREST. */
export function declaredCount(dish: { dish_allergens: { count: number }[] }): number {
  return dish.dish_allergens[0]?.count ?? 0;
}

/** Categorías ya usadas en la carta, para sugerirlas al escribir. */
export async function listMyCategories(restaurantId: string): Promise<string[]> {
  const { dishes } = await listMyDishes(restaurantId);
  const categories = dishes
    .map((dish) => dish.category)
    .filter((category): category is string => category !== null);
  return [...new Set(categories)].sort((a, b) => a.localeCompare(b, "es"));
}

/**
 * Carta tal como la verían los clientes (solo platos activos), para la vista
 * previa del panel. Se lee con la sesión del dueño (RLS), así que funciona
 * aunque la carta no esté publicada. Devuelve la misma forma que getPublicMenu.
 */
export async function getMyMenuPreview(restaurantId: string) {
  const restaurant = await getMyRestaurant(restaurantId);
  const supabase = await createSupabaseServerClient();

  const { data: dishes, error } = await supabase
    .from("dishes")
    .select("id, name, description, price_cents, category, ingredients, sort_order")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;

  const dishIds = dishes.map((dish) => dish.id);
  const { data: declarations, error: declarationsError } =
    dishIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("dish_allergens")
          .select("dish_id, allergen, level")
          .in("dish_id", dishIds);
  if (declarationsError) throw declarationsError;

  const byDish = groupDeclarationsByDish(declarations);
  return {
    restaurant,
    dishes: dishes.map((dish) => ({ ...dish, allergens: byDish.get(dish.id) ?? [] })),
  };
}

/**
 * Datos de la tabla de alérgenos imprimible: el restaurante y sus platos
 * activos con lo declarado. Solo para su dueño; si no, null (la ruta da 404).
 */
export async function getMyAllergenTableData(restaurantId: string) {
  const restaurant = await findMyRestaurantForDownload(restaurantId);
  if (restaurant === null) return null;
  const supabase = await createSupabaseServerClient();

  const { data: dishes, error } = await supabase
    .from("dishes")
    .select("id, name, category, sort_order")
    .eq("restaurant_id", restaurant.id)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;

  const dishIds = dishes.map((dish) => dish.id);
  const { data: declarations, error: declarationsError } =
    dishIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("dish_allergens")
          .select("dish_id, allergen, level")
          .in("dish_id", dishIds);
  if (declarationsError) throw declarationsError;

  const byDish = groupDeclarationsByDish(declarations);
  return {
    restaurant,
    dishes: dishes.map((dish) => ({ ...dish, allergens: byDish.get(dish.id) ?? [] })),
  };
}
