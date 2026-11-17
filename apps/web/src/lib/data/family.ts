import "server-only";
import { isAllergen, type Allergen, type Database } from "@safebite/core";
import { notFound } from "next/navigation";
import { requireDiner } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Perfiles de familia del comensal con sesión: datos de salud de terceros
 * (RGPD, art. 9). RLS garantiza que solo los ve su titular.
 */

export type AccountPlan = Database["public"]["Enums"]["account_plan"];

export type FamilyMember = { id: string; name: string; allergens: Allergen[] };

export type Family = { members: FamilyMember[]; plan: AccountPlan; limit: number };

export async function getMyFamily(): Promise<Family> {
  const user = await requireDiner();
  const supabase = await createSupabaseServerClient();
  const [members, profile, limit] = await Promise.all([
    supabase.from("family_members").select("id, name").order("created_at"),
    supabase.from("profiles").select("plan").eq("id", user.id).single(),
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

/** Un familiar del titular. Si no existe o no es suyo: 404 (no se distingue). */
export async function getMyFamilyMember(memberId: string): Promise<FamilyMember> {
  if (!isUuid(memberId)) notFound();
  const { members } = await getMyFamily();
  const member = members.find((m) => m.id === memberId);
  if (member === undefined) notFound();
  return member;
}
