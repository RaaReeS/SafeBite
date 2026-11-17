"use server";

import { emailSchema } from "@safebite/core";
import { getMessages } from "@/i18n";
import { requireAdmin } from "@/lib/auth";
import { textField, toFieldErrors, type FormState } from "@/lib/forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Da o quita el plan premium a una cuenta, mientras no haya pagos (decisión del
 * usuario). La base de datos exige además el rol admin con el segundo paso.
 */
export async function setAccountPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = getMessages();
  await requireAdmin();
  const email = textField(formData, "email") ?? "";
  const plan = textField(formData, "plan");
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error.issues), values: { email } };
  }
  if (plan !== "free" && plan !== "premium") {
    return { status: "error", message: t.common.genericError, values: { email } };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_set_account_plan", {
    target_email: parsed.data.email,
    new_plan: plan,
  });
  if (error?.code === "P0002") {
    return { status: "error", fieldErrors: { email: t.admin.plans.notFound }, values: { email } };
  }
  if (error) return { status: "error", message: t.common.genericError, values: { email } };
  return {
    status: "success",
    message: plan === "premium" ? t.admin.plans.madePremium(email) : t.admin.plans.madeFree(email),
  };
}
