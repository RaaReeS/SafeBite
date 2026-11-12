import { ALLERGENS, type Allergen } from "../allergens/allergens";
import type { AllergenDeclaration } from "../filter/evaluate";

/**
 * Traductor de Open Food Facts (OFF) al formato del filtro de alérgenos.
 *
 * OFF es una base de datos colaborativa: indica qué alérgenos CONTIENE un
 * producto (allergens_tags) y cuáles PUEDE CONTENER (traces_tags), pero nunca
 * declara "no contiene". Por eso (ante la duda, nunca `apto`):
 *
 * - Un alérgeno solo se declara `free_from` si OFF marca la lista de
 *   ingredientes como completa, los campos de alérgenos y trazas existen y
 *   todas sus etiquetas son reconocibles.
 * - Una etiqueta desconocida (p. ej. sin normalizar, "es:trigo") impide
 *   cualquier `free_from`: podría ser uno de los alérgenos del usuario.
 * - Datos ausentes o con un formato inesperado no generan declaraciones, de
 *   modo que el filtro devuelve `sin_datos`.
 */

/** Etiquetas de OFF para los 14 alérgenos del Reglamento UE 1169/2011. */
export const OFF_ALLERGEN_TAGS: Readonly<Record<string, Allergen>> = {
  "en:gluten": "gluten",
  "en:crustaceans": "crustaceans",
  "en:eggs": "eggs",
  "en:fish": "fish",
  "en:peanuts": "peanuts",
  "en:soybeans": "soybeans",
  "en:milk": "milk",
  "en:nuts": "nuts",
  "en:celery": "celery",
  "en:mustard": "mustard",
  "en:sesame-seeds": "sesame",
  "en:sulphur-dioxide-and-sulphites": "sulphites",
  "en:lupin": "lupin",
  "en:molluscs": "molluscs",
};

/** Estado de OFF que indica que la lista de ingredientes está completa. */
export const OFF_INGREDIENTS_COMPLETED = "en:ingredients-completed";

/** Campos que hay que pedir a la API de OFF (`?fields=`). */
export const OFF_PRODUCT_FIELDS = [
  "code",
  "product_name",
  "product_name_es",
  "brands",
  "image_front_small_url",
  "ingredients_text",
  "ingredients_text_es",
  "allergens_tags",
  "traces_tags",
  "states_tags",
] as const;

export type OffProduct = {
  code: string;
  name: string | null;
  brands: string | null;
  imageUrl: string | null;
  /** Solo para mostrar: el filtro nunca usa el texto libre de ingredientes. */
  ingredientsText: string | null;
  allergensTags: string[] | null;
  tracesTags: string[] | null;
  statesTags: string[] | null;
};

export type OffLookup =
  { status: "found"; product: OffProduct } | { status: "not_found" } | { status: "invalid" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function tags(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((tag) => typeof tag === "string")) return null;
  return value as string[];
}

function withoutLeadingZeros(code: string): string {
  return code.replace(/^0+/, "");
}

function httpsUrl(value: unknown): string | null {
  const url = text(value);
  return url !== null && url.startsWith("https://") ? url : null;
}

/**
 * Interpreta la respuesta de `GET /api/v2/product/{code}`. Cualquier cosa
 * inesperada es `invalid`: la interfaz no debe mostrar un resultado con ella.
 */
export function parseOffResponse(body: unknown, requestedCode: string): OffLookup {
  if (!isRecord(body)) return { status: "invalid" };
  if (body.status === 0) return { status: "not_found" };
  if (body.status !== 1 || !isRecord(body.product)) return { status: "invalid" };

  const product = body.product;
  // OFF debe devolver el producto pedido; si no, no se muestra nada. OFF puede
  // quitar los ceros iniciales ("0036000291452" -> "36000291452").
  if (
    typeof product.code !== "string" ||
    withoutLeadingZeros(product.code) !== withoutLeadingZeros(requestedCode)
  ) {
    return { status: "invalid" };
  }

  return {
    status: "found",
    product: {
      code: requestedCode,
      name: text(product.product_name_es) ?? text(product.product_name),
      brands: text(product.brands),
      imageUrl: httpsUrl(product.image_front_small_url),
      ingredientsText: text(product.ingredients_text_es) ?? text(product.ingredients_text),
      allergensTags: tags(product.allergens_tags),
      tracesTags: tags(product.traces_tags),
      statesTags: tags(product.states_tags),
    },
  };
}

/** Declaraciones de alérgenos de un producto, listas para `evaluateAllergens`. */
export function productDeclarations(product: OffProduct): AllergenDeclaration[] {
  const declarations: AllergenDeclaration[] = [];
  let hasUnknownTags = false;

  // Stryker disable next-line ArrayDeclaration: sin el campo (null) ya no puede haber "no contiene", así que una etiqueta inventada no cambia el resultado.
  for (const tag of product.allergensTags ?? []) {
    const allergen = OFF_ALLERGEN_TAGS[tag];
    if (allergen === undefined) hasUnknownTags = true;
    else declarations.push({ allergen, level: "contains" });
  }
  // Stryker disable next-line ArrayDeclaration: sin el campo (null) ya no puede haber "no contiene", así que una etiqueta inventada no cambia el resultado.
  for (const tag of product.tracesTags ?? []) {
    const allergen = OFF_ALLERGEN_TAGS[tag];
    if (allergen === undefined) hasUnknownTags = true;
    else declarations.push({ allergen, level: "may_contain" });
  }

  const ingredientsComplete =
    product.statesTags?.includes(OFF_INGREDIENTS_COMPLETED) === true &&
    product.allergensTags !== null &&
    product.tracesTags !== null &&
    !hasUnknownTags;

  if (ingredientsComplete) {
    // El filtro se queda con la declaración más grave de cada alérgeno, así que
    // los que OFF marca como presentes siguen siendo "contiene" o "trazas".
    for (const allergen of ALLERGENS) declarations.push({ allergen, level: "free_from" });
  }
  return declarations;
}

/** Página de OFF para dar de alta un producto que no está en la base de datos. */
export function offAddProductUrl(code: string): string {
  return `https://world.openfoodfacts.org/cgi/product.pl?type=add&code=${encodeURIComponent(code)}`;
}
