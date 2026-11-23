import { describe, expect, it } from "vitest";
import { isUnusualPrice, MAX_PRICE_CENTS, parsePrice, UNUSUAL_PRICE_CENTS } from "./price";

describe("parsePrice", () => {
  it.each([
    ["12,50 €", 1250],
    ["12.50", 1250],
    ["12€", 1200],
    ["€ 7,5", 750],
    ["  3 euros ", 300],
    ["0", 0],
    ["1.234,50 €", 123450],
    ["12.000", 1200000],
    ["1.234", 123400],
    ["3 euro", 300],
  ])("convierte el texto %j a céntimos", (text, cents) => {
    expect(parsePrice(text)).toBe(cents);
  });

  it.each([
    [12.5, 1250],
    [8, 800],
    [0.1, 10],
    [9.999, 1000],
  ])("convierte el número %j (euros) a céntimos", (value, cents) => {
    expect(parsePrice(value)).toBe(cents);
  });

  it.each([
    ["—"],
    [""],
    ["   "],
    ["consultar"],
    ["s/m"],
    ["1e9"],
    ["12,50,30"],
    ["1.2.3"],
    ["x12"],
    ["x1.000"],
    ["12,505"],
    ["1.000,505"],
    ["1.000.000"],
  ])("un texto que no es un precio (%j) devuelve null", (text) => {
    expect(parsePrice(text)).toBeNull();
  });

  it.each([[-3], [Number.NaN], [Number.POSITIVE_INFINITY], [null], [undefined], [{}], [true]])(
    "un valor inválido (%j) devuelve null",
    (value) => {
      expect(parsePrice(value)).toBeNull();
    },
  );

  it("nunca acepta un precio absurdo (más de 100 000 €)", () => {
    expect(MAX_PRICE_CENTS).toBe(10_000_000);
    expect(parsePrice(100_000)).toBe(10_000_000);
    expect(parsePrice(100_000.01)).toBeNull();
    expect(parsePrice("100000,01")).toBeNull();
  });
});

describe("isUnusualPrice", () => {
  it("avisa de los precios de más de 200 € (posibles céntimos leídos como euros)", () => {
    expect(isUnusualPrice(UNUSUAL_PRICE_CENTS + 1)).toBe(true);
    expect(isUnusualPrice(125_000)).toBe(true);
  });

  it("no avisa hasta 200 € ni sin precio", () => {
    expect(UNUSUAL_PRICE_CENTS).toBe(20_000);
    expect(isUnusualPrice(UNUSUAL_PRICE_CENTS)).toBe(false);
    expect(isUnusualPrice(1250)).toBe(false);
    expect(isUnusualPrice(null)).toBe(false);
  });
});
