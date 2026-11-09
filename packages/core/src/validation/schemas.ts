import { z } from "zod";
import { ALLERGENS } from "../allergens/allergens";
import { ALLERGEN_LEVELS } from "../allergens/levels";
import type { ValidationErrorCode } from "./messages";
import { parsePriceToCents } from "./price";
import { isValidSlug } from "./slug";

// Los mensajes de error son códigos (ValidationErrorCode); el texto visible está
// en VALIDATION_MESSAGES. Los límites coinciden con los CHECK de la base de datos.

const error = (code: ValidationErrorCode) => ({ error: code });

const requiredText = (max: number) =>
  z.string(error("required")).trim().min(1, error("required")).max(max, error("too_long"));

/** Texto opcional: vacío o ausente se guarda como null. */
const optionalText = (max: number) =>
  z
    .string(error("invalid_value"))
    .trim()
    .max(max, error("too_long"))
    .optional()
    .transform((value) => (value === undefined || value === "" ? null : value));

const PHONE_PATTERN = /^[+0-9 ()-]{6,30}$/;

export const restaurantSchema = z.object({
  name: requiredText(120),
  slug: z.string(error("invalid_slug")).trim().refine(isValidSlug, error("invalid_slug")),
  city: requiredText(100),
  address: optionalText(200),
  phone: optionalText(30).refine(
    (value) => value === null || PHONE_PATTERN.test(value),
    error("invalid_phone"),
  ),
  contact_email: optionalText(254).refine(
    (value) => value === null || z.email().safeParse(value).success,
    error("invalid_email"),
  ),
});

export type RestaurantInput = z.input<typeof restaurantSchema>;
export type RestaurantData = z.output<typeof restaurantSchema>;

export const dishSchema = z
  .object({
    name: requiredText(120),
    description: optionalText(1000),
    /** Precio tal como lo escribe el usuario ("9,50"); vacío = sin precio. */
    price: z
      .string(error("invalid_price"))
      .optional()
      .transform((value, ctx) => {
        if (value === undefined || value.trim() === "") return null;
        const cents = parsePriceToCents(value);
        if (cents === null) {
          ctx.issues.push({ code: "custom", message: "invalid_price", input: value });
          return z.NEVER;
        }
        return cents;
      }),
    category: optionalText(60),
    ingredients: optionalText(2000),
    is_active: z.boolean(error("invalid_value")),
  })
  .transform(({ price, ...rest }) => ({ ...rest, price_cents: price }));

export type DishInput = z.input<typeof dishSchema>;
export type DishData = z.output<typeof dishSchema>;

export const dishAllergensSchema = z
  .array(
    z.object({
      allergen: z.enum(ALLERGENS, error("invalid_value")),
      level: z.enum(ALLERGEN_LEVELS, error("invalid_value")),
    }),
  )
  .refine(
    (declarations) => new Set(declarations.map((d) => d.allergen)).size === declarations.length,
    error("duplicate_allergen"),
  );

/** Solicitud de alta de un restaurante ("Pide este restaurante"). Límites de la BD. */
export const restaurantRequestSchema = z.object({
  restaurant_name: requiredText(120),
  city: requiredText(100),
});

export type RestaurantRequestData = z.output<typeof restaurantRequestSchema>;
