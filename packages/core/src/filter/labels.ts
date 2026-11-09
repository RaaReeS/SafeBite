import type { Locale } from "../allergens/labels";
import type { FilterStatus } from "./status";

export type FilterStatusLabel = {
  /** Etiqueta breve para la tarjeta del plato. */
  short: string;
  /** Explicación del estado. */
  description: string;
};

// Lenguaje responsable (regla crítica 5): nunca "garantizado", "seguro" ni
// "100 %". El test de labels.test.ts lo comprueba.
export const FILTER_STATUS_LABELS: Record<Locale, Record<FilterStatus, FilterStatusLabel>> = {
  es: {
    no_apto: {
      short: "No apto",
      description: "Según lo declarado por el establecimiento, contiene alérgenos de tu perfil.",
    },
    posibles_trazas: {
      short: "Puede contener trazas",
      description:
        "Según lo declarado por el establecimiento, puede contener trazas de alérgenos de tu perfil.",
    },
    sin_datos: {
      short: "Sin datos suficientes",
      description:
        "El establecimiento no ha declarado información sobre alguno de los alérgenos de tu perfil.",
    },
    apto: {
      short: "Apto según lo declarado",
      description:
        "El establecimiento declara que no contiene ninguno de los alérgenos de tu perfil.",
    },
  },
};

/** Aviso obligatorio que acompaña siempre a los resultados del filtro. */
export const FILTER_DISCLAIMER: Record<Locale, string> = {
  es: "Confirma siempre con el establecimiento y revisa la etiqueta física.",
};

/** Origen de la información mostrada. */
export const FILTER_SOURCE_NOTICE: Record<Locale, string> = {
  es: "Información declarada por el establecimiento.",
};

/** Mensaje cuando el usuario no tiene alergias seleccionadas (no se muestran etiquetas). */
export const FILTER_EMPTY_PROFILE_HINT: Record<Locale, string> = {
  es: "Selecciona tus alergias para filtrar la carta.",
};
