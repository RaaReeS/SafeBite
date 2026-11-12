"use server";

import { refresh } from "next/cache";
import { getMessages } from "@/i18n";
import { requireAdmin } from "@/lib/auth";
import { VERIFICATION_NOTE_MAX_LENGTH } from "@/lib/data/admin-restaurants";
import { textField, type FormState } from "@/lib/forms";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// El id llega de .bind(): es entrada no fiable y se valida. La base de datos
// exige además el rol admin y un motivo al rechazar.

async function setVerification(
  restaurantId: string,
  status: "verified" | "pending" | "rejected",
  note: string | null,
) {
  await requireAdmin();
  if (!isUuid(restaurantId)) throw new Error("Restaurante no válido");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_set_restaurant_verification", {
    target_restaurant_id: restaurantId,
    new_status: status,
    ...(note === null ? {} : { note }),
  });
  if (error) throw error;
  refresh();
}

export async function verifyRestaurant(restaurantId: string): Promise<void> {
  await setVerification(restaurantId, "verified", null);
}

export async function resetRestaurantVerification(restaurantId: string): Promise<void> {
  await setVerification(restaurantId, "pending", null);
}

export async function rejectRestaurant(
  restaurantId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = getMessages();
  await requireAdmin();
  const note = (textField(formData, "note") ?? "").trim();
  if (note === "") {
    return { status: "error", fieldErrors: { note: t.admin.restaurants.noteRequired } };
  }
  if (note.length > VERIFICATION_NOTE_MAX_LENGTH) {
    return {
      status: "error",
      fieldErrors: { note: t.admin.restaurants.noteTooLong(VERIFICATION_NOTE_MAX_LENGTH) },
      values: { note },
    };
  }
  await setVerification(restaurantId, "rejected", note);
  return { status: "success" };
}
