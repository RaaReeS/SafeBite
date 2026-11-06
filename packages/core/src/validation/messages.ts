import type { Locale } from "../allergens/labels";

/**
 * Los esquemas devuelven códigos de error en lugar de textos, para que web y
 * móvil muestren el mismo mensaje en el idioma del usuario.
 */
export const VALIDATION_ERROR_CODES = [
  "required",
  "too_long",
  "invalid_value",
  "invalid_slug",
  "invalid_email",
  "invalid_phone",
  "invalid_price",
  "duplicate_allergen",
] as const;

export type ValidationErrorCode = (typeof VALIDATION_ERROR_CODES)[number];

export const VALIDATION_MESSAGES: Record<Locale, Record<ValidationErrorCode, string>> = {
  es: {
    required: "Este campo es obligatorio.",
    too_long: "El texto es demasiado largo.",
    invalid_value: "El valor no es válido.",
    invalid_slug:
      "Usa entre 3 y 80 caracteres: letras minúsculas sin tildes, números y guiones (por ejemplo, la-huerta).",
    invalid_email: "Introduce un email válido.",
    invalid_phone: "Introduce un teléfono válido (números, espacios, + y guiones).",
    invalid_price: "Introduce un precio válido, por ejemplo 9,50.",
    duplicate_allergen: "Hay un alérgeno declarado más de una vez.",
  },
};
