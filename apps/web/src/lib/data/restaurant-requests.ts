import "server-only";
import type { Database } from "@safebite/core";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RestaurantRequestStatus = Database["public"]["Enums"]["restaurant_request_status"];

export const REQUEST_STATUSES: readonly RestaurantRequestStatus[] = ["pending", "added"];

export function isRequestStatus(value: unknown): value is RestaurantRequestStatus {
  return typeof value === "string" && (REQUEST_STATUSES as readonly string[]).includes(value);
}

/**
 * Solicitudes agrupadas por restaurante y ciudad. La función de la base de datos
 * vuelve a exigir el rol admin y no devuelve quién hizo cada solicitud.
 */
export async function listRequestSummary() {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_request_summary");
  if (error) throw error;
  return data;
}

export type RequestSummary = Awaited<ReturnType<typeof listRequestSummary>>[number];
