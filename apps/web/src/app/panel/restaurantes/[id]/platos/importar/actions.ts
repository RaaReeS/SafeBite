"use server";

import { normalizeImportedDish, parseMenuResponse, type ImportedDish } from "@safebite/core";
import { notFound, redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { requireRestaurantOwner } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { MAX_IMAGE_BYTES, MAX_PAGES, PAGE_FIELD } from "@/lib/menu-import/limits";
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

/** Páginas del formulario: de 1 a 5 archivos JPEG de 700 KB como máximo. */
function pagesOf(formData: unknown): File[] | null {
  if (!(formData instanceof FormData)) return null;
  const pages = formData.getAll(PAGE_FIELD);
  const valid = pages.every(
    (page): page is File =>
      page instanceof File &&
      page.type === "image/jpeg" &&
      page.size > 0 &&
      page.size <= MAX_IMAGE_BYTES,
  );
  if (!valid || pages.length < 1 || pages.length > MAX_PAGES) return null;
  return pages as File[];
}

async function toDataUrl(page: File): Promise<string> {
  const base64 = Buffer.from(await page.arrayBuffer()).toString("base64");
  return `data:image/jpeg;base64,${base64}`;
}

/**
 * Lee la carta (1-5 páginas en JPEG) y devuelve los platos propuestos. No crea
 * nada: el restaurante los revisa antes. Cuenta para el límite diario.
 */
export async function readMenu(restaurantId: string, formData: unknown): Promise<ReadMenuState> {
  const t = getMessages().menuImport;
  const user = await requireRestaurantOwner();
  const supabase = await createSupabaseServerClient();
  await assertOwnRestaurant(supabase, restaurantId, user.id);
  const pages = pagesOf(formData);
  if (pages === null) return { status: "error", message: t.errors.invalidFiles };
  const images = await Promise.all(pages.map(toDataUrl));

  // Cuenta como intento; solo pasa a lectura buena si el servicio lee la carta.
  const { data: importId, error } = await supabase.rpc("register_menu_import", {
    p_restaurant_id: restaurantId,
  });
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
  const { error: completeError } = await supabase.rpc("complete_menu_import", {
    p_import_id: importId,
  });
  if (completeError) return { status: "error", message: t.errors.generic };
  const dishes = parseMenuResponse(raw);
  if (dishes.length === 0) return { status: "error", message: t.errors.noDishes };
  return { status: "ok", dishes };
}

/** Como mucho, platos creados de una vez (5 páginas de carta caben de sobra). */
const MAX_DISHES = 300;

export type CreateDishesState = { status: "error"; message: string };

/**
 * Crea los platos revisados. Sin declaraciones de alérgenos (salen «sin datos»
 * hasta que el dueño las confirma); las propuestas se guardan aparte.
 */
export async function createImportedDishes(
  restaurantId: string,
  dishes: unknown,
): Promise<CreateDishesState> {
  const t = getMessages().menuImport;
  const user = await requireRestaurantOwner();
  const supabase = await createSupabaseServerClient();
  await assertOwnRestaurant(supabase, restaurantId, user.id);
  if (!Array.isArray(dishes)) return { status: "error", message: t.errors.createFailed };
  const valid = dishes
    .map(normalizeImportedDish)
    .filter((dish): dish is ImportedDish => dish !== null);
  if (valid.length === 0 || valid.length > MAX_DISHES) {
    return { status: "error", message: t.errors.createFailed };
  }

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
  if (error) {
    console.error("No se han podido crear los platos importados:", error.message);
    return { status: "error", message: t.errors.createFailed };
  }
  redirect(`/panel/restaurantes/${restaurantId}/platos?importados=${valid.length}`);
}
