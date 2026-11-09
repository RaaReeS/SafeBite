// Textos de la web en español. Para añadir un idioma: crear otro archivo con el
// mismo tipo (Messages) y elegirlo en getMessages().
// Los textos del filtro, los alérgenos y los errores de validación viven en
// @safebite/core porque los comparten web y móvil.

export const es = {
  common: {
    appName: "SafeBite",
    forRestaurants: "para restaurantes",
    sourceNotice: "Información declarada por el establecimiento.",
  },
  home: {
    title: "Tu carta con información de alérgenos, clara y siempre actualizada",
    description:
      "Declara los alérgenos de cada plato y comparte tu carta con un código QR. Tus clientes con alergias o intolerancias podrán filtrarla según su perfil.",
    login: "Entrar",
    register: "Crear cuenta de restaurante",
  },
  noAccess: {
    title: "Esta cuenta no es de restaurante",
    description:
      "El panel es solo para establecimientos. Si eres comensal, usa la app de SafeBite para consultar cartas filtradas por tus alergias.",
    back: "Volver al inicio",
  },
};

export type Messages = typeof es;
