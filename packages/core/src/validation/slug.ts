// Mismas reglas que el CHECK de restaurants.slug en la base de datos.
export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 80;
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Genera la parte de la URL de la carta (`/r/[slug]`) a partir de un nombre. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/, "");
}

export function isValidSlug(slug: string): boolean {
  return (
    slug.length >= SLUG_MIN_LENGTH && slug.length <= SLUG_MAX_LENGTH && SLUG_PATTERN.test(slug)
  );
}
