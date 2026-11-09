import "server-only";
import { notFound } from "next/navigation";
import { requireRestaurantOwner } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const RESTAURANT_COLUMNS =
  "id, name, slug, city, address, phone, contact_email, published, updated_at";

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
