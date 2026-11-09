// Textos de la web en español. Para añadir un idioma: crear otro archivo con el
// mismo tipo (Messages) y elegirlo en getMessages().
// Los textos del filtro, los alérgenos y los errores de validación viven en
// @safebite/core porque los comparten web y móvil.

export const es = {
  common: {
    appName: "SafeBite",
    forRestaurants: "para restaurantes",
    sourceNotice: "Información declarada por el establecimiento.",
    genericError: "Ha ocurrido un error inesperado. Inténtalo de nuevo en unos minutos.",
    tooManyAttempts: "Demasiados intentos. Espera unos minutos antes de volver a probar.",
    loading: "Cargando…",
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
  auth: {
    email: "Email",
    password: "Contraseña",
    passwordHint: "Al menos 8 caracteres.",
    login: {
      title: "Entrar en el panel",
      submit: "Entrar",
      pending: "Entrando…",
      forgot: "¿Has olvidado tu contraseña?",
      noAccount: "¿Aún no tienes cuenta?",
      register: "Crea una cuenta de restaurante",
      invalidCredentials: "Email o contraseña incorrectos.",
      emailNotConfirmed:
        "Aún no has confirmado tu email. Revisa tu bandeja de entrada (y la carpeta de spam).",
      invalidLink: "El enlace no es válido o ha caducado. Inicia sesión o pide uno nuevo.",
      passwordUpdated: "Contraseña actualizada.",
    },
    register: {
      title: "Crear cuenta de restaurante",
      description:
        "Con tu cuenta podrás publicar la carta de tu establecimiento con la información de alérgenos de cada plato.",
      acceptTermsBefore: "He leído y acepto los",
      terms: "términos de uso",
      acceptTermsMiddle: "y la",
      privacy: "política de privacidad",
      acceptTermsAfter:
        ". Entiendo que soy responsable de la información de alérgenos que declare.",
      submit: "Crear cuenta",
      pending: "Creando cuenta…",
      hasAccount: "¿Ya tienes cuenta?",
      login: "Entra",
      checkEmail:
        "Te hemos enviado un email para confirmar tu cuenta. Abre el enlace del mensaje para empezar.",
      couldNotRegister:
        "No se ha podido crear la cuenta. Si ya tienes una con este email, entra o recupera tu contraseña.",
    },
    forgot: {
      title: "Recuperar contraseña",
      description: "Te enviaremos un enlace para elegir una contraseña nueva.",
      submit: "Enviar enlace",
      pending: "Enviando…",
      sent: "Si existe una cuenta con ese email, recibirás un mensaje con un enlace en unos minutos.",
      back: "Volver a entrar",
    },
    newPassword: {
      title: "Elige una contraseña nueva",
      password: "Contraseña nueva",
      confirmation: "Repite la contraseña",
      submit: "Guardar contraseña",
      pending: "Guardando…",
      expired: "El enlace ha caducado. Pide uno nuevo desde «¿Has olvidado tu contraseña?».",
      samePassword: "La contraseña nueva debe ser distinta de la anterior.",
    },
    logout: "Cerrar sesión",
  },
  legal: {
    draftNotice:
      "Borrador pendiente de revisión legal. Este texto se sustituirá por la versión definitiva antes del lanzamiento.",
    back: "Volver",
  },
  panel: {
    title: "Mis restaurantes",
    empty: "Aún no tienes ningún restaurante.",
  },
};

export type Messages = typeof es;
