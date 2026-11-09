import { describe, expect, it } from "vitest";
import { PRICE_MAX_CENTS, centsToPriceInput, formatCents, parsePriceToCents } from "./price";

describe("parsePriceToCents", () => {
  it.each([
    ["9,50", 950],
    ["9.50", 950],
    ["9,5", 950],
    ["9", 900],
    ["0", 0],
    ["0,05", 5],
    ["12,99 €", 1299],
    ["€ 12,99", 1299],
    ["  7,00  ", 700],
    ["99999,99", 9999999],
  ])("%j -> %d céntimos", (input, expected) => {
    expect(parsePriceToCents(input)).toBe(expected);
  });

  it("no tiene errores de redondeo de coma flotante", () => {
    // Con parseFloat, 0.29 * 100 = 28.999999999999996.
    expect(parsePriceToCents("0,29")).toBe(29);
    expect(parsePriceToCents("1,13")).toBe(113);
    expect(parsePriceToCents("4,35")).toBe(435);
  });

  it.each([
    ["vacío", ""],
    ["solo espacios", "   "],
    ["negativo", "-5"],
    ["tres decimales", "9,999"],
    ["separador de miles", "1.234,50"],
    ["dos separadores", "9,50,1"],
    ["letras", "nueve"],
    ["separador sin parte entera", ",50"],
    ["separador sin decimales", "9,"],
    ["por encima del máximo", "100000"],
    ["notación científica", "1e3"],
  ])("devuelve null si es inválido: %s", (_, input) => {
    expect(parsePriceToCents(input)).toBeNull();
  });

  it(`el máximo aceptado es ${PRICE_MAX_CENTS} céntimos`, () => {
    expect(PRICE_MAX_CENTS).toBe(9999999);
  });
});

describe("formatCents", () => {
  it.each([
    [950, "9,50 €"],
    [5, "0,05 €"],
    [0, "0,00 €"],
    [123456, "1234,56 €"],
  ])("%d -> %j", (cents, expected) => {
    expect(formatCents(cents)).toBe(expected);
  });

  it("ida y vuelta: formatear y volver a leer da el mismo valor", () => {
    for (const cents of [0, 1, 99, 100, 950, 1299, 9999999]) {
      expect(parsePriceToCents(formatCents(cents))).toBe(cents);
    }
  });
});

describe("centsToPriceInput", () => {
  it.each([
    [950, "9,50"],
    [5, "0,05"],
    [0, "0,00"],
    [123456, "1234,56"],
  ])("%d -> %j", (cents, expected) => {
    expect(centsToPriceInput(cents)).toBe(expected);
  });

  it("ida y vuelta con parsePriceToCents", () => {
    for (const cents of [0, 1, 29, 113, 950, PRICE_MAX_CENTS]) {
      expect(parsePriceToCents(centsToPriceInput(cents))).toBe(cents);
    }
  });
});
