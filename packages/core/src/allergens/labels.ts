import type { Allergen } from "./allergens";

export type Locale = "es";

/** Nombres visibles de cada alérgeno, por idioma. */
export const ALLERGEN_LABELS: Record<Locale, Record<Allergen, string>> = {
  es: {
    gluten: "Cereales con gluten",
    crustaceans: "Crustáceos",
    eggs: "Huevos",
    fish: "Pescado",
    peanuts: "Cacahuetes",
    soybeans: "Soja",
    milk: "Leche y lácteos",
    nuts: "Frutos de cáscara",
    celery: "Apio",
    mustard: "Mostaza",
    sesame: "Sésamo",
    sulphites: "Dióxido de azufre y sulfitos",
    lupin: "Altramuces",
    molluscs: "Moluscos",
  },
};
