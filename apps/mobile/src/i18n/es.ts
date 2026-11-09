// Textos de la app en español. Para añadir un idioma: crear otro archivo con el
// mismo tipo (Messages) y elegirlo en getMessages(). Los textos del filtro, los
// alérgenos y los errores de validación viven en @safebite/core.

export const es = {
  common: {
    appName: "SafeBite",
    tagline: "Come fuera con más tranquilidad",
    loading: "Cargando…",
    genericError: "Ha ocurrido un error inesperado. Inténtalo de nuevo en unos minutos.",
  },
  home: {
    title: "SafeBite",
    description:
      "Guarda tus alergias una vez y consulta las cartas de los restaurantes filtradas para ti.",
  },
};

export type Messages = typeof es;
