import "server-only";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Destino tras confirmar el email o cambiar la contraseña desde un enlace.
 * Los comensales usan la app: no se les manda al panel (donde verían "esta
 * cuenta no es de restaurante"), sino a una página que les pide volver a la app.
 */
export async function destinationAfterEmailLink(
  supabase: Supabase,
  next: string,
  reason: "cuenta" | "contrasena",
): Promise<string> {
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (userId === undefined) return next;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.role === "restaurant_owner") return next;
  return `/cuenta-confirmada?motivo=${reason}`;
}
