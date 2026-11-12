import "server-only";
import type { Database } from "@safebite/core";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type VerificationStatus = Database["public"]["Enums"]["restaurant_verification_status"];

export const VERIFICATION_STATUSES: readonly VerificationStatus[] = [
  "pending",
  "verified",
  "rejected",
];

export const VERIFICATION_NOTE_MAX_LENGTH = 500;

export function isVerificationStatus(value: unknown): value is VerificationStatus {
  return typeof value === "string" && (VERIFICATION_STATUSES as readonly string[]).includes(value);
}

/**
 * Todos los restaurantes con lo necesario para comprobar la identidad del dueño.
 * La función de la base de datos vuelve a exigir el rol admin.
 */
export async function listRestaurantsForAdmin() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_list_restaurants");
  if (error) throw error;
  return data;
}

export type AdminRestaurant = Awaited<ReturnType<typeof listRestaurantsForAdmin>>[number];
