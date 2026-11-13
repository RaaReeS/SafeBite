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
      alreadyRegistered:
        "Esta cuenta ya está registrada. Inicia sesión o recupera tu contraseña si no la recuerdas.",
      goToLogin: "Iniciar sesión",
      goToForgot: "Recuperar contraseña",
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
    allergiesTitle: "Mis alergias",
    noConsent: "Aún no has configurado tus alergias.",
    configure: "Configurar mis alergias",
    noAllergies: "No has marcado ninguna alergia.",
    yourAllergies: (list: string) => `Tus alergias: ${list}.`,
    edit: "Editar mis alergias",
    account: "Mi cuenta",
    loadError: "No se ha podido cargar tu perfil.",
    retry: "Reintentar",
  },
  search: {
    title: "Buscar restaurantes",
    open: "Buscar restaurantes",
    city: "Ciudad",
    submit: "Buscar",
    nearMe: "Cerca de mí",
    locating: "Buscando tu ubicación…",
    privacy:
      "Tu ubicación solo se usa en el móvil para ordenar por cercanía: no se guarda ni se envía.",
    results: (n: number) => (n === 1 ? "1 restaurante" : `${n} restaurantes`),
    allRestaurants: (n: number) =>
      n === 1 ? "1 restaurante en SafeBite" : `Todos los restaurantes (${n})`,
    showAll: "Ver todos los restaurantes",
    sortByProximity: "Ordenar por cercanía",
    byProximity: "de más cerca a más lejos",
    noRestaurants: "Todavía no hay restaurantes publicados.",
    noResultsCity: (city: string) => `No hemos encontrado restaurantes en «${city}».`,
    noResultsNear: (km: number) => `No hay restaurantes a menos de ${km} km.`,
    denied:
      "Sin permiso de ubicación no podemos ordenar por cercanía. Puedes buscar por ciudad o activarlo en Ajustes.",
    openSettings: "Abrir Ajustes",
    unavailable: "No se ha podido obtener tu ubicación. Inténtalo de nuevo o busca por ciudad.",
    error: "No se ha podido completar la búsqueda. Revisa tu conexión e inténtalo de nuevo.",
    missing: "¿Echas en falta un restaurante?",
    request: "Pide que se dé de alta",
    views: { list: "Lista", map: "Mapa" },
    viewsLabel: "Ver como",
    mapLabel: "Mapa de restaurantes",
    noLocationOnMap: (n: number) =>
      n === 1
        ? "1 restaurante no tiene ubicación y solo sale en la lista."
        : `${n} restaurantes no tienen ubicación y solo salen en la lista.`,
    openMenu: "Ver la carta",
    noProfile: "Guarda tus alergias para ver dónde puedes comer.",
    configureProfile: "Configurar mis alergias",
    canEatIn: (n: number, total: number) =>
      n === 1
        ? `Puedes comer en 1 de ${total} restaurantes, según lo declarado.`
        : `Puedes comer en ${n} de ${total} restaurantes, según lo declarado.`,
    showOthers: "Mostrar también los demás restaurantes",
    declaredNotice:
      "Se muestran los restaurantes con al menos un plato apto para tus alergias según la información declarada por el establecimiento. Confirma siempre con el establecimiento.",
    suitableDishes: (n: number) =>
      n === 1 ? "1 plato apto según lo declarado" : `${n} platos aptos según lo declarado`,
    statuses: {
      apto: "Con platos aptos",
      posibles_trazas: "Solo platos con posibles trazas",
      sin_datos: "Sin datos suficientes",
      no_apto: "Ningún plato apto",
    },
    noneSuitable:
      "Ningún restaurante de esta búsqueda tiene platos aptos para tus alergias según lo declarado. Activa «Mostrar también los demás restaurantes» para verlos todos.",
    suitabilityError:
      "No se ha podido comprobar dónde puedes comer. Se muestran todos los restaurantes.",
  },
  menu: {
    title: "Carta",
    notFound: "Esta carta no existe o el establecimiento la ha retirado.",
    loadError: "No se ha podido cargar la carta. Revisa tu conexión e inténtalo de nuevo.",
    call: (phone: string) => `Llamar al ${phone}`,
    empty: "Esta carta aún no tiene platos.",
    uncategorized: "Otros platos",
    usingProfile: "Filtrada con tu perfil de alergias.",
    adjusted: "Ajustada solo para esta carta: tu perfil guardado no cambia.",
    adjust: "Ajustar alergias para esta carta",
    hideAdjust: "Ocultar ajustes",
    resetToProfile: "Volver a mi perfil",
    configureProfile: "Configurar mis alergias",
    hideNotSuitable: "Ocultar platos no aptos",
    summary: (c: { apto: number; posibles_trazas: number; sin_datos: number; no_apto: number }) =>
      `${c.apto} ${c.apto === 1 ? "apto" : "aptos"} · ${c.posibles_trazas} con posibles trazas · ${c.sin_datos} sin datos suficientes · ${c.no_apto} no ${c.no_apto === 1 ? "apto" : "aptos"}`,
    hiddenCount: (n: number) =>
      n === 1 ? "1 plato no apto oculto." : `${n} platos no aptos ocultos.`,
    reasonContains: "Contiene:",
    reasonTraces: "Puede contener trazas de:",
    reasonMissing: "Sin datos sobre:",
    otherDeclared: "Otros alérgenos declarados:",
    declaredContains: "Contiene:",
    declaredTraces: "Puede contener trazas de:",
    noDeclarations: "El establecimiento no ha declarado los alérgenos de este plato.",
    undeclared: (n: number) =>
      n === 1 ? "1 alérgeno sin declarar" : `${n} alérgenos sin declarar`,
    ingredients: "Ingredientes:",
  },
  scanner: {
    open: "Escanear producto",
    title: "Escanear producto",
    instructions: "Apunta al código de barras del envase.",
    cameraLabel: "Cámara para leer el código de barras",
    permissionTitle: "Permiso de cámara",
    permissionText:
      "SafeBite usa la cámara solo para leer códigos de barras. No se guarda ninguna imagen.",
    allowCamera: "Permitir la cámara",
    permissionDenied:
      "Sin permiso de cámara no podemos leer el código. Puedes escribirlo a mano o activarlo en Ajustes.",
    openSettings: "Abrir Ajustes",
    manualTitle: "O escribe el número",
    manualLabel: "Código de barras",
    manualHint: "Los números que aparecen debajo de las barras (8, 12, 13 o 14 cifras).",
    manualSubmit: "Buscar producto",
    invalidCode: "Revisa el número: no es un código de barras válido.",
    history: "Historial de productos",
    unnamed: "Producto sin nombre",
  },
  history: {
    title: "Historial",
    empty: "Aún no has escaneado ningún producto.",
    noProfile: "Configura tus alergias para ver aquí si puedes tomar cada producto.",
    note: "El historial se guarda solo en este móvil. El resultado se calcula con tus alergias actuales y los datos de Open Food Facts del momento en que lo escaneaste: abre el producto para actualizarlo.",
    clear: "Borrar historial",
    clearTitle: "¿Borrar el historial?",
    clearMessage:
      "Se borrará la lista de productos escaneados de este móvil. No se puede deshacer.",
    clearConfirm: "Borrar",
    cancel: "Cancelar",
    cleared: "Historial borrado.",
  },
  product: {
    title: "Producto",
    loading: "Buscando el producto…",
    notFound:
      "No hemos encontrado este producto en Open Food Facts. Revisa la etiqueta del envase.",
    addToOff: "Añadir este producto a Open Food Facts",
    addToOffHint:
      "Open Food Facts es una base de datos libre y colaborativa: cualquiera puede añadir productos.",
    unavailable: "Open Food Facts no responde ahora mismo. Inténtalo de nuevo en unos minutos.",
    networkError: "No hay conexión. Revisa tu conexión a internet e inténtalo de nuevo.",
    invalid: "No hemos podido leer los datos de este producto. Revisa la etiqueta del envase.",
    retry: "Reintentar",
    scanAnother: "Escanear otro producto",
    code: (code: string) => `Código: ${code}`,
    unnamed: "Producto sin nombre",
    statusDescription: {
      no_apto: "Según Open Food Facts, contiene alérgenos de tu perfil.",
      posibles_trazas: "Según Open Food Facts, puede contener trazas de alérgenos de tu perfil.",
      sin_datos:
        "Open Food Facts no tiene información suficiente sobre alguno de los alérgenos de tu perfil.",
      apto: "Según Open Food Facts, la lista de ingredientes está completa y no contiene ninguno de los alérgenos de tu perfil.",
    },
    reasonContains: "Contiene:",
    reasonTraces: "Puede contener trazas de:",
    reasonMissing: "Sin datos sobre:",
    noProfile: "Configura tus alergias para ver si este producto es apto para ti.",
    configureProfile: "Configurar mis alergias",
    ingredients: "Ingredientes:",
    source:
      "Información de Open Food Facts, una base de datos colaborativa. Puede estar incompleta o desactualizada: revisa siempre la etiqueta física.",
  },
  request: {
    title: "Pide un restaurante",
    description:
      "Cuéntanos qué restaurante te gustaría encontrar en SafeBite y le invitaremos a publicar su carta con la información de alérgenos.",
    name: "Nombre del restaurante",
    city: "Ciudad",
    submit: "Enviar solicitud",
    sent: "¡Gracias! Hemos recibido tu solicitud.",
    error: "No se ha podido enviar la solicitud. Inténtalo de nuevo.",
    tooMany: "Has enviado muchas solicitudes hoy. Vuelve a intentarlo mañana.",
  },
  consent: {
    title: "Tus datos de salud",
    intro:
      "Para filtrar las cartas según tus alergias, SafeBite necesita guardar tu perfil de alergias e intolerancias. Es un dato de salud, así que solo lo guardamos con tu consentimiento explícito.",
    points: [
      "Lo usamos únicamente para filtrar las cartas y los productos que consultes.",
      "Solo tú puedes verlo. Nunca se comparte con los restaurantes ni con nadie más.",
      "Se guarda en servidores de la Unión Europea.",
      "Puedes retirar tu consentimiento cuando quieras desde «Mi cuenta»: tus alergias se borrarán en ese momento.",
    ],
    checkbox:
      "Doy mi consentimiento explícito para que SafeBite guarde y use mi perfil de alergias e intolerancias con esta finalidad.",
    accept: "Continuar",
    privacy: "Leer la política de privacidad",
  },
  allergies: {
    title: "Mis alergias",
    description:
      "Marca los alérgenos que debes evitar. Las cartas se filtrarán automáticamente con esta selección.",
    save: "Guardar",
    saved: "Tu perfil de alergias se ha guardado.",
    saveError: "No se ha podido guardar. No se ha cambiado nada: inténtalo de nuevo.",
  },
  account: {
    title: "Mi cuenta",
    signedInAs: (email: string) => `Has iniciado sesión como ${email}.`,
    consentGiven: "Has dado tu consentimiento para guardar tu perfil de alergias.",
    consentNotGiven: "No tienes un perfil de alergias guardado.",
    withdraw: "Retirar consentimiento y borrar mis alergias",
    withdrawTitle: "¿Retirar el consentimiento?",
    withdrawMessage:
      "Se borrarán tus alergias guardadas. Las cartas dejarán de filtrarse automáticamente hasta que vuelvas a configurarlas.",
    withdrawConfirm: "Retirar y borrar",
    withdrawn: "Has retirado tu consentimiento y tus alergias se han borrado.",
    delete: "Borrar mi cuenta",
    deleteTitle: "¿Borrar tu cuenta?",
    deleteMessage:
      "Se borrarán tu cuenta, tu perfil de alergias y todos tus datos. No se puede deshacer.",
    deleteConfirm: "Borrar mi cuenta",
    cancel: "Cancelar",
    error: "No se ha podido completar la acción. Inténtalo de nuevo.",
  },
};

export type Messages = typeof es;
