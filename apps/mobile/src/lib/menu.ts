import { groupDeclarationsByDish, isValidSlug, type AllergenDeclaration } from "@safebite/core";
import { supabase } from "./supabase";

/**
 * Carta publicada de un restaurante, leída SOLO de las vistas públicas
 * (restaurantes publicados, platos activos, sin owner_id). Sin caché: si el
 * restaurante cambia un alérgeno, se ve en la siguiente carga.
 */

export type MenuRestaurant = {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string | null;
  phone: string | null;
};

export type MenuDish = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  category: string | null;
  ingredients: string | null;
  sort_order: number;
  /** Declaraciones del restaurante; [] si no ha declarado nada (el filtro: sin datos). */
  allergens: AllergenDeclaration[];
};

export type Menu = { restaurant: MenuRestaurant; dishes: MenuDish[] };

/** Devuelve la carta, o null si no existe o no está publicada. */
export async function getMenu(slug: string): Promise<Menu | null> {
  if (!isValidSlug(slug)) return null;

  const { data: restaurant, error } = await supabase
    .from("public_restaurants")
    .select("id, name, slug, city, address, phone")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (restaurant === null) return null;

  const { data: dishes, error: dishesError } = await supabase
    .from("public_dishes")
    .select("id, name, description, price_cents, category, ingredients, sort_order")
    .eq("restaurant_id", restaurant.id)
    .order("sort_order");
  if (dishesError) throw dishesError;

  const ids = dishes.map((dish) => dish.id);
  const { data: declarations, error: declarationsError } =
    ids.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("public_dish_allergens")
          .select("dish_id, allergen, level")
          .in("dish_id", ids);
  if (declarationsError) throw declarationsError;

  const byDish = groupDeclarationsByDish(declarations);
  return {
    restaurant,
    dishes: dishes.map((dish) => ({ ...dish, allergens: byDish.get(dish.id) ?? [] })),
  };
}
