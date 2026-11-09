import "server-only";
import { notFound } from "next/navigation";
import { getMyRestaurant } from "@/lib/data/restaurants";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DISH_COLUMNS =
  "id, restaurant_id, name, description, price_cents, category, ingredients, is_active, sort_order, updated_at";

/** Platos de un restaurante del dueño con sesión (404 si el restaurante no es suyo). */
export async function listMyDishes(restaurantId: string) {
  const restaurant = await getMyRestaurant(restaurantId);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dishes")
    .select(DISH_COLUMNS)
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

/** Categorías ya usadas en la carta, para sugerirlas al escribir. */
export async function listMyCategories(restaurantId: string): Promise<string[]> {
  const { dishes } = await listMyDishes(restaurantId);
  const categories = dishes
    .map((dish) => dish.category)
    .filter((category): category is string => category !== null);
  return [...new Set(categories)].sort((a, b) => a.localeCompare(b, "es"));
}
