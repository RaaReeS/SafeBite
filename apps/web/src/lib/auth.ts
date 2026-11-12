import "server-only";
import type { Database } from "@safebite/core";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UserRole = Database["public"]["Enums"]["user_role"];

export type CurrentUser = {
  id: string;
  email: string | null;
  role: UserRole;
  /** Nivel de autenticación de la sesión: "aal2" si se ha hecho la verificación en dos pasos. */
  aal: "aal1" | "aal2";
};

/** Usuario de la petición actual, verificado en el servidor. Se calcula una vez por petición. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .single();
  if (!profile) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    role: profile.role,
    aal: claims.aal === "aal2" ? "aal2" : "aal1",
  };
});

/**
 * Exige una sesión de dueño de restaurante. Usar al principio de cada página del
 * panel y de cada Server Action, aunque proxy.ts ya haya filtrado.
 */
export async function requireRestaurantOwner(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user === null) redirect("/login");
  // El administrador no tiene restaurantes: su sitio es la administración.
  if (user.role === "admin") redirect("/admin/restaurantes");
  if (user.role !== "restaurant_owner") redirect("/sin-acceso");
  return user;
}

/**
 * Exige una cuenta de administrador, aunque aún no haya hecho la verificación en
 * dos pasos. Solo para la pantalla y las acciones de esa verificación.
 */
export async function requireAdminAccount(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user === null) redirect("/login?next=/admin");
  if (user.role === "restaurant_owner") redirect("/panel");
  if (user.role !== "admin") redirect("/sin-acceso");
  return user;
}

/**
 * Exige una sesión de administrador CON la verificación en dos pasos hecha.
 * Usar al principio de cada página de /admin y de cada Server Action; las
 * funciones de la base de datos vuelven a comprobarlo (aal2).
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireAdminAccount();
  if (user.aal !== "aal2") redirect("/admin/dos-pasos");
  return user;
}
