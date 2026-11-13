"use server";

import { restaurantSchema } from "@safebite/core";
import { refresh } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { requireRestaurantOwner } from "@/lib/auth";
import { textField, toFieldErrors, type FormState } from "@/lib/forms";
import { geocodeAddress } from "@/lib/geocoding";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Todas las acciones vuelven a comprobar la sesión y tratan el id como entrada
// no fiable (los argumentos de .bind() viajan por el cliente). RLS es la última
// barrera: aunque se manipule el id, nadie puede tocar restaurantes ajenos.

const UNIQUE_VIOLATION = "23505";

type Located =
  | { ok: true; location: { latitude: number | null; longitude: number | null } }
  | { ok: false; state: Pick<FormState, "fieldErrors" | "message"> };

/**
 * Ubica la dirección. Sin dirección no se ubica (la ciudad sola es imprecisa).
 * Si hay dirección y no se encuentra en esa ciudad, o el servicio no responde,
 * NO se guarda: un restaurante mal ubicado o sin ubicar no saldría en el mapa.
 */
async function locate(address: string | null, city: string): Promise<Located> {
  const t = getMessages();
  if (address === null) return { ok: true, location: { latitude: null, longitude: null } };
  const result = await geocodeAddress(address, city);
  if (result.status === "found") return { ok: true, location: result.coordinates };
  if (result.status === "not_found") {
    return { ok: false, state: { fieldErrors: { address: t.restaurant.addressNotFound(city) } } };
  }
  return { ok: false, state: { message: t.restaurant.geocoderUnavailable } };
}

const RLS_VIOLATION = "42501";

function readRestaurantForm(formData: FormData) {
  return {
    name: textField(formData, "name"),
    slug: textField(formData, "slug"),
    city: textField(formData, "city"),
    address: textField(formData, "address"),
    phone: textField(formData, "phone"),
    contact_email: textField(formData, "contact_email"),
  };
}

function valuesOf(input: ReturnType<typeof readRestaurantForm>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}

export async function createRestaurant(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = getMessages();
  await requireRestaurantOwner();
  const input = readRestaurantForm(formData);
  const parsed = restaurantSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: toFieldErrors(parsed.error.issues),
      values: valuesOf(input),
    };
  }

  const located = await locate(parsed.data.address, parsed.data.city);
  if (!located.ok) return { status: "error", ...located.state, values: valuesOf(input) };

  const supabase = await createSupabaseServerClient();
  // owner_id lo pone la base de datos (default auth.uid()); el cliente no puede elegirlo.
  const { data, error } = await supabase
    .from("restaurants")
    .insert({ ...parsed.data, ...located.location })
    .select("id")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        status: "error",
        fieldErrors: { slug: t.restaurant.slugTaken },
        values: valuesOf(input),
      };
    }
    if (error.code === RLS_VIOLATION) {
      return { status: "error", message: t.restaurant.termsRequired, values: valuesOf(input) };
    }
    return { status: "error", message: t.common.genericError, values: valuesOf(input) };
  }

  redirect(`/panel/restaurantes/${data.id}`);
}

export async function updateRestaurant(
  restaurantId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = getMessages();
  const user = await requireRestaurantOwner();
  if (!isUuid(restaurantId)) notFound();

  const input = readRestaurantForm(formData);
  const parsed = restaurantSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: toFieldErrors(parsed.error.issues),
      values: valuesOf(input),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase
    .from("restaurants")
    .select("slug, published, address, city, latitude")
    .eq("id", restaurantId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (current === null) notFound();

  // Cambiar la dirección de una carta publicada rompe los QR impresos: se pide confirmación.
  const slugChanged = current.slug !== parsed.data.slug;
  if (current.published && slugChanged && textField(formData, "confirm_slug_change") !== "on") {
    return {
      status: "error",
      fieldErrors: { confirm_slug_change: t.restaurant.slugChangeRequired },
      values: valuesOf(input),
    };
  }

  // Solo se vuelve a ubicar si cambia la dirección o la ciudad, o si aún no tiene ubicación.
  const addressChanged =
    current.address !== parsed.data.address || current.city !== parsed.data.city;
  let location = {};
  if (addressChanged || current.latitude === null) {
    const located = await locate(parsed.data.address, parsed.data.city);
    if (!located.ok) return { status: "error", ...located.state, values: valuesOf(input) };
    location = located.location;
  }

  const { data, error } = await supabase
    .from("restaurants")
    .update({ ...parsed.data, ...location })
    .eq("id", restaurantId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return {
        status: "error",
        fieldErrors: { slug: t.restaurant.slugTaken },
        values: valuesOf(input),
      };
    }
    return { status: "error", message: t.common.genericError, values: valuesOf(input) };
  }
  if (data === null) notFound();

  refresh();
  return { status: "success", message: t.restaurant.saved };
}

export async function setRestaurantPublished(
  restaurantId: string,
  published: boolean,
): Promise<void> {
  const user = await requireRestaurantOwner();
  if (!isUuid(restaurantId) || typeof published !== "boolean") notFound();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurants")
    .update({ published })
    .eq("id", restaurantId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (data === null) notFound();

  refresh();
}

export async function deleteRestaurant(restaurantId: string): Promise<void> {
  const user = await requireRestaurantOwner();
  if (!isUuid(restaurantId)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurants")
    .delete()
    .eq("id", restaurantId)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (data === null) notFound();

  redirect("/panel");
}
