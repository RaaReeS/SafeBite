import "server-only";
import { safeRedirectPath } from "@safebite/core";
import type { createSupabaseServerClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type Role = "diner" | "restaurant_owner" | "admin";

/** La zona de la web de cada tipo de cuenta. */
export function homeForRole(role: Role | null | undefined): string {
  if (role === "restaurant_owner") return "/panel";
  if (role === "admin") return "/admin/restaurantes";
  return "/comensal";
}

async function currentRole(supabase: Supabase): Promise<Role | null> {
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (userId === undefined) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return profile?.role ?? null;
}

/**
 * Destino al iniciar sesión: la página desde la que se llegó al login (solo
 * rutas internas) o, si no hay ninguna, la zona de su tipo de cuenta. Así el
 * comensal va directo a /comensal sin pasar por el panel de restaurantes.
 */
export async function destinationAfterLogin(supabase: Supabase, next: unknown): Promise<string> {
  const requested = safeRedirectPath(next, "");
  return requested !== "" ? requested : homeForRole(await currentRole(supabase));
}

/**
 * Destino tras confirmar el email o cambiar la contraseña desde un enlace.
 * Los restaurantes van a `next`; el admin, a la administración; los
 * comensales, a su área con un aviso de que también pueden usar la app.
 */
export async function destinationAfterEmailLink(
  supabase: Supabase,
  next: string,
  reason: "cuenta" | "contrasena",
): Promise<string> {
  const role = await currentRole(supabase);
  if (role === null || role === "restaurant_owner") return next;
  if (role === "admin") return homeForRole(role);
  return `/comensal?aviso=${reason}`;
}
