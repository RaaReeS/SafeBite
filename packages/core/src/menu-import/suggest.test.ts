import { describe, expect, it } from "vitest";
import { ALLERGENS } from "../allergens/allergens";
import { ALLERGEN_KEYWORDS } from "./dictionary";
import { mergeSuggestions, suggestAllergens } from "./suggest";

const allergensOf = (text: string) => suggestAllergens(text).map((s) => s.allergen);

describe("suggestAllergens", () => {
  it.each([
    ["Gambas al ajillo", ["crustaceans"]],
    ["Tarta de QUESO", ["milk"]],
    ["Bizcocho de harina de trigo", ["gluten"]],
    ["Patatas asadas", []],
    ["Salmón a la plancha", ["fish"]],
    ["Ensalada con nueces y almendras", ["nuts"]],
    ["Tortilla de patatas con huevo", ["eggs"]],
    ["Pollo al curry con cacahuete", ["peanuts"]],
    ["Edamame con salsa de soja", ["soybeans"]],
    ["Crema de apio", ["celery"]],
    ["Salchichas con mostaza", ["mustard"]],
    ["Hummus con tahini y sésamo", ["sesame"]],
    ["Copa de vino tinto", ["sulphites"]],
    ["Ensalada de altramuces", ["lupin"]],
    ["Mejillones al vapor", ["molluscs"]],
  ])("«%s» propone %j", (text, expected) => {
    expect(allergensOf(text)).toEqual(expected);
  });

  it("no tiene en cuenta mayúsculas ni tildes", () => {
    expect(allergensOf("SALMON")).toEqual(["fish"]);
    expect(allergensOf("sésamo")).toEqual(allergensOf("SESAMO"));
  });

  it("solo cuenta palabras completas («pan» no salta con «panceta», «nata» con «natación»)", () => {
    expect(allergensOf("Panceta ibérica")).toEqual([]);
    expect(allergensOf("Natación")).toEqual([]);
    expect(allergensOf("Pan de pueblo")).toEqual(["gluten"]);
  });

  it("reconoce expresiones de varias palabras, aunque haya signos entre ellas", () => {
    expect(allergensOf("Salsa con frutos secos")).toEqual(["nuts"]);
    expect(allergensOf("Pez - espada a la plancha")).toEqual(["fish"]);
  });

  it("siempre propone «contiene» (nunca «no contiene»), sin repetir alérgenos y en orden", () => {
    const result = suggestAllergens("Pan con queso, nata y más pan de trigo");
    expect(result).toEqual([
      { allergen: "gluten", level: "contains" },
      { allergen: "milk", level: "contains" },
    ]);
  });

  it("cada palabra del diccionario propone su alérgeno", () => {
    for (const [allergen, words] of Object.entries(ALLERGEN_KEYWORDS)) {
      for (const word of words) {
        expect(allergensOf(`Plato con ${word.toUpperCase()}.`), word).toContain(allergen);
      }
    }
  });

  it("un texto vacío no propone nada", () => {
    expect(suggestAllergens("")).toEqual([]);
  });

  it("el diccionario cubre los 14 alérgenos con palabras en minúsculas y sin tildes", () => {
    expect(Object.keys(ALLERGEN_KEYWORDS).sort()).toEqual([...ALLERGENS].sort());
    for (const words of Object.values(ALLERGEN_KEYWORDS)) {
      expect(words.length).toBeGreaterThan(0);
      for (const word of words) {
        expect(word).toBe(
          word
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase(),
        );
      }
    }
  });
});

describe("mergeSuggestions", () => {
  it("une las listas; si coinciden, gana «contiene»", () => {
    expect(
      mergeSuggestions(
        [{ allergen: "milk", level: "may_contain" }],
        [{ allergen: "milk", level: "contains" }],
      ),
    ).toEqual([{ allergen: "milk", level: "contains" }]);
    expect(
      mergeSuggestions(
        [{ allergen: "milk", level: "contains" }],
        [{ allergen: "milk", level: "may_contain" }],
      ),
    ).toEqual([{ allergen: "milk", level: "contains" }]);
  });

  it("conserva «puede contener» si nadie dice «contiene»", () => {
    expect(mergeSuggestions([{ allergen: "nuts", level: "may_contain" }], [])).toEqual([
      { allergen: "nuts", level: "may_contain" },
    ]);
  });

  it("ordena el resultado como la lista oficial de alérgenos", () => {
    expect(
      mergeSuggestions(
        [{ allergen: "molluscs", level: "contains" }],
        [
          { allergen: "gluten", level: "may_contain" },
          { allergen: "milk", level: "contains" },
        ],
      ).map((s) => s.allergen),
    ).toEqual(["gluten", "milk", "molluscs"]);
  });

  it("sin listas, ninguna propuesta", () => {
    expect(mergeSuggestions()).toEqual([]);
  });
});
