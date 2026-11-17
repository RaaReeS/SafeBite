import { ALLERGENS, type Allergen } from "../allergens/allergens";

/**
 * Une los perfiles de alergias de varias personas (perfiles de familia): un
 * plato solo es apto si lo es para todas, así que se evitan las alergias de
 * cualquiera de ellas. Sin repetidos y en el orden oficial de los 14 alérgenos.
 *
 * Seguridad: un valor que no es un alérgeno válido NO se descarta (iría al
 * final). evaluateAllergens lo trata como perfil inválido y nunca da `apto`.
 */
export function combineProfiles(profiles: readonly (readonly Allergen[])[]): Allergen[] {
  const all = new Set<Allergen>(profiles.flat());
  const known = ALLERGENS.filter((allergen) => all.has(allergen));
  const unknown = [...all].filter((value) => !(ALLERGENS as readonly string[]).includes(value));
  return [...known, ...unknown];
}
