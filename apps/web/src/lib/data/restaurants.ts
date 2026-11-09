import "server-only";
import { notFound } from "next/navigation";
import { getCurrentUser, requireRestaurantOwner } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const RESTAURANT_COLUMNS =
  "id, name, slug, city, address, phone, contact_email, published, latitude, longitude, updated_at";

/** Restaurantes del dueño con sesión. RLS ya lo limita; el filtro por owner_id es defensa adicional. */
export async function listMyRestaurants() {
  const user = await requireRestaurantOwner();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(RESTAURANT_COLUMNS)
    .eq("owner_id", user.id)
    .order("name");
  if (error) throw error;
  return data;
}

/** Un restaurante del dueño con sesión. Si no existe o no es suyo: 404 (no se distingue). */
export async function getMyRestaurant(id: string) {
  const user = await requireRestaurantOwner();
  if (!isUuid(id)) notFound();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(RESTAURANT_COLUMNS)
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (data === null) notFound();
  return data;
}

export type MyRestaurant = Awaited<ReturnType<typeof getMyRestaurant>>;

/**
 * Para Route Handlers (descargas): devuelve el restaurante del dueño con sesión
 * o null. No redirige ni lanza notFound(): el handler responde 404 por sí mismo.
 */
export async function findMyRestaurantForDownload(id: string) {
  if (!isUuid(id)) return null;
  const user = await getCurrentUser();
  if (user === null || user.role !== "restaurant_owner") return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("restaurants")
    .select("id, name, slug, published")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  return data;
}
