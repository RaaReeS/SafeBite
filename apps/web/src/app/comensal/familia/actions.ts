"use server";

import { ALLERGENS, type Allergen } from "@safebite/core";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { requireDiner } from "@/lib/auth";
import { textField, type FormState } from "@/lib/forms";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Datos de salud de terceros: todas las acciones exigen sesión de comensal.
// Los ids llegan de .bind(): se validan, y RLS comprueba que el familiar es suyo.

const MEMBER_NAME_MAX = 40;

export async function addFamilyMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = getMessages();
  await requireDiner();
  const name = (textField(formData, "name") ?? "").trim();
  const fieldErrors: Record<string, string> = {};
  if (name === "" || name.length > MEMBER_NAME_MAX) fieldErrors.name = t.family.nameInvalid;
  if (formData.get("guardian") !== "on") fieldErrors.guardian = t.family.guardianRequired;
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", fieldErrors, values: { name } };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("add_family_member", {
    member_name: name,
    guardian_confirmed: true,
  });
  if (error?.code === "SB402") {
    return { status: "error", message: t.family.limitReached, values: { name } };
  }
  if (error?.code === "42501") {
    return { status: "error", message: t.family.consentRequired, values: { name } };
  }
  if (error) return { status: "error", message: t.common.genericError, values: { name } };
  redirect(`/comensal/familia/${data}`);
}

export async function renameFamilyMember(
  memberId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = getMessages();
  await requireDiner();
  if (!isUuid(memberId)) return { status: "error", message: t.common.genericError };
  const name = (textField(formData, "name") ?? "").trim();
  if (name === "" || name.length > MEMBER_NAME_MAX) {
    return { status: "error", fieldErrors: { name: t.family.nameInvalid }, values: { name } };
  }
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("family_members").update({ name }).eq("id", memberId);
  if (error) return { status: "error", message: t.common.genericError, values: { name } };
  refresh();
  return { status: "success", message: t.family.renamed };
}

/** Sustituye sus alergias de una vez (función atómica en la base de datos). */
export async function saveFamilyMemberAllergens(
  memberId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = getMessages();
  await requireDiner();
  if (!isUuid(memberId)) return { status: "error", message: t.common.genericError };
  const chosen = new Set(formData.getAll("allergen"));
  // Solo los 14 alérgenos conocidos; cualquier otro valor se ignora.
  const allergens: Allergen[] = ALLERGENS.filter((allergen) => chosen.has(allergen));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_family_member_allergens", {
    target_member_id: memberId,
    allergens,
  });
  if (error) return { status: "error", message: t.diner.allergies.saveError };
  refresh();
  return { status: "success", message: t.family.allergiesSaved };
}

export async function deleteFamilyMember(memberId: string): Promise<void> {
  await requireDiner();
  if (!isUuid(memberId)) throw new Error("Familiar no válido");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("family_members").delete().eq("id", memberId);
  if (error) throw error;
  redirect("/comensal/familia?aviso=borrado");
}
