"use server";

import { ALLERGENS, type Allergen } from "@safebite/core";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { requireDiner } from "@/lib/auth";
import type { FormState } from "@/lib/forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Datos de salud: todas las acciones exigen sesión de comensal y actúan solo
// sobre su propio perfil (RLS lo garantiza también en la base de datos).

/** Consentimiento explícito: exige la casilla marcada también en el servidor. */
export async function giveHealthConsent(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = getMessages();
  const user = await requireDiner();
  if (formData.get("consent") !== "on") {
    return { status: "error", fieldErrors: { consent: t.diner.consent.required } };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ health_data_consent_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { status: "error", message: t.common.genericError };
  refresh();
  return { status: "success" };
}

/** Sustituye el perfil de una sola vez (función atómica en la base de datos). */
export async function saveMyAllergens(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = getMessages();
  await requireDiner();
  const chosen = new Set(formData.getAll("allergen"));
  // Solo los 14 alérgenos conocidos; cualquier otro valor se ignora.
  const allergens: Allergen[] = ALLERGENS.filter((allergen) => chosen.has(allergen));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_my_allergens", { allergens });
  if (error) return { status: "error", message: t.diner.allergies.saveError };
  refresh();
  return { status: "success", message: t.diner.allergies.saved };
}

/** Retira el consentimiento: la base de datos borra a la vez todas las alergias. */
export async function withdrawHealthConsent(): Promise<void> {
  const user = await requireDiner();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ health_data_consent_at: null })
    .eq("id", user.id);
  if (error) throw error;
  redirect("/comensal/cuenta?aviso=retirado");
}

/** Derecho de supresión: borra la cuenta y todos sus datos, y cierra la sesión. */
export async function deleteMyAccount(): Promise<void> {
  await requireDiner();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw error;
  await supabase.auth.signOut({ scope: "local" });
  redirect("/?cuenta=borrada");
}
