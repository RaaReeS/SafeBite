"use server";

import {
  checkMenuUrl,
  htmlToText,
  normalizeImportedDish,
  parseMenuResponse,
  type ImportedDish,
} from "@safebite/core";
import { notFound, redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { requireRestaurantOwner } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { MAX_IMAGE_BYTES, MAX_PAGES, PAGE_FIELD } from "@/lib/menu-import/limits";
import {
  fetchMenuUrl,
  MenuFetchError,
  type FetchedMenu,
  type MenuFetchFailure,
} from "@/lib/menu-import/fetch-menu-url";
import { pdfText } from "@/lib/menu-import/pdf-text";
import { MenuReaderError, getMenuReader, type MenuReader } from "@/lib/menu-reader";
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
/** Lo que devuelve quien prepara la lectura: la respuesta del lector o un error ya explicado. */
type Produced = { raw: unknown } | Extract<ReadMenuState, { status: "error" }>;

/**
 * Pasos comunes de las tres formas de importar: cuenta el intento (límite
 * diario), lee, marca la lectura como buena y valida los platos. Si algo falla
 * antes de leer, el intento no gasta las 5 lecturas buenas.
 */
async function runRead(
  supabase: Supabase,
  restaurantId: string,
  produce: (reader: MenuReader) => Promise<Produced>,
): Promise<ReadMenuState> {
  const t = getMessages().menuImport;
  const { data: importId, error } = await supabase.rpc("register_menu_import", {
    p_restaurant_id: restaurantId,
  });
  if (error) {
    return {
      status: "error",
      message: error.code === "SB429" ? t.errors.dailyLimit : t.errors.generic,
    };
  }

  let produced: Produced;
  try {
    produced = await produce(getMenuReader());
  } catch (readerError) {
    if (readerError instanceof MenuReaderError) {
      console.error("Lectura de carta:", readerError.message);
      return { status: "error", message: t.errors.unavailable };
    }
    throw readerError;
  }
  if (!("raw" in produced)) return produced;

  const { error: completeError } = await supabase.rpc("complete_menu_import", {
    p_import_id: importId,
  });
  if (completeError) return { status: "error", message: t.errors.generic };
  const dishes = parseMenuResponse(produced.raw);
  if (dishes.length === 0) return { status: "error", message: t.errors.noDishes };
  return { status: "ok", dishes };
}

/** Comprueba la sesión y que el restaurante es del usuario (404 si no). */
async function ownRestaurant(restaurantId: string): Promise<Supabase> {
  const user = await requireRestaurantOwner();
  const supabase = await createSupabaseServerClient();
  await assertOwnRestaurant(supabase, restaurantId, user.id);
  return supabase;
}

/**
 * Lee la carta (1-5 páginas en JPEG) y devuelve los platos propuestos. No crea
 * nada: el restaurante los revisa antes.
 */
export async function readMenu(restaurantId: string, formData: unknown): Promise<ReadMenuState> {
  const t = getMessages().menuImport;
  const supabase = await ownRestaurant(restaurantId);
  const pages = pagesOf(formData);
  if (pages === null) return { status: "error", message: t.errors.invalidFiles };
  const images = await Promise.all(pages.map(toDataUrl));
  return runRead(supabase, restaurantId, async (reader) => ({ raw: await reader.read(images) }));
}

/** Texto pegado o sacado de la web o del PDF: de 20 a 30 000 caracteres. */
const MIN_TEXT = 20;
const MAX_TEXT = 30_000;

/** Lee la carta a partir de su texto, pegado por el restaurante. */
export async function readMenuFromText(
  restaurantId: string,
  text: unknown,
): Promise<ReadMenuState> {
  const t = getMessages().menuImport;
  const supabase = await ownRestaurant(restaurantId);
  const trimmed = typeof text === "string" ? text.trim() : "";
  if (trimmed.length < MIN_TEXT || trimmed.length > MAX_TEXT) {
    return { status: "error", message: t.errors.textLength };
  }
  return runRead(supabase, restaurantId, async (reader) => ({
    raw: await reader.readText(trimmed),
  }));
}

type LinkMessage = Exclude<
  keyof ReturnType<typeof getMessages>["menuImport"]["link"],
  "label" | "hint"
>;

const FETCH_MESSAGES: Record<MenuFetchFailure, LinkMessage> = {
  invalid: "invalid",
  private: "private",
  unreachable: "unreachable",
  tooLarge: "tooLarge",
  unsupported: "unsupported",
  redirects: "unreachable",
};

/**
 * Lee la carta desde un enlace (página web, PDF o imagen). La descarga tiene
 * protecciones contra SSRF (fetchMenuUrl). Una página sin texto (hecha con
 * JavaScript) o un PDF escaneado se explican sin gastar lecturas buenas.
 */
export async function readMenuFromUrl(restaurantId: string, url: unknown): Promise<ReadMenuState> {
  const t = getMessages().menuImport;
  const supabase = await ownRestaurant(restaurantId);
  if (typeof url !== "string" || url.length > 2000) {
    return { status: "error", message: t.link.invalid };
  }
  // Un enlace mal escrito o interno ni siquiera cuenta como intento.
  const checked = checkMenuUrl(url);
  if (!checked.ok) {
    return {
      status: "error",
      message: checked.reason === "private" ? t.link.private : t.link.invalid,
    };
  }
  return runRead(supabase, restaurantId, async (reader) => {
    let fetched: FetchedMenu;
    try {
      fetched = await fetchMenuUrl(checked.url);
    } catch (fetchError) {
      if (fetchError instanceof MenuFetchError) {
        return { status: "error", message: t.link[FETCH_MESSAGES[fetchError.reason]] };
      }
      throw fetchError;
    }
    if (fetched.kind === "image") return { raw: await reader.read([fetched.dataUrl]) };
    const text = fetched.kind === "pdf" ? await pdfText(fetched.data) : htmlToText(fetched.html);
    if (text.length < MIN_TEXT) {
      return {
        status: "error",
        message: fetched.kind === "pdf" ? t.link.scannedPdf : t.link.noText,
      };
    }
    return { raw: await reader.readText(text.slice(0, MAX_TEXT)) };
  });
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
