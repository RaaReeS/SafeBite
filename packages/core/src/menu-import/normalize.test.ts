import { describe, expect, it } from "vitest";
import { DISH_LIMITS, normalizeImportedDish, parseMenuResponse } from "./normalize";

describe("parseMenuResponse", () => {
  it("lee los platos con sus datos y propone alérgenos (modelo + diccionario)", () => {
    const dishes = parseMenuResponse({
      dishes: [
        {
          name: "  Gambas al ajillo ",
          description: "Con guindilla",
          price: "12,50 €",
          category: "Entrantes",
          ingredients: null,
          allergens: [{ allergen: "molluscs", level: "may_contain" }],
        },
      ],
    });
    expect(dishes).toEqual([
      {
        name: "Gambas al ajillo",
        description: "Con guindilla",
        priceCents: 1250,
        category: "Entrantes",
        ingredients: null,
        suggestions: [
          { allergen: "crustaceans", level: "contains" },
          { allergen: "molluscs", level: "may_contain" },
        ],
      },
    ]);
  });

  it("descarta los platos sin nombre o con un nombre que no es texto", () => {
    expect(
      parseMenuResponse({
        dishes: [{ name: "" }, { name: "   " }, { name: 5 }, null, "Croquetas", { name: "Sopa" }],
      }).map((d) => d.name),
    ).toEqual(["Sopa"]);
  });

  it("descarta alérgenos desconocidos y nunca acepta «no contiene»", () => {
    const [dish] = parseMenuResponse({
      dishes: [
        {
          name: "Brownie",
          allergens: [
            { allergen: "chocolate", level: "contains" },
            { allergen: "eggs", level: "free_from" },
            { allergen: "nuts", level: "contains" },
            "milk",
            null,
            { allergen: "milk" },
            { level: "contains" },
          ],
        },
      ],
    });
    expect(dish?.suggestions).toEqual([{ allergen: "nuts", level: "contains" }]);
  });

  it("recorta los textos a los límites de la base de datos", () => {
    const [dish] = parseMenuResponse({
      dishes: [
        {
          name: "x".repeat(300),
          description: "d".repeat(2000),
          category: "c".repeat(100),
          ingredients: "i".repeat(5000),
        },
      ],
    });
    expect(DISH_LIMITS).toEqual({ name: 120, description: 1000, category: 60, ingredients: 2000 });
    expect(dish?.name).toHaveLength(120);
    expect(dish?.description).toHaveLength(1000);
    expect(dish?.category).toHaveLength(60);
    expect(dish?.ingredients).toHaveLength(2000);
  });

  it("los textos opcionales vacíos o que no son texto quedan en null", () => {
    const [dish] = parseMenuResponse({
      dishes: [{ name: "Sopa", description: "  ", category: 3, ingredients: [], price: "—" }],
    });
    expect(dish).toEqual({
      name: "Sopa",
      description: null,
      priceCents: null,
      category: null,
      ingredients: null,
      suggestions: [],
    });
  });

  it("el diccionario lee también la descripción y los ingredientes", () => {
    const [dish] = parseMenuResponse({
      dishes: [{ name: "Postre de la casa", description: "Con nata", ingredients: "huevo" }],
    });
    expect(dish?.suggestions.map((s) => s.allergen)).toEqual(["eggs", "milk"]);
  });

  it.each([[null], [undefined], ["texto"], [{}], [{ dishes: "no" }], [[]]])(
    "una respuesta sin lista de platos (%j) da []",
    (raw) => {
      expect(parseMenuResponse(raw)).toEqual([]);
    },
  );
});

describe("normalizeImportedDish", () => {
  it("valida un plato enviado desde el navegador", () => {
    expect(
      normalizeImportedDish({
        name: "Gambas",
        description: null,
        priceCents: 1250,
        category: "Entrantes",
        ingredients: null,
        suggestions: [
          { allergen: "crustaceans", level: "contains" },
          { allergen: "eggs", level: "free_from" },
        ],
      }),
    ).toEqual({
      name: "Gambas",
      description: null,
      priceCents: 1250,
      category: "Entrantes",
      ingredients: null,
      suggestions: [{ allergen: "crustaceans", level: "contains" }],
    });
  });

  it("no añade propuestas del diccionario (el dueño ya las revisó)", () => {
    expect(normalizeImportedDish({ name: "Pan con tomate" })?.suggestions).toEqual([]);
  });

  it.each([[-5], [12.5], [10_000_001], ["1250"]])(
    "un precio en céntimos inválido (%j) queda en null",
    (priceCents) => {
      expect(normalizeImportedDish({ name: "Sopa", priceCents })?.priceCents).toBeNull();
    },
  );

  it("acepta un plato gratis (0 céntimos)", () => {
    expect(normalizeImportedDish({ name: "Pan", priceCents: 0 })?.priceCents).toBe(0);
  });

  it("acepta el precio máximo", () => {
    expect(normalizeImportedDish({ name: "Sopa", priceCents: 10_000_000 })?.priceCents).toBe(
      10_000_000,
    );
  });

  it.each([[null], ["texto"], [5], [{}], [{ name: "" }], [{ name: 3 }]])(
    "una entrada inválida (%j) devuelve null",
    (input) => {
      expect(normalizeImportedDish(input)).toBeNull();
    },
  );

  it("propuestas que no son una lista se ignoran", () => {
    expect(normalizeImportedDish({ name: "Sopa", suggestions: "milk" })?.suggestions).toEqual([]);
  });
});
