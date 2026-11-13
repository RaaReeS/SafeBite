"use server";

import {
  emailSchema,
  newPasswordSchema,
  safeRedirectPath,
  signInSchema,
  signUpSchema,
} from "@safebite/core";
import { redirect } from "next/navigation";
import { env } from "@/env";
import { getMessages } from "@/i18n";
import { destinationAfterEmailLink } from "@/lib/auth-destination";
import { textField, toFieldErrors, type FormState } from "@/lib/forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "too_many_requests",
]);

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = getMessages();
  const email = textField(formData, "email") ?? "";
  const accountType = textField(formData, "account_type");
  const parsed = signUpSchema.safeParse({
    email,
    password: textField(formData, "password"),
    accepted_terms: textField(formData, "accepted_terms"),
  });
  // El tipo de cuenta se elige siempre a propósito: sin valor por defecto.
  const validType = accountType === "diner" || accountType === "restaurant_owner";
  if (!parsed.success || !validType) {
    return {
      status: "error",
      fieldErrors: {
        ...(parsed.success ? {} : toFieldErrors(parsed.error.issues)),
        ...(validType ? {} : { account_type: t.auth.register.chooseType }),
      },
      values: { email, ...(validType ? { account_type: accountType } : {}) },
    };
  }
  const home = accountType === "diner" ? "/comensal" : "/panel";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${env.siteUrl}/auth/confirmar?next=${home}`,
      // handle_new_user (BD) solo acepta 'restaurant_owner' o 'diner', y
      // registra la aceptación de términos únicamente si es el booleano true.
      data: { role: accountType, accepted_terms: parsed.data.accepted_terms },
    },
  });

  // Email con cuenta confirmada: según la configuración, Supabase responde
  // user_already_exists o un usuario sin identidades (y no envía nada).
  // Decisión del producto: avisar de que la cuenta ya existe en vez de pedir
  // que se revise un email que no llegará.
  if (error?.code === "user_already_exists" || data.user?.identities?.length === 0) {
    return { status: "error", message: t.auth.register.alreadyRegistered, values: { email } };
  }

  if (error) {
    const message =
      error.code !== undefined && RATE_LIMIT_CODES.has(error.code)
        ? t.common.tooManyAttempts
        : t.auth.register.couldNotRegister;
    return { status: "error", message, values: { email } };
  }

  // Con confirmación de email activada no hay sesión hasta abrir el enlace.
  if (data.session === null) {
    return { status: "success", message: t.auth.register.checkEmail };
  }
  redirect(home);
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = getMessages();
  const email = textField(formData, "email") ?? "";
  const parsed = signInSchema.safeParse({ email, password: textField(formData, "password") });
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error.issues), values: { email } };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Supabase solo responde email_not_confirmed si la contraseña es correcta,
    // así que ofrecer el reenvío no revela nada a quien no la conoce.
    if (error.code === "email_not_confirmed") {
      return {
        status: "error",
        message: t.auth.login.emailNotConfirmed,
        values: { email },
        code: "email_not_confirmed",
      };
    }
    const message =
      error.code !== undefined && RATE_LIMIT_CODES.has(error.code)
        ? t.common.tooManyAttempts
        : t.auth.login.invalidCredentials;
    return { status: "error", message, values: { email } };
  }

  redirect(safeRedirectPath(textField(formData, "next")));
}

export async function resendConfirmation(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = getMessages();
  const parsed = emailSchema.safeParse({ email: textField(formData, "email") ?? "" });
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${env.siteUrl}/auth/confirmar?next=/panel` },
  });
  if (error?.code !== undefined && RATE_LIMIT_CODES.has(error.code)) {
    return { status: "error", message: t.common.tooManyAttempts };
  }

  // Misma respuesta en todos los casos: no se revela si la cuenta existe.
  return { status: "success", message: t.auth.login.resent };
}

export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const t = getMessages();
  const email = textField(formData, "email") ?? "";
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error.issues), values: { email } };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.siteUrl}/auth/confirmar?next=/nueva-contrasena`,
  });
  if (error?.code !== undefined && RATE_LIMIT_CODES.has(error.code)) {
    return { status: "error", message: t.common.tooManyAttempts, values: { email } };
  }

  // Misma respuesta exista o no la cuenta: no se revela qué emails están registrados.
  return { status: "success", message: t.auth.forgot.sent };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = getMessages();
  const parsed = newPasswordSchema.safeParse({
    password: textField(formData, "password"),
    password_confirmation: textField(formData, "password_confirmation"),
  });
  if (!parsed.success) {
    return { status: "error", fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const supabase = await createSupabaseServerClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) {
    return { status: "error", message: t.auth.newPassword.expired };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    const message =
      error.code === "same_password" ? t.auth.newPassword.samePassword : t.common.genericError;
    return { status: "error", message };
  }

  redirect(await destinationAfterEmailLink(supabase, "/panel", "contrasena"));
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
