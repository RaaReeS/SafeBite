import { describe, expect, it } from "vitest";
import { SLUG_MAX_LENGTH, isValidSlug, slugify } from "./slug";

describe("slugify", () => {
  it.each([
    ["La Huerta", "la-huerta"],
    ["Café Ñandú", "cafe-nandu"],
    ["  Bar   Pepe  ", "bar-pepe"],
    ["Pizzería L'Àvia", "pizzeria-l-avia"],
    ["El Rincón de María & José", "el-rincon-de-maria-jose"],
    ["Mesón 2000", "meson-2000"],
    ["---Hola---", "hola"],
    ["Über Grüße", "uber-grusse"],
    ["Çà et là", "ca-et-la"],
  ])("%j -> %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });

  it("devuelve una cadena vacía si no queda ningún carácter válido", () => {
    expect(slugify("¡¿!?")).toBe("");
    expect(slugify("")).toBe("");
  });

  it(`recorta a ${SLUG_MAX_LENGTH} caracteres sin dejar un guion final`, () => {
    const slug = slugify(`${"a".repeat(79)} b`);
    expect(slug.length).toBeLessThanOrEqual(SLUG_MAX_LENGTH);
    expect(slug.endsWith("-")).toBe(false);
    expect(slug).toBe("a".repeat(79));
  });

  it("lo que genera a partir de un nombre normal es un slug válido", () => {
    for (const name of ["La Huerta Demo", "Café Ñandú", "Mesón 2000", "x".repeat(200)]) {
      expect(isValidSlug(slugify(name))).toBe(true);
    }
  });
});

describe("isValidSlug", () => {
  it.each(["abc", "la-huerta", "meson-2000", "a".repeat(SLUG_MAX_LENGTH)])("acepta %j", (slug) => {
    expect(isValidSlug(slug)).toBe(true);
  });

  it.each([
    ["demasiado corto", "ab"],
    ["demasiado largo", "a".repeat(SLUG_MAX_LENGTH + 1)],
    ["mayúsculas", "La-Huerta"],
    ["acentos", "cafe-ñandu"],
    ["espacios", "la huerta"],
    ["guion inicial", "-huerta"],
    ["guion final", "huerta-"],
    ["guiones dobles", "la--huerta"],
    ["guion bajo", "la_huerta"],
    ["vacío", ""],
  ])("rechaza: %s", (_, slug) => {
    expect(isValidSlug(slug)).toBe(false);
  });
});
