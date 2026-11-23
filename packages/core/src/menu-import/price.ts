/** Precio máximo aceptado al leer una carta: 100 000 € (en céntimos). Más es un error de lectura. */
export const MAX_PRICE_CENTS = 10_000_000;

function eurosToCents(euros: number): number | null {
  if (!Number.isFinite(euros) || euros < 0) return null;
  const cents = Math.round(euros * 100);
  return cents > MAX_PRICE_CENTS ? null : cents;
}

/**
 * «1.234,50» (miles con punto y decimales con coma). Un solo grupo de miles:
 * con dos (1.000.000 €) ya se pasa del máximo.
 */
const THOUSANDS = /^\d{1,3}\.\d{3}(,\d{1,2})?$/;
/** «12», «12,5», «12.50». */
const SIMPLE = /^\d+([.,]\d{1,2})?$/;

/**
 * Precio leído de una carta, en céntimos. Acepta números (en euros) y textos
 * como «12,50 €», «12.5», «€ 7,5» o «1.234,50 €». Cualquier otra cosa («—»,
 * «consultar», «s/m») es null: mejor sin precio que con uno inventado.
 */
export function parsePrice(value: unknown): number | null {
  if (typeof value === "number") return eurosToCents(value);
  if (typeof value !== "string") return null;
  // Stryker disable next-line Regex: «\s» y «\s+» con /g quitan los mismos espacios.
  const text = value.replace(/€|euros?/gi, "").replace(/\s+/g, "");
  // Se convierte solo lo que encaja con el formato (los ^ y $ deciden).
  const thousands = THOUSANDS.exec(text)?.[0];
  if (thousands !== undefined) {
    return eurosToCents(Number(thousands.replace(".", "").replace(",", ".")));
  }
  const simple = SIMPLE.exec(text)?.[0];
  return simple === undefined ? null : eurosToCents(Number(simple.replace(",", ".")));
}

/**
 * A partir de 200 € la revisión avisa: suele ser un precio en céntimos leído
 * como euros («12,50» → 1250 €). Solo avisa; el restaurante decide.
 */
export const UNUSUAL_PRICE_CENTS = 20_000;

export function isUnusualPrice(cents: number | null): boolean {
  return cents !== null && cents > UNUSUAL_PRICE_CENTS;
}
