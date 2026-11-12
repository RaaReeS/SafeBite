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
      resend: "Reenviar el email de confirmación",
      resending: "Enviando…",
      resent:
        "Si la cuenta existe y aún no está confirmada, te hemos enviado un email nuevo. Revisa también la carpeta de spam.",
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
      alreadyRegistered:
        "Esta cuenta ya está registrada. Entra con tu contraseña o recupérala si no la recuerdas.",
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
  admin: {
    label: "Administración",
    nav: { requests: "Solicitudes", restaurants: "Verificación de restaurantes" },
    twoFactor: {
      title: "Verificación en dos pasos",
      why: "La cuenta de administración decide qué cartas ven las personas con alergias, así que además de la contraseña pide un código de tu móvil.",
      enrollIntro:
        "Necesitas una app de autenticación en el móvil (Google Authenticator, Microsoft Authenticator, 1Password…). Solo se configura una vez.",
      startEnroll: "Configurar la verificación en dos pasos",
      step1: "Abre tu app de autenticación y añade una cuenta nueva.",
      step2: "Escanea este código QR (o escribe la clave a mano).",
      step3: "Escribe el código de 6 cifras que te muestre la app.",
      qrAlt: "Código QR para añadir SafeBite a tu app de autenticación",
      manualKey: "Clave para escribirla a mano:",
      codeFormLabel: "Código de verificación",
      codeLabel: "Código de 6 cifras",
      codeHint: "El que muestra ahora tu app de autenticación. Cambia cada 30 segundos.",
      verify: "Verificar",
      invalidFormat: "Escribe el código de 6 cifras de tu app de autenticación.",
      wrongCode: "El código no es correcto o ha caducado. Prueba con el código actual.",
      enrollError: "No se ha podido configurar la verificación en dos pasos. Inténtalo de nuevo.",
      noFactor: "No hay ninguna app de autenticación configurada. Recarga la página.",
      loadError: "No se ha podido comprobar tu verificación en dos pasos. Recarga la página.",
      lostDevice:
        "¿Has perdido el móvil? El responsable técnico puede borrar tu autenticador desde el panel de Supabase (Authentication → Users) para que vuelvas a configurarlo.",
    },
    navLabel: "Secciones de administración",
    restaurants: {
      title: "Verificación de restaurantes",
      description:
        "Comprueba que cada restaurante lo ha registrado su dueño antes de que su carta sea visible. Por ejemplo: llama al teléfono público del local (el de Google Maps, no el de la ficha) y confirma que han creado la cuenta.",
      filterLabel: "Filtrar por estado",
      filters: {
        pendientes: "Pendientes",
        rechazados: "Rechazados",
        verificados: "Verificados",
        todos: "Todos",
      },
      empty: {
        pendientes: "No hay restaurantes pendientes de verificar.",
        rechazados: "No hay restaurantes rechazados.",
        verificados: "Aún no has verificado ningún restaurante.",
        todos: "Todavía no hay restaurantes.",
      },
      city: "Ciudad",
      address: "Dirección",
      phone: "Teléfono",
      contactEmail: "Email de contacto",
      ownerEmail: "Email de la cuenta",
      createdAt: "Registrado el",
      rejectedReason: "Motivo del rechazo:",
      verify: "Verificar",
      reject: "Rechazar",
      backToPending: "Volver a pendiente",
      rejectFormLabel: (name: string) => `Rechazar ${name}`,
      noteLabel: "Motivo del rechazo",
      noteHint: "El dueño lo verá en su panel.",
      noteRequired: "Escribe el motivo: el dueño lo verá en su panel.",
      noteTooLong: (max: number) => `El motivo puede tener como mucho ${max} caracteres.`,
    },
    requests: {
      title: "Solicitudes de restaurantes",
      description:
        "Restaurantes que los comensales han pedido desde la app, agrupados por nombre y ciudad. No se muestra quién los pidió.",
      filterLabel: "Filtrar por estado",
      filters: { pendientes: "Pendientes", anadidos: "Añadidos", todas: "Todas" },
      empty: {
        pendientes: "No hay solicitudes pendientes.",
        anadidos: "Aún no has marcado ningún restaurante como añadido.",
        todas: "Todavía no hay solicitudes.",
      },
      columns: {
        restaurant: "Restaurante",
        city: "Ciudad",
        count: "Peticiones",
        last: "Última petición",
        status: "Estado",
        action: "Acción",
      },
      statuses: { pending: "Pendiente", added: "Añadido" },
      newSinceAdded: (n: number) => (n === 1 ? "1 nueva" : `${n} nuevas`),
      markAdded: "Marcar como añadido",
      markPending: "Volver a pendiente",
    },
  },
  panel: {
    title: "Mis restaurantes",
    empty: "Aún no tienes ningún restaurante.",
    newRestaurant: "Nuevo restaurante",
    backToList: "← Mis restaurantes",
    published: "Publicado",
    draft: "Borrador",
  },
  verification: {
    badge: { pending: "Pendiente de verificación", verified: "Verificado", rejected: "Rechazado" },
    pendingTitle: "Pendiente de verificación",
    pending:
      "Para proteger a las personas con alergias, el equipo de SafeBite comprueba que cada restaurante lo gestiona su dueño. Tu carta no será visible para los clientes hasta entonces. Te contactaremos en el teléfono del establecimiento o en el email de tu cuenta.",
    rejectedTitle: "No hemos podido verificar este restaurante",
    rejectedReason: "Motivo:",
    rejectedHelp:
      "Si crees que es un error, corrige los datos del establecimiento (al cambiar el nombre, la ciudad o la dirección se revisará de nuevo) o escríbenos.",
    identityChangeWarning:
      "Si cambias el nombre, la ciudad o la dirección, tendremos que verificar el restaurante de nuevo y la carta dejará de verse mientras tanto.",
    notVisibleYet:
      "Tu carta aún no es visible para los clientes: está pendiente de verificación por el equipo de SafeBite.",
  },
  restaurant: {
    newTitle: "Nuevo restaurante",
    name: "Nombre del establecimiento",
    slug: "Dirección de la carta",
    slugHint: "Tu carta estará en",
    city: "Ciudad",
    address: "Dirección",
    phone: "Teléfono",
    contactEmail: "Email de contacto",
    optional: "(opcional)",
    create: "Crear restaurante",
    creating: "Creando…",
    save: "Guardar cambios",
    saving: "Guardando…",
    saved: "Cambios guardados.",
    slugTaken: "Esa dirección ya la usa otro establecimiento. Elige otra.",
    termsRequired:
      "Tu cuenta no tiene registrada la aceptación de los términos de uso, necesaria para publicar restaurantes.",
    slugChangeWarning:
      "Tu carta ya está publicada. Si cambias la dirección, los códigos QR que ya hayas impreso dejarán de funcionar.",
    slugChangeConfirm: "Entiendo que los QR impresos dejarán de funcionar",
    slugChangeRequired: "Confirma que entiendes que los QR impresos dejarán de funcionar.",
    details: "Datos del establecimiento",
    publication: "Publicación",
    location: "Ubicación",
    locationFound:
      "Hemos ubicado tu dirección en el mapa: los clientes podrán encontrarte con «Cerca de mí» en la app.",
    locationCheck: "Comprobar en el mapa",
    locationNotFound:
      "No hemos podido ubicar esta dirección. Revisa que la dirección y la ciudad estén bien escritas y guarda de nuevo.",
    locationMissing:
      "Añade la dirección del establecimiento para que los clientes puedan encontrarte con «Cerca de mí» en la app.",
    locationAttribution: "Ubicación obtenida de © OpenStreetMap.",
    publishedInfo: "Tu carta está publicada y cualquiera con el enlace o el QR puede verla.",
    draftInfo: "Tu carta es un borrador: nadie más puede verla todavía.",
    publish: "Publicar carta",
    unpublish: "Despublicar",
    dangerZone: "Eliminar restaurante",
    deleteDescription:
      "Se borrarán el restaurante, todos sus platos y sus alérgenos. Los QR impresos dejarán de funcionar. No se puede deshacer.",
    delete: "Eliminar restaurante",
    deleteConfirmTitle: "¿Eliminar este restaurante?",
    deleteConfirm: "Sí, eliminar",
    cancel: "Cancelar",
    notFound: "No encontrado",
  },
  dishes: {
    title: "Platos",
    manage: "Gestionar platos",
    count: (n: number) => (n === 1 ? "1 plato" : `${n} platos`),
    empty: "Aún no has añadido platos a esta carta.",
    newDish: "Nuevo plato",
    newTitle: "Nuevo plato",
    backToDishes: "← Platos",
    backToRestaurant: "← Restaurante",
    name: "Nombre del plato",
    description: "Descripción",
    price: "Precio (€)",
    priceHint: "Por ejemplo, 9,50. Déjalo vacío si no quieres mostrar precio.",
    category: "Categoría",
    categoryHint: "Por ejemplo, Entrantes, Principales o Postres.",
    ingredients: "Ingredientes",
    ingredientsHint:
      "Informativo para tus clientes. Los alérgenos se declaran aparte, uno a uno: el filtro no lee este texto.",
    active: "Mostrar este plato en la carta",
    inactive: "Oculto",
    noCategory: "Sin categoría",
    create: "Crear plato",
    creating: "Creando…",
    save: "Guardar cambios",
    saving: "Guardando…",
    saved: "Cambios guardados.",
    details: "Datos del plato",
    moveUp: (name: string) => `Subir «${name}»`,
    moveDown: (name: string) => `Bajar «${name}»`,
    delete: "Eliminar plato",
    deleteConfirmTitle: "¿Eliminar este plato?",
    deleteDescription: "Se borrarán el plato y sus alérgenos declarados. No se puede deshacer.",
    deleteConfirm: "Sí, eliminar",
  },
  allergens: {
    title: "Alérgenos",
    description:
      "Indica para cada alérgeno si el plato lo contiene, puede contener trazas o no lo contiene. Si no lo sabes con seguridad, déjalo en «Sin declarar»: tus clientes verán que no hay datos suficientes.",
    responsibility:
      "Eres responsable de la exactitud de esta información (Reglamento UE 1169/2011). Revisa también salsas, aceites de fritura y la posible contaminación cruzada en cocina.",
    levels: {
      contains: "Contiene",
      may_contain: "Trazas",
      free_from: "No contiene",
      undeclared: "Sin declarar",
    },
    progress: (declared: number, total: number) => `${declared} de ${total} alérgenos declarados`,
    missing: (n: number) =>
      n === 1 ? "Falta 1 alérgeno por declarar" : `Faltan ${n} alérgenos por declarar`,
    complete: "Alérgenos completos",
    save: "Guardar alérgenos",
    saving: "Guardando…",
    saved: "Alérgenos guardados.",
    unsaved: "Tienes cambios sin guardar.",
    invalid: "Hay un valor no válido. Recarga la página e inténtalo de nuevo.",
    bulkButton: "Marcar los no declarados como «No contiene»",
    bulkTitle: "¿Marcar como «No contiene»?",
    bulkIntro: "Vas a declarar que este plato NO contiene:",
    bulkWarning:
      "Hazlo solo si lo has comprobado en la receta y en la cocina. Ante la duda, deja el alérgeno en «Sin declarar».",
    bulkConfirm: "Sí, no contiene ninguno",
    bulkNote: "Después revisa la lista y pulsa «Guardar alérgenos».",
    incompleteSummary: (n: number) =>
      n === 1
        ? "1 plato tiene alérgenos sin declarar."
        : `${n} platos tienen alérgenos sin declarar.`,
  },
  qr: {
    title: "Código QR",
    manage: "Código QR de la carta",
    backToRestaurant: "← Restaurante",
    description:
      "Imprime este código y colócalo en las mesas o en la entrada. Al escanearlo, tus clientes abrirán tu carta y podrán filtrarla según sus alergias.",
    imageAlt: (name: string) => `Código QR de la carta de ${name}`,
    opens: "Abre:",
    downloadPng: "Descargar PNG",
    downloadPdf: "Descargar PDF para imprimir",
    notPublished:
      "Tu carta aún no está publicada: quien escanee el QR verá «no encontrado» hasta que la publiques.",
    slugWarning:
      "Si cambias la dirección de la carta, tendrás que volver a imprimir el QR: el anterior dejará de funcionar.",
    pdfHeading: "Carta con información de alérgenos",
    pdfInstructions:
      "Escanea el código con la cámara de tu móvil para ver la carta y filtrarla según tus alergias.",
  },
  menu: {
    metaTitle: (name: string) => `Carta de ${name} · SafeBite`,
    metaDescription: (name: string) =>
      `Carta de ${name} con información de alérgenos declarada por el establecimiento.`,
    call: "Llamar",
    empty: "Esta carta aún no tiene platos.",
    uncategorized: "Otros platos",
    ingredients: "Ingredientes:",
    declaredContains: "Contiene:",
    declaredTraces: "Puede contener trazas de:",
    noDeclarations: "El establecimiento no ha declarado los alérgenos de este plato.",
    undeclared: (n: number) =>
      n === 1 ? "1 alérgeno sin declarar" : `${n} alérgenos sin declarar`,
    poweredBy: "Carta digital con SafeBite",
    filterTitle: "¿Qué alérgenos quieres evitar?",
    filterHint: "Tu selección no se guarda ni se envía: solo se usa en esta pantalla.",
    clear: "Borrar selección",
    hideNotSuitable: "Ocultar platos no aptos",
    summary: (counts: {
      apto: number;
      posibles_trazas: number;
      sin_datos: number;
      no_apto: number;
    }) =>
      [
        `${counts.apto} ${counts.apto === 1 ? "apto" : "aptos"}`,
        `${counts.posibles_trazas} con posibles trazas`,
        `${counts.sin_datos} sin datos suficientes`,
        `${counts.no_apto} no ${counts.no_apto === 1 ? "apto" : "aptos"}`,
      ].join(" · "),
    otherDeclared: "Otros alérgenos declarados:",
    reasonContains: "Contiene:",
    reasonTraces: "Puede contener trazas de:",
    reasonMissing: "Sin datos sobre:",
    hiddenCount: (n: number) =>
      n === 1 ? "1 plato no apto oculto." : `${n} platos no aptos ocultos.`,
    allHidden: "Ningún plato de esta carta es apto según tu selección.",
    notFoundTitle: "Carta no encontrada",
    notFoundText:
      "Esta carta no existe o el establecimiento la ha retirado. Pregunta en el local por su carta.",
  },
  appPromo: {
    button: "Guarda tu perfil: descarga SafeBite",
    text: "Con la app guardas tus alergias una sola vez y las cartas se filtran automáticamente.",
    pageTitle: "SafeBite para tu móvil",
    pageMetaTitle: "App de SafeBite · Próximamente",
    soon: "Próximamente en Android e iOS.",
    pageText:
      "Configura tu perfil de alergias e intolerancias una vez y consulta las cartas de los restaurantes filtradas automáticamente. También podrás escanear el código de barras de productos envasados.",
    privacy:
      "Tu perfil de alergias es un dato de salud: solo lo guardaremos con tu consentimiento y nunca lo compartiremos con los restaurantes.",
    back: "Volver",
  },
  preview: {
    manage: "Vista previa",
    title: "Vista previa de la carta",
    backToRestaurant: "← Restaurante",
    notice:
      "Así verán tu carta tus clientes al escanear el QR. Los platos ocultos no aparecen. Prueba a seleccionar alergias para comprobar cómo se filtra.",
    notPublished: "Tu carta aún no está publicada: solo tú puedes verla aquí.",
  },
  accountConfirmed: {
    title: "Tu cuenta está confirmada",
    passwordTitle: "Contraseña actualizada",
    backToApp: "Ya puedes volver a la app de SafeBite e iniciar sesión.",
  },
  notFound: {
    title: "Página no encontrada",
    description: "La página que buscas no existe o no tienes acceso a ella.",
    back: "Volver al inicio",
  },
};

export type Messages = typeof es;
