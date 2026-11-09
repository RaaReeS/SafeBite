import type { Allergen } from "@safebite/core";

/** Valor del editor para un alérgeno sin declarar (no se guarda: queda sin datos). */
export const UNDECLARED = "undeclared";

/** Nombre del campo del formulario del editor para cada alérgeno. */
export function allergenFieldName(allergen: Allergen): string {
  return `allergen_${allergen}`;
}
