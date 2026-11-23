"use server";

import { normalizeImportedDish, parseMenuResponse, type ImportedDish } from "@safebite/core";
import { notFound, redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { requireRestaurantOwner } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { MAX_IMAGE_CHARS, MAX_PAGES } from "@/lib/menu-import/limits";
import { MenuReaderError, getMenuReader } from "@/lib/menu-reader";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Entrada no fiable: se vuelve a comprobar la sesión, el restaurante y todo lo
// que llega del navegador. RLS es la última barrera.

export type ReadMenuState =
  { status: "ok"; dishes: ImportedDish[] } | { status: "error"; message: string };

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

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

function validImages(images: unknown): images is string[] {
  return (
    Array.isArray(images) &&
    images.length >= 1 &&
    images.length <= MAX_PAGES &&
    images.every(
      (image) =>
        typeof image === "string" &&
        image.startsWith("data:image/jpeg;base64,") &&
        image.length <= MAX_IMAGE_CHARS,
    )
  );
}

/**
 * Lee la carta (1-5 páginas en JPEG) y devuelve los platos propuestos. No crea
 * nada: el restaurante los revisa antes. Cuenta para el límite diario.
 */
export async function readMenu(restaurantId: string, images: unknown): Promise<ReadMenuState> {
  const t = getMessages().menuImport;
  const user = await requireRestaurantOwner();
  const supabase = await createSupabaseServerClient();
  await assertOwnRestaurant(supabase, restaurantId, user.id);
  if (!validImages(images)) return { status: "error", message: t.errors.invalidFiles };

  const { error } = await supabase.rpc("register_menu_import", { p_restaurant_id: restaurantId });
  if (error) {
    return {
      status: "error",
      message: error.code === "SB429" ? t.errors.dailyLimit : t.errors.generic,
    };
  }

  let raw: unknown;
  try {
    raw = await getMenuReader().read(images);
  } catch (readerError) {
    if (readerError instanceof MenuReaderError) {
      console.error("Lectura de carta:", readerError.message);
      return { status: "error", message: t.errors.unavailable };
    }
    throw readerError;
  }
  const dishes = parseMenuResponse(raw);
  if (dishes.length === 0) return { status: "error", message: t.errors.noDishes };
  return { status: "ok", dishes };
}

/** Como mucho, platos creados de una vez. */
const MAX_DISHES = 100;

/**
 * Crea los platos revisados. Sin declaraciones de alérgenos (salen «sin datos»
 * hasta que el dueño las confirma); las propuestas se guardan aparte.
 */
export async function createImportedDishes(restaurantId: string, dishes: unknown): Promise<void> {
  const user = await requireRestaurantOwner();
  const supabase = await createSupabaseServerClient();
  await assertOwnRestaurant(supabase, restaurantId, user.id);
  if (!Array.isArray(dishes)) notFound();
  const valid = dishes
    .map(normalizeImportedDish)
    .filter((dish): dish is ImportedDish => dish !== null);
  if (valid.length === 0 || valid.length > MAX_DISHES) notFound();

  const { data: last } = await supabase
    .from("dishes")
    .select("sort_order")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const start = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("dishes").insert(
    valid.map((dish, index) => ({
      restaurant_id: restaurantId,
      name: dish.name,
      description: dish.description,
      price_cents: dish.priceCents,
      category: dish.category,
      ingredients: dish.ingredients,
      sort_order: start + index,
      allergen_suggestions: dish.suggestions,
    })),
  );
  if (error) throw error;
  redirect(`/panel/restaurantes/${restaurantId}/platos?importados=${valid.length}`);
}
