"use server";

import { ALLERGENS, dishAllergensSchema, dishSchema, type Allergen } from "@safebite/core";
import { refresh } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { UNDECLARED, allergenFieldName } from "@/lib/allergen-form";
import { requireRestaurantOwner } from "@/lib/auth";
import { textField, toFieldErrors, type FormState } from "@/lib/forms";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Igual que en restaurantes: se vuelve a comprobar la sesión, los ids se tratan
// como entrada no fiable y RLS es la última barrera.

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Comprueba que el restaurante existe y es del usuario; si no, 404. */
async function assertOwnRestaurant(supabase: Supabase, restaurantId: string, ownerId: string) {
  if (!isUuid(restaurantId)) notFound();
  const { data } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (data === null) notFound();
}

function readDishForm(formData: FormData) {
  return {
    name: textField(formData, "name"),
    description: textField(formData, "description"),
    price: textField(formData, "price"),
    category: textField(formData, "category"),
    ingredients: textField(formData, "ingredients"),
    is_active: formData.get("is_active") === "on",
  };
}

function valuesOf(input: ReturnType<typeof readDishForm>): Record<string, string> {
  const values: Record<string, string> = { is_active: input.is_active ? "on" : "" };
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

export async function createDish(
  restaurantId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = getMessages();
  const user = await requireRestaurantOwner();
  const supabase = await createSupabaseServerClient();
  await assertOwnRestaurant(supabase, restaurantId, user.id);

  const input = readDishForm(formData);
  const parsed = dishSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: toFieldErrors(parsed.error.issues),
      values: valuesOf(input),
    };
  }

  // Los platos nuevos van al final de la carta.
  const { data: last } = await supabase
    .from("dishes")
    .select("sort_order")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("dishes")
    .insert({
      ...parsed.data,
      restaurant_id: restaurantId,
      sort_order: (last?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error) {
    return { status: "error", message: t.common.genericError, values: valuesOf(input) };
  }

  redirect(`/panel/restaurantes/${restaurantId}/platos/${data.id}`);
}

export async function updateDish(
  restaurantId: string,
  dishId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = getMessages();
  const user = await requireRestaurantOwner();
  const supabase = await createSupabaseServerClient();
  await assertOwnRestaurant(supabase, restaurantId, user.id);
  if (!isUuid(dishId)) notFound();

  const input = readDishForm(formData);
  const parsed = dishSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: toFieldErrors(parsed.error.issues),
      values: valuesOf(input),
    };
  }

  const { data, error } = await supabase
    .from("dishes")
    .update(parsed.data)
    .eq("id", dishId)
    .eq("restaurant_id", restaurantId)
    .select("id")
    .maybeSingle();
  if (error) {
    return { status: "error", message: t.common.genericError, values: valuesOf(input) };
  }
  if (data === null) notFound();

  refresh();
  return { status: "success", message: t.dishes.saved };
}

export async function deleteDish(restaurantId: string, dishId: string): Promise<void> {
  const user = await requireRestaurantOwner();
  const supabase = await createSupabaseServerClient();
  await assertOwnRestaurant(supabase, restaurantId, user.id);
  if (!isUuid(dishId)) notFound();

  const { data, error } = await supabase
    .from("dishes")
    .delete()
    .eq("id", dishId)
    .eq("restaurant_id", restaurantId)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (data === null) notFound();

  redirect(`/panel/restaurantes/${restaurantId}/platos`);
}

/** Sube o baja un plato una posición en la carta. */
export async function moveDish(
  restaurantId: string,
  dishId: string,
  direction: "up" | "down",
): Promise<void> {
  const user = await requireRestaurantOwner();
  const supabase = await createSupabaseServerClient();
  await assertOwnRestaurant(supabase, restaurantId, user.id);
  if (!isUuid(dishId) || (direction !== "up" && direction !== "down")) notFound();

  const { data: dishes, error } = await supabase
    .from("dishes")
    .select("id, sort_order")
    .eq("restaurant_id", restaurantId)
    .order("sort_order")
    .order("created_at");
  if (error) throw error;

  const index = dishes.findIndex((dish) => dish.id === dishId);
  if (index === -1) notFound();
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= dishes.length) return;

  // Se renumera la carta entera (1, 2, 3…) con el plato ya movido, para que el
  // orden sea siempre consecutivo aunque hubiera huecos o empates.
  const ordered = [...dishes];
  const [moved] = ordered.splice(index, 1);
  if (moved === undefined) notFound();
  ordered.splice(target, 0, moved);

  for (const [position, dish] of ordered.entries()) {
    if (dish.sort_order === position + 1) continue;
    const { error: updateError } = await supabase
      .from("dishes")
      .update({ sort_order: position + 1 })
      .eq("id", dish.id)
      .eq("restaurant_id", restaurantId);
    if (updateError) throw updateError;
  }

  refresh();
}

/**
 * Guarda las declaraciones de alérgenos de un plato de una sola vez
 * (set_dish_allergens es atómica: o se guarda todo o nada).
 *
 * Un alérgeno que no llega en el formulario, o que llega como "undeclared",
 * NO se guarda: queda sin datos. Nunca se convierte en "no contiene".
 */
export async function saveDishAllergens(
  restaurantId: string,
  dishId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = getMessages();
  const user = await requireRestaurantOwner();
  const supabase = await createSupabaseServerClient();
  await assertOwnRestaurant(supabase, restaurantId, user.id);
  if (!isUuid(dishId)) notFound();

  const declarations: { allergen: Allergen; level: string }[] = [];
  for (const allergen of ALLERGENS) {
    const value = textField(formData, allergenFieldName(allergen));
    if (value === undefined || value === UNDECLARED) continue;
    declarations.push({ allergen, level: value });
  }
  const parsed = dishAllergensSchema.safeParse(declarations);
  if (!parsed.success) {
    return { status: "error", message: t.allergens.invalid };
  }

  const { data: dish } = await supabase
    .from("dishes")
    .select("id")
    .eq("id", dishId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (dish === null) notFound();

  const { error } = await supabase.rpc("set_dish_allergens", {
    target_dish_id: dish.id,
    declarations: parsed.data,
  });
  if (error) {
    return { status: "error", message: t.common.genericError };
  }

  refresh();
  return { status: "success", message: t.allergens.saved };
}
