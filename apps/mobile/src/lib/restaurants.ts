import type { RestaurantRequestData } from "@safebite/core";
import { supabase } from "./supabase";

/**
 * Restaurantes publicados, leídos SOLO de la vista pública (nunca se ven
 * borradores ni quién es el dueño).
 */

const COLUMNS = "id, name, slug, city, address, latitude, longitude";

export type RestaurantSummary = {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

/** Escapa los comodines de LIKE para que el texto se busque literalmente. */
export function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Todos los restaurantes publicados, por nombre (lo que se ve al abrir la búsqueda). */
export async function listPublishedRestaurants(): Promise<RestaurantSummary[]> {
  const { data, error } = await supabase
    .from("public_restaurants")
    .select(COLUMNS)
    .order("name")
    .limit(500);
  if (error) throw error;
  return data;
}

export async function searchRestaurantsByCity(city: string): Promise<RestaurantSummary[]> {
  const { data, error } = await supabase
    .from("public_restaurants")
    .select(COLUMNS)
    .ilike("city", `%${escapeLikePattern(city.trim())}%`)
    .order("name")
    .limit(100);
  if (error) throw error;
  return data;
}

/**
 * Restaurantes publicados con ubicación, para ordenarlos por cercanía EN EL
 * DISPOSITIVO: no se envía la ubicación del usuario al servidor.
 * Con decenas o cientos de restaurantes es suficiente; si algún día hay miles,
 * habrá que filtrar por zona en el servidor.
 */
export async function listRestaurantsWithLocation(): Promise<RestaurantSummary[]> {
  const { data, error } = await supabase
    .from("public_restaurants")
    .select(COLUMNS)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .limit(2000);
  if (error) throw error;
  return data;
}

/** Código de error de la base de datos al superar el límite de solicitudes en 24 horas. */
export const TOO_MANY_REQUESTS_CODE = "SB429";

export function isTooManyRequestsError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === TOO_MANY_REQUESTS_CODE
  );
}

/** "Pide este restaurante": la solicitud queda asociada al usuario (RLS). */
export async function requestRestaurant(request: RestaurantRequestData): Promise<void> {
  const { error } = await supabase.from("restaurant_requests").insert(request);
  if (error) throw error;
}
