import { z } from "zod";
import type { ValidationErrorCode } from "./messages";

/** Debe coincidir con minimum_password_length de Supabase Auth (supabase/config.toml). */
export const PASSWORD_MIN_LENGTH = 8;
/** Límite de bcrypt: los bytes a partir del 72 se ignorarían. */
export const PASSWORD_MAX_LENGTH = 72;

const error = (code: ValidationErrorCode) => ({ error: code });

const email = z
  .string(error("invalid_email"))
  .trim()
  .toLowerCase()
  .pipe(z.email(error("invalid_email")));

// Las contraseñas no se recortan: los espacios forman parte de ellas.
const newPassword = z
  .string(error("required"))
  .min(PASSWORD_MIN_LENGTH, error("password_too_short"))
  .max(PASSWORD_MAX_LENGTH, error("too_long"));

export const signUpSchema = z.object({
  email,
  password: newPassword,
  /** Casilla de un formulario HTML: llega "on" si está marcada. */
  accepted_terms: z.literal("on", error("terms_required")).transform(() => true as const),
});

/** Sin longitud mínima: al iniciar sesión no se revela la política de contraseñas. */
export const signInSchema = z.object({
  email,
  password: z.string(error("required")).min(1, error("required")),
});

export const emailSchema = z.object({ email });

export const newPasswordSchema = z
  .object({
    password: newPassword,
    password_confirmation: z.string(error("required")),
  })
  .refine((data) => data.password === data.password_confirmation, {
    ...error("passwords_mismatch"),
    path: ["password_confirmation"],
  })
  .transform(({ password }) => ({ password }));

/**
 * Código de verificación enviado por email (6 dígitos en local, 8 en
 * producción según otp_length). Se toleran espacios al copiar y pegar.
 */
export const otpCodeSchema = z.object({
  code: z
    .string(error("invalid_code"))
    .transform((value) => value.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{6,8}$/, error("invalid_code"))),
});
