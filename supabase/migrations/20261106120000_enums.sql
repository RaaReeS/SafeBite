-- Enums del dominio.
--
-- `allergen` debe coincidir exactamente (valores y orden) con ALLERGENS en
-- packages/core/src/allergens/allergens.ts. Un test de core lo comprueba.

-- Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011, anexo II).
create type public.allergen as enum (
  'gluten',
  'crustaceans',
  'eggs',
  'fish',
  'peanuts',
  'soybeans',
  'milk',
  'nuts',
  'celery',
  'mustard',
  'sesame',
  'sulphites',
  'lupin',
  'molluscs'
);

-- Nivel declarado por el restaurante para un alérgeno en un plato.
-- Si no hay fila en dish_allergens para un alérgeno, se considera "sin datos".
create type public.allergen_level as enum (
  'contains',     -- contiene
  'may_contain',  -- puede contener trazas
  'free_from'     -- no contiene
);

create type public.user_role as enum (
  'diner',
  'restaurant_owner',
  'admin'
);
