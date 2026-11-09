import {
  VALIDATION_ERROR_CODES,
  VALIDATION_MESSAGES,
  type Locale,
  type ValidationErrorCode,
} from "@safebite/core";

/** Estado que devuelven las Server Actions de formularios (useActionState). */
export type FormState = {
  status: "idle" | "error" | "success";
  /** Mensaje general (arriba del formulario). */
  message?: string;
  /** Errores por campo, ya traducidos. */
  fieldErrors?: Record<string, string>;
  /** Valores a conservar en el formulario tras un error (React lo resetea). */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

function isValidationErrorCode(value: string): value is ValidationErrorCode {
  return (VALIDATION_ERROR_CODES as readonly string[]).includes(value);
}

type Issue = { path: PropertyKey[]; message: string };

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

/** Lee un campo de texto de un FormData (undefined si no viene o no es texto). */
export function textField(formData: FormData, name: string): string | undefined {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}
