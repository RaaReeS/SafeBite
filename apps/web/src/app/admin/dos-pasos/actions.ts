"use server";

import { redirect } from "next/navigation";
import { getMessages } from "@/i18n";
import { requireAdminAccount } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTotpCode, type TwoFactorState } from "@/lib/two-factor";

// Todas exigen una cuenta de administrador (la sesión puede ser aún aal1).
// Supabase comprueba que el factor sea del usuario de la sesión.

const AFTER_VERIFICATION = "/admin/restaurantes";

/** Empieza el alta: crea un factor TOTP nuevo y devuelve su QR. */
export async function startEnrollment(): Promise<TwoFactorState> {
  const t = getMessages();
  await requireAdminAccount();
  const supabase = await createSupabaseServerClient();

  // Un alta abandonada deja un factor sin verificar: se borra antes de crear otro.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  for (const factor of factors?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `SafeBite ${new Date().toISOString()}`,
  });
  if (error) return { status: "error", message: t.admin.twoFactor.enrollError };
  return {
    status: "idle",
    enrollment: { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret },
  };
}

async function verify(factorId: string, codeValue: unknown, state: TwoFactorState) {
  const t = getMessages();
  const code = parseTotpCode(codeValue);
  if (code === null)
    return { ...state, status: "error" as const, message: t.admin.twoFactor.invalidFormat };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { ...state, status: "error" as const, message: t.admin.twoFactor.wrongCode };
  redirect(AFTER_VERIFICATION);
}

/** Termina el alta con el primer código de la app de autenticación. */
export async function confirmEnrollment(
  prev: TwoFactorState,
  formData: FormData,
): Promise<TwoFactorState> {
  await requireAdminAccount();
  const factorId = prev.enrollment?.factorId;
  if (!isUuid(factorId))
    return { status: "error", message: getMessages().admin.twoFactor.enrollError };
  return verify(factorId, formData.get("code"), prev);
}

/** Segundo paso al entrar: código del autenticador ya dado de alta. */
export async function verifyCode(
  prev: TwoFactorState,
  formData: FormData,
): Promise<TwoFactorState> {
  const t = getMessages();
  await requireAdminAccount();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const factor = data?.totp[0];
  if (factor === undefined) return { status: "error", message: t.admin.twoFactor.noFactor };
  return verify(factor.id, formData.get("code"), prev);
}
