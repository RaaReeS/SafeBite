/** Precio máximo admitido: 99.999,99 €. */
export const PRICE_MAX_CENTS = 9_999_999;

// Euros con hasta dos decimales, separados por coma o punto. Sin separador de
// miles: "1.234" sería ambiguo (¿mil doscientos o uno con veintitrés?).
const PRICE_PATTERN = /^(\d+)(?:[.,](\d{1,2}))?$/;

/**
 * Convierte un precio escrito por el usuario ("9,50", "9.50 €") a céntimos.
 * Devuelve null si no es un precio válido. Trabaja con cadenas para evitar
 * errores de coma flotante.
 */
export function parsePriceToCents(input: string): number | null {
  const match = PRICE_PATTERN.exec(input.replace(/€/g, "").replace(/\s/g, ""));
  if (match === null) return null;
  const euros = Number(match[1]);
  const cents = Number((match[2] ?? "").padEnd(2, "0"));
  const total = euros * 100 + cents;
  return total <= PRICE_MAX_CENTS ? total : null;
}

const EUR_FORMAT = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  useGrouping: false,
});

/** Formatea céntimos como precio en euros: 950 -> "9,50 €". */
export function formatCents(cents: number): string {
  return EUR_FORMAT.format(cents / 100);
}

/** Céntimos como texto editable en un campo de formulario: 950 -> "9,50". */
export function centsToPriceInput(cents: number): string {
  const euros = Math.floor(cents / 100);
  const rest = String(cents % 100).padStart(2, "0");
  return `${euros},${rest}`;
}
