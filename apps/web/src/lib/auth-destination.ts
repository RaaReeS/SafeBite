import "server-only";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Destino tras confirmar el email o cambiar la contraseña desde un enlace.
 * Los comensales no van al panel de restaurantes, sino a su área (/comensal).
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
  // Comensales: a su área de la web, con un aviso de que también pueden usar la app.
  return `/comensal?aviso=${reason}`;
}
