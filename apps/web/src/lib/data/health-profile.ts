import "server-only";
import { isAllergen, type Allergen } from "@safebite/core";
import { getCurrentUser, requireDiner } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Perfil de salud del comensal con sesión (RGPD, art. 9). RLS garantiza que
 * cada usuario solo lee el suyo; el filtro por id es defensa adicional.
 */
export type HealthProfile = {
  /** Fecha del consentimiento explícito; null si no lo ha dado o lo ha retirado. */
  consentGivenAt: string | null;
  allergens: Allergen[];
};

export async function getMyHealthProfile(): Promise<HealthProfile> {
  const user = await requireDiner();
  const supabase = await createSupabaseServerClient();
  const [{ data: profile, error: profileError }, { data: rows, error: allergensError }] =
    await Promise.all([
      supabase.from("profiles").select("health_data_consent_at").eq("id", user.id).single(),
      supabase.from("user_allergens").select("allergen").eq("user_id", user.id),
    ]);
  if (profileError) throw profileError;
  if (allergensError) throw allergensError;
  return {
    consentGivenAt: profile.health_data_consent_at,
    allergens: rows.map((row) => row.allergen).filter(isAllergen),
  };
}

/**
 * Perfil del comensal con sesión, o null si no hay sesión de comensal (visitante
 * anónimo, restaurante o admin). Para la carta pública: no redirige a nadie.
 */
export async function getHealthProfileIfDiner(): Promise<HealthProfile | null> {
  const user = await getCurrentUser();
  if (user?.role !== "diner") return null;
  return getMyHealthProfile();
}
