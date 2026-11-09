import { isAllergen, type Allergen } from "@safebite/core";
import { supabase } from "./supabase";

/**
 * Acceso a los datos de salud del usuario (RGPD, art. 9). Todo pasa por RLS:
 * cada usuario solo puede leer y modificar su propio perfil.
 */

export type HealthProfile = {
  /** Fecha del consentimiento explícito; null si no lo ha dado o lo ha retirado. */
  consentGivenAt: string | null;
  allergens: Allergen[];
};

export async function getHealthProfile(userId: string): Promise<HealthProfile> {
  const [{ data: profile, error: profileError }, { data: rows, error: allergensError }] =
    await Promise.all([
      supabase.from("profiles").select("health_data_consent_at").eq("id", userId).single(),
      supabase.from("user_allergens").select("allergen").eq("user_id", userId),
    ]);
  if (profileError) throw profileError;
  if (allergensError) throw allergensError;
  return {
    consentGivenAt: profile.health_data_consent_at,
    allergens: rows.map((row) => row.allergen).filter(isAllergen),
  };
}

export async function giveHealthConsent(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ health_data_consent_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

/** Retira el consentimiento: la base de datos borra a la vez todas las alergias guardadas. */
export async function withdrawHealthConsent(userId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ health_data_consent_at: null })
    .eq("id", userId);
  if (error) throw error;
}

/** Sustituye el perfil de alergias de una sola vez (función atómica en la BD). */
export async function saveMyAllergens(allergens: readonly Allergen[]): Promise<void> {
  const { error } = await supabase.rpc("set_my_allergens", { allergens: [...allergens] });
  if (error) throw error;
}

/** Borra la cuenta y todos sus datos (derecho de supresión) y cierra la sesión local. */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw error;
  await supabase.auth.signOut({ scope: "local" });
}
