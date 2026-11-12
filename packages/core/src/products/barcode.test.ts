import { describe, expect, it } from "vitest";
import { isValidBarcode, normalizeBarcode } from "./barcode";

describe("normalizeBarcode", () => {
  it("quita espacios, tabuladores y guiones de un código escrito a mano", () => {
    expect(normalizeBarcode(" 4006 3813-33931 ")).toBe("4006381333931");
    expect(normalizeBarcode("4006\t381--333931\n")).toBe("4006381333931");
  });

  it("no toca el resto de caracteres (la validación decide)", () => {
    expect(normalizeBarcode("4006a81333931")).toBe("4006a81333931");
  });
});

describe("isValidBarcode", () => {
  it.each([
    ["EAN-8", "96385074"],
    ["UPC-A", "036000291452"],
    ["EAN-13", "4006381333931"],
    ["EAN-13 con dígito de control 0", "0000000000000"],
    ["GTIN-14", "10012345678902"],
  ])("acepta un %s con dígito de control correcto", (_, code) => {
    expect(isValidBarcode(code)).toBe(true);
  });

  it.each([
    ["dígito de control incorrecto", "4006381333932"],
    ["dígito de control incorrecto (EAN-8)", "96385075"],
    ["dígitos intercambiados", "4006381333391"],
    ["7 cifras", "9638507"],
    ["9 cifras", "963850740"],
    ["10 cifras", "9638507400"],
    ["11 cifras", "03600029145"],
    ["15 cifras", "100123456789020"],
    ["vacío", ""],
    ["letra al principio", "a006381333931"],
    ["letra al final", "400638133393a"],
    ["letra en medio", "4006a81333931"],
    ["con espacios (sin normalizar)", "4006 381333931"],
  ])("rechaza un código con %s", (_, code) => {
    expect(isValidBarcode(code)).toBe(false);
  });
});
