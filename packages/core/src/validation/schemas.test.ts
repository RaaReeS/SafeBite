import { describe, expect, it } from "vitest";
import { ALLERGENS } from "../allergens/allergens";
import { VALIDATION_ERROR_CODES, VALIDATION_MESSAGES, type ValidationErrorCode } from "./messages";
import {
  dishAllergensSchema,
  dishSchema,
  restaurantRequestSchema,
  restaurantSchema,
} from "./schemas";

type SafeParseResult = {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
};

/** Devuelve { campo: código } de los errores, o null si es válido. */
function errorsOf(result: SafeParseResult): Record<string, string> | null {
  if (result.success) return null;
  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]),
  );
}

const validRestaurant = {
  name: "La Huerta",
  slug: "la-huerta",
  city: "Madrid",
  address: "Calle Mayor 1",
  phone: "+34 600 000 000",
  contact_email: "hola@lahuerta.es",
};

describe("restaurantSchema", () => {
  it("acepta un restaurante válido y recorta espacios", () => {
    const result = restaurantSchema.parse({ ...validRestaurant, name: "  La Huerta  " });
    expect(result.name).toBe("La Huerta");
  });

  it("convierte los campos opcionales vacíos en null", () => {
    const result = restaurantSchema.parse({
      name: "La Huerta",
      slug: "la-huerta",
      city: "Madrid",
      address: "",
      phone: "  ",
      contact_email: undefined,
    });
    expect(result).toEqual({
      name: "La Huerta",
      slug: "la-huerta",
      city: "Madrid",
      address: null,
      phone: null,
      contact_email: null,
    });
  });

  it.each<[string, Record<string, unknown>, Record<string, ValidationErrorCode>]>([
    ["nombre vacío", { name: "   " }, { name: "required" }],
    ["nombre largo", { name: "a".repeat(121) }, { name: "too_long" }],
    ["ciudad vacía", { city: "" }, { city: "required" }],
    ["slug inválido", { slug: "La Huerta" }, { slug: "invalid_slug" }],
    ["email inválido", { contact_email: "no-es-un-email" }, { contact_email: "invalid_email" }],
    ["teléfono con letras", { phone: "llámanos" }, { phone: "invalid_phone" }],
    ["dirección larga", { address: "a".repeat(201) }, { address: "too_long" }],
  ])("rechaza: %s", (_, override, expected) => {
    expect(errorsOf(restaurantSchema.safeParse({ ...validRestaurant, ...override }))).toEqual(
      expected,
    );
  });

  it("los límites coinciden con la base de datos (120 caracteres en el nombre)", () => {
    expect(restaurantSchema.safeParse({ ...validRestaurant, name: "a".repeat(120) }).success).toBe(
      true,
    );
  });
});

const validDish = {
  name: "Ensalada",
  description: "Lechuga y tomate",
  price: "9,50",
  category: "Entrantes",
  ingredients: "Lechuga, tomate",
  is_active: true,
};

describe("dishSchema", () => {
  it("convierte el precio a céntimos", () => {
    expect(dishSchema.parse(validDish)).toEqual({
      name: "Ensalada",
      description: "Lechuga y tomate",
      price_cents: 950,
      category: "Entrantes",
      ingredients: "Lechuga, tomate",
      is_active: true,
    });
  });

  it("el precio y los textos opcionales pueden quedar vacíos (null)", () => {
    expect(
      dishSchema.parse({ name: "Croquetas", price: "", description: "", is_active: false }),
    ).toEqual({
      name: "Croquetas",
      description: null,
      price_cents: null,
      category: null,
      ingredients: null,
      is_active: false,
    });
  });

  it.each<[string, Record<string, unknown>, Record<string, ValidationErrorCode>]>([
    ["nombre vacío", { name: "" }, { name: "required" }],
    ["precio inválido", { price: "nueve euros" }, { price: "invalid_price" }],
    ["precio negativo", { price: "-1" }, { price: "invalid_price" }],
    ["ingredientes largos", { ingredients: "a".repeat(2001) }, { ingredients: "too_long" }],
    ["categoría larga", { category: "a".repeat(61) }, { category: "too_long" }],
  ])("rechaza: %s", (_, override, expected) => {
    expect(errorsOf(dishSchema.safeParse({ ...validDish, ...override }))).toEqual(expected);
  });
});

describe("dishAllergensSchema", () => {
  it("acepta declaraciones válidas, incluida la lista vacía", () => {
    expect(dishAllergensSchema.safeParse([]).success).toBe(true);
    expect(
      dishAllergensSchema.safeParse(ALLERGENS.map((allergen) => ({ allergen, level: "free_from" })))
        .success,
    ).toBe(true);
  });

  it("rechaza un alérgeno declarado dos veces", () => {
    const result = dishAllergensSchema.safeParse([
      { allergen: "gluten", level: "contains" },
      { allergen: "gluten", level: "free_from" },
    ]);
    expect(errorsOf(result)).toEqual({ "": "duplicate_allergen" });
  });

  it.each([
    [{ allergen: "lactose", level: "contains" }],
    [{ allergen: "gluten", level: "none" }],
    [{ allergen: "gluten" }],
  ])("rechaza declaraciones inválidas: %j", (declaration) => {
    expect(dishAllergensSchema.safeParse([declaration]).success).toBe(false);
  });
});

describe("VALIDATION_MESSAGES", () => {
  it("tiene un texto en español no vacío para cada código de error", () => {
    for (const code of VALIDATION_ERROR_CODES) {
      expect(VALIDATION_MESSAGES.es[code].trim()).not.toBe("");
    }
  });
});

describe("restaurantRequestSchema", () => {
  it("acepta una solicitud válida y recorta espacios", () => {
    expect(
      restaurantRequestSchema.parse({ restaurant_name: "  Bar Pepe ", city: " Madrid " }),
    ).toEqual({ restaurant_name: "Bar Pepe", city: "Madrid" });
  });

  it.each<[string, Record<string, unknown>, Record<string, ValidationErrorCode>]>([
    ["nombre vacío", { restaurant_name: "  ", city: "Madrid" }, { restaurant_name: "required" }],
    ["ciudad vacía", { restaurant_name: "Bar Pepe", city: "" }, { city: "required" }],
    [
      "nombre largo",
      { restaurant_name: "a".repeat(121), city: "Madrid" },
      { restaurant_name: "too_long" },
    ],
    ["ciudad larga", { restaurant_name: "Bar Pepe", city: "a".repeat(101) }, { city: "too_long" }],
  ])("rechaza: %s", (_, input, expected) => {
    expect(errorsOf(restaurantRequestSchema.safeParse(input))).toEqual(expected);
  });
});
