/**
 * Códigos de barras de productos (GTIN): EAN-8, UPC-A (12), EAN-13 y GTIN-14.
 *
 * Se comprueba el dígito de control para no consultar un código mal leído o mal
 * escrito: con un código equivocado se mostraría OTRO producto.
 */

const GTIN_PATTERN = /^(?:\d{8}|\d{12,14})$/;

/** Quita espacios y guiones de un código escrito a mano. */
export function normalizeBarcode(input: string): string {
  return input.replace(/[\s-]/g, "");
}

/** Dígito de control GTIN: pesos 3 y 1 alternos empezando por la derecha. */
function checkDigit(digitsWithoutCheck: string): number {
  let sum = 0;
  for (let i = 0; i < digitsWithoutCheck.length; i++) {
    const digit = Number(digitsWithoutCheck[digitsWithoutCheck.length - 1 - i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

/** true si es un GTIN con longitud y dígito de control correctos. */
export function isValidBarcode(code: string): boolean {
  if (!GTIN_PATTERN.test(code)) return false;
  return checkDigit(code.slice(0, -1)) === Number(code.slice(-1));
}
