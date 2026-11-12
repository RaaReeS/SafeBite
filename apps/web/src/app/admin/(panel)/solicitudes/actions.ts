"use server";

import { refresh } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { isRequestStatus } from "@/lib/data/restaurant-requests";
import { textField } from "@/lib/forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Las claves de grupo llegan del formulario: son entrada no fiable. Solo se
// comprueba su forma; la base de datos exige además el rol admin.
const MAX_KEY_LENGTH = 200;

function isKey(value: string | undefined): value is string {
  return value !== undefined && value.length > 0 && value.length <= MAX_KEY_LENGTH;
}

export async function setRequestStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const nameKey = textField(formData, "name_key");
  const cityKey = textField(formData, "city_key");
  const status = textField(formData, "status");
  if (!isKey(nameKey) || !isKey(cityKey) || !isRequestStatus(status)) {
    throw new Error("Datos de solicitud no válidos");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_set_request_status", {
    target_name_key: nameKey,
    target_city_key: cityKey,
    new_status: status,
  });
  if (error) throw error;
  refresh();
}
