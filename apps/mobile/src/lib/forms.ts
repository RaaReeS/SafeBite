import {
  VALIDATION_ERROR_CODES,
  VALIDATION_MESSAGES,
  type Locale,
  type ValidationErrorCode,
} from "@safebite/core";
import { getMessages } from "@/i18n";

type Issue = { path: PropertyKey[]; message: string };

function isValidationErrorCode(value: string): value is ValidationErrorCode {
  return (VALIDATION_ERROR_CODES as readonly string[]).includes(value);
}

/** Traduce los errores de un esquema de @safebite/core a textos por campo. */
export function toFieldErrors(issues: readonly Issue[], locale: Locale = "es") {
  const messages = VALIDATION_MESSAGES[locale];
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path.map(String).join(".") || "form";
    if (fieldErrors[field] !== undefined) continue;
    fieldErrors[field] = isValidationErrorCode(issue.message)
      ? messages[issue.message]
      : messages.invalid_value;
  }
  return fieldErrors;
}

const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "too_many_requests",
]);

/**
 * Mensaje para un error de Supabase Auth. `fallback` es el texto genérico de
 * cada pantalla (que no revela si una cuenta existe).
 */
export function authErrorMessage(
  error: { code?: string | undefined; name?: string; message?: string },
  fallback: string,
): string {
  const t = getMessages();
  if (error.code !== undefined && RATE_LIMIT_CODES.has(error.code)) return t.common.tooManyAttempts;
  if (error.name === "AuthRetryableFetchError") return t.common.network;
  return fallback;
}
