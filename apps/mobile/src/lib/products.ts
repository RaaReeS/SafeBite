import { OFF_PRODUCT_FIELDS, parseOffResponse, type OffLookup } from "@safebite/core";

/**
 * Consulta de productos en Open Food Facts (OFF), directamente desde el móvil.
 * Solo se envía el código de barras: ni el perfil de alergias ni ningún dato
 * del usuario. OFF pide identificar la aplicación en el User-Agent.
 */

export const OFF_API_BASE = "https://world.openfoodfacts.org/api/v2/product";
export const OFF_USER_AGENT = "SafeBite/1.0 (https://safebitee.vercel.app)";
export const LOOKUP_TIMEOUT_MS = 10_000;

export type ProductLookup = OffLookup | { status: "unavailable" } | { status: "network_error" };

export function productUrl(code: string): string {
  return `${OFF_API_BASE}/${encodeURIComponent(code)}?fields=${OFF_PRODUCT_FIELDS.join(",")}`;
}

/** Busca un producto. Nunca lanza: los fallos se devuelven como estado. */
export async function lookupProduct(code: string): Promise<ProductLookup> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
  try {
    const response = await fetch(productUrl(code), {
      headers: { Accept: "application/json", "User-Agent": OFF_USER_AGENT },
      signal: controller.signal,
    });
    // OFF responde 404 con { status: 0 } cuando el producto no existe.
    if (!response.ok && response.status !== 404) return { status: "unavailable" };
    return parseOffResponse(await response.json(), code);
  } catch {
    return { status: "network_error" };
  } finally {
    clearTimeout(timeout);
  }
}
