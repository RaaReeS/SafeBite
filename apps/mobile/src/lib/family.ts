import { isAllergen, type Allergen, type Database } from "@safebite/core";
import { supabase } from "./supabase";

/**
 * Perfiles de familia: datos de salud de terceros (RGPD, art. 9). Todo pasa por
 * RLS: solo el titular de la cuenta ve y modifica a su familia.
 */

export type AccountPlan = Database["public"]["Enums"]["account_plan"];
export type FamilyMember = { id: string; name: string; allergens: Allergen[] };
export type Family = { members: FamilyMember[]; plan: AccountPlan; limit: number };

/** Código de la base de datos al superar el número de familiares del plan. */
export const FAMILY_LIMIT_CODE = "SB402";

export function isFamilyLimitError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === FAMILY_LIMIT_CODE
  );
}

export async function getFamily(userId: string): Promise<Family> {
  const [members, profile, limit] = await Promise.all([
    supabase.from("family_members").select("id, name").order("created_at"),
    supabase.from("profiles").select("plan").eq("id", userId).single(),
    supabase.rpc("family_member_limit"),
  ]);
  if (members.error) throw members.error;
  if (profile.error) throw profile.error;
  if (limit.error) throw limit.error;

  const ids = members.data.map((member) => member.id);
  const { data: rows, error } =
    ids.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("family_member_allergens")
          .select("member_id, allergen")
          .in("member_id", ids);
  if (error) throw error;

  return {
    plan: profile.data.plan,
    limit: limit.data ?? 1,
    members: members.data.map((member) => ({
      ...member,
      allergens: rows
        .filter((row) => row.member_id === member.id)
        .map((row) => row.allergen)
        .filter(isAllergen),
    })),
  };
}

/** Alta con la declaración de tutor o permiso (la base de datos la exige). Devuelve su id. */
export async function addFamilyMember(name: string): Promise<string> {
  const { data, error } = await supabase.rpc("add_family_member", {
    member_name: name,
    guardian_confirmed: true,
  });
  if (error) throw error;
  return data;
}

/** Sustituye sus alergias de una vez (función atómica en la base de datos). */
export async function setFamilyMemberAllergens(
  memberId: string,
  allergens: readonly Allergen[],
): Promise<void> {
  const { error } = await supabase.rpc("set_family_member_allergens", {
    target_member_id: memberId,
    allergens: [...allergens],
  });
  if (error) throw error;
}

export async function renameFamilyMember(memberId: string, name: string): Promise<void> {
  const { error } = await supabase.from("family_members").update({ name }).eq("id", memberId);
  if (error) throw error;
}

export async function deleteFamilyMember(memberId: string): Promise<void> {
  const { error } = await supabase.from("family_members").delete().eq("id", memberId);
  if (error) throw error;
}
