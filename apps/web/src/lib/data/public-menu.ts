import "server-only";
import { groupDeclarationsByDish, isValidSlug, type Database } from "@safebite/core";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

/**
 * Cliente SIN sesión: la carta pública se lee siempre como visitante anónimo y
 * solo a través de las vistas public_* (restaurantes publicados, platos activos,
 * sin owner_id). Aunque quien la abra tenga sesión en el panel, aquí no se usa.
 */
function createAnonymousClient() {
  return createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** Carta publicada de un restaurante, o null si no existe o no está publicada. */
export async function getPublicMenu(slug: string) {
  if (!isValidSlug(slug)) return null;
  const supabase = createAnonymousClient();

  const { data: restaurant, error: restaurantError } = await supabase
    .from("public_restaurants")
    .select("id, name, slug, city, address, phone, contact_email")
    .eq("slug", slug)
    .maybeSingle();
  if (restaurantError) throw restaurantError;
  if (restaurant === null) return null;

  const { data: dishes, error: dishesError } = await supabase
    .from("public_dishes")
    .select("id, name, description, price_cents, category, ingredients, sort_order")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order");
  if (dishesError) throw dishesError;

  const dishIds = dishes.map((dish) => dish.id);
  const { data: declarations, error: declarationsError } =
    dishIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("public_dish_allergens")
          .select("dish_id, allergen, level")
          .in("dish_id", dishIds);
  if (declarationsError) throw declarationsError;

  const byDish = groupDeclarationsByDish(declarations);
  return {
    restaurant,
    // Un plato sin declaraciones queda con allergens = [] (el filtro: sin datos).
    dishes: dishes.map((dish) => ({ ...dish, allergens: byDish.get(dish.id) ?? [] })),
  };
}

export type PublicMenu = NonNullable<Awaited<ReturnType<typeof getPublicMenu>>>;
export type MenuRestaurant = PublicMenu["restaurant"];
export type MenuDish = PublicMenu["dishes"][number];
