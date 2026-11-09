// Textos de la app en español. Para añadir un idioma: crear otro archivo con el
// mismo tipo (Messages) y elegirlo en getMessages(). Los textos del filtro, los
// alérgenos y los errores de validación viven en @safebite/core.

export const es = {
  common: {
    appName: "SafeBite",
    tagline: "Guarda tus alergias una vez y consulta cartas filtradas para ti.",
    loading: "Cargando…",
    genericError: "Ha ocurrido un error inesperado. Inténtalo de nuevo en unos minutos.",
    tooManyAttempts: "Demasiados intentos. Espera un minuto antes de volver a probar.",
    network: "No hay conexión con el servidor. Revisa tu conexión a internet.",
  },
  welcome: {
    register: "Crear cuenta",
    login: "Ya tengo cuenta",
    disclaimer:
      "SafeBite muestra la información de alérgenos declarada por cada establecimiento. Confirma siempre con el establecimiento y revisa la etiqueta física.",
  },
  auth: {
    email: "Email",
    password: "Contraseña",
    passwordHint: "Al menos 8 caracteres.",
    register: {
      title: "Crear cuenta",
      acceptTerms: "He leído y acepto los términos de uso y la política de privacidad.",
      terms: "Leer los términos de uso",
      privacy: "Leer la política de privacidad",
      submit: "Crear cuenta",
      couldNotRegister:
        "No se ha podido crear la cuenta. Si ya tienes una con este email, inicia sesión o recupera tu contraseña.",
    },
    verify: {
      title: "Confirma tu email",
      description: (email: string) =>
        `Te hemos enviado un email a ${email} con un código. Escríbelo aquí para activar tu cuenta.`,
      code: "Código",
      submit: "Confirmar",
      invalid: "El código no es válido o ha caducado. Pide uno nuevo si hace falta.",
      resend: "Reenviar el código",
      resent: "Si la cuenta existe y aún no está confirmada, te hemos enviado un código nuevo.",
      notConfirmed:
        "Aún no has confirmado tu email. Escribe el código que te enviamos o pide uno nuevo.",
    },
    login: {
      title: "Iniciar sesión",
      submit: "Entrar",
      invalidCredentials: "Email o contraseña incorrectos.",
      forgot: "¿Has olvidado tu contraseña?",
      noAccount: "Crear una cuenta",
    },
    forgot: {
      title: "Recuperar contraseña",
      description: "Te enviaremos un código para elegir una contraseña nueva.",
      submit: "Enviar código",
    },
    newPassword: {
      title: "Contraseña nueva",
      description: (email: string) =>
        `Si existe una cuenta con ${email}, te hemos enviado un código. Escríbelo junto a tu contraseña nueva.`,
      password: "Contraseña nueva",
      confirmation: "Repite la contraseña",
      submit: "Guardar contraseña",
      samePassword: "La contraseña nueva debe ser distinta de la anterior.",
    },
    logout: "Cerrar sesión",
  },
  home: {
    greeting: (email: string) => `Hola, ${email}`,
    comingSoon: "Aquí podrás configurar tus alergias y buscar restaurantes.",
  },
};

export type Messages = typeof es;
