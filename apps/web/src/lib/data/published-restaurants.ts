import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Restaurantes publicados y verificados, leídos SOLO de la vista pública (sin
 * borradores ni dueño). La búsqueda por ciudad y el orden por cercanía se
 * hacen en el navegador: la ubicación del usuario no sale de su dispositivo.
 * Con cientos de restaurantes basta; con miles habrá que filtrar en el servidor.
 */
export async function listPublishedRestaurants() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("public_restaurants")
    .select("id, name, slug, city, address, latitude, longitude")
    .order("name")
    .limit(500);
  if (error) throw error;
  return data;
}

export type PublishedRestaurant = Awaited<ReturnType<typeof listPublishedRestaurants>>[number];
