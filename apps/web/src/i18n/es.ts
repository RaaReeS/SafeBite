// Textos de la web en español. Para añadir un idioma: crear otro archivo con el
// mismo tipo (Messages) y elegirlo en getMessages().
// Los textos del filtro, los alérgenos y los errores de validación viven en
// @safebite/core porque los comparten web y móvil.

export const es = {
  common: {
    appName: "SafeBite",
    forRestaurants: "para restaurantes",
    tagline:
      "Cartas y productos filtrados según tus alergias, con lo que declara cada establecimiento.",
    sourceNotice: "Información declarada por el establecimiento.",
    genericError: "Ha ocurrido un error inesperado. Inténtalo de nuevo en unos minutos.",
    tooManyAttempts: "Demasiados intentos. Espera unos minutos antes de volver a probar.",
    loading: "Cargando…",
  },
  menuImport: {
    open: "Importar desde la carta",
    title: "Importar desde la carta",
    intro:
      "Sube fotos o un PDF de tu carta y leeremos los platos por ti. Después podrás revisarlos y corregirlos antes de añadirlos.",
    fileLabel: "Fotos o PDF de la carta",
    fileHint:
      "De 1 a 5 fotos (JPG, PNG o WebP) o un PDF de hasta 5 páginas. No guardamos los archivos.",
    read: "Leer la carta",
    reading: "Leyendo la carta… Puede tardar unos segundos.",
    reviewLabel: "Platos leídos de la carta",
    reviewTitle: "Revisa los platos",
    reviewIntro: (n: number) =>
      `Hemos encontrado ${n === 1 ? "1 plato" : `${n} platos`}. Corrige lo que haga falta y desmarca los que no quieras añadir.`,
    responsibility:
      "Alérgenos propuestos automáticamente: revisa cada uno antes de guardar. Tú eres responsable de la información (Reglamento UE 1169/2011).",
    dishLegend: (n: number, name: string) => `Plato ${n}: ${name}`,
    include: (name: string) => `Añadir «${name}»`,
    untitled: "plato sin nombre",
    fields: {
      name: "Nombre",
      price: "Precio (€)",
      category: "Categoría",
      description: "Descripción",
      ingredients: "Ingredientes",
    },
    suggestedTitle: "Alérgenos propuestos (sin confirmar)",
    noSuggestions: "Sin alérgenos propuestos: decláralos tú en cada plato.",
    levels: { contains: "contiene", may_contain: "puede contener trazas" },
    nameRequired: "Escribe el nombre del plato.",
    noneIncluded: "Marca al menos un plato para añadirlo.",
    add: (n: number) => (n === 1 ? "Añadir 1 plato" : `Añadir ${n} platos`),
    startOver: "Elegir otros archivos",
    imported: (n: number) =>
      `${n === 1 ? "Se ha añadido 1 plato" : `Se han añadido ${n} platos`}. Hasta que revises sus alérgenos, tus clientes verán «sin datos».`,
    toReview: "Alérgenos por revisar",
    editorNotice:
      "Los alérgenos marcados como «Propuesto» se han leído automáticamente de tu carta. No cuentan hasta que los revises y pulses «Guardar alérgenos».",
    suggested: "Propuesto",
    prepare: {
      tooManyPages: "Como mucho 5 páginas: sube menos fotos o un PDF más corto.",
      unsupported: "Sube fotos (JPG, PNG o WebP) o un PDF.",
      unreadable: "No hemos podido abrir el archivo. Prueba con otra foto o PDF.",
    },
    errors: {
      invalidFiles:
        "No hemos podido preparar la carta. Sube de 1 a 5 fotos (JPG, PNG o WebP) o un PDF de hasta 5 páginas.",
      dailyLimit:
        "Has leído 5 cartas en las últimas 24 horas. Vuelve a intentarlo mañana o añade los platos a mano.",
      unavailable:
        "Ahora mismo no podemos leer la carta. Inténtalo más tarde o añade los platos a mano.",
      noDishes:
        "No hemos encontrado platos en la carta. Prueba con una foto más nítida o añade los platos a mano.",
      generic: "Ha ocurrido un error. Inténtalo de nuevo en unos minutos.",
    },
  },
  appearance: {
    title: "Apariencia",
    button: (current: string) => `Apariencia: ${current}`,
    options: { system: "Automático", light: "Claro", dark: "Oscuro" },
  },
  home: {
    accountDeleted: "Tu cuenta y todos tus datos se han borrado.",
    title: "Tu carta con información de alérgenos, clara y siempre actualizada",
    description:
      "Declara los alérgenos de cada plato y comparte tu carta con un código QR. Tus clientes con alergias o intolerancias podrán filtrarla según su perfil.",
    login: "Entrar",
    register: "Crear cuenta de restaurante",
    dinerTitle: "¿Tienes alergias o intolerancias?",
    dinerDescription:
      "Guarda tu perfil una vez y busca restaurantes cerca de ti con la carta filtrada para ti.",
    dinerRegister: "Crear cuenta de comensal",
    features: {
      qrTitle: "Carta con código QR",
      qrText: "Tus clientes la abren desde la mesa, sin descargar nada.",
      allergensTitle: "Los 14 alérgenos",
      allergensText: "Declara para cada plato si contiene, puede contener trazas o no contiene.",
      tableTitle: "Tabla imprimible",
      tableText: "Descarga en PDF la tabla de alérgenos de tu carta para tenerla en el local.",
    },
    privacy: "Privacidad",
    terms: "Términos de uso",
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
      title: "Crear cuenta",
      description:
        "Como comensal, guardarás tus alergias y verás las cartas filtradas para ti. Como restaurante, publicarás tu carta con la información de alérgenos de cada plato.",
      accountType: "Tipo de cuenta",
      diner: "Soy comensal",
      dinerHint: "Busco dónde comer según mis alergias o las de mi familia.",
      owner: "Soy un restaurante",
      ownerHint: "Quiero publicar la carta de mi establecimiento.",
      chooseType: "Elige si eres comensal o restaurante.",
      acceptTermsBefore: "He leído y acepto los",
      terms: "términos de uso",
      acceptTermsMiddle: "y la",
      privacy: "política de privacidad",
      acceptTermsAfter: ".",
      ownerResponsibility:
        " Entiendo que soy responsable de la información de alérgenos que declare.",
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
  diner: {
    navLabel: "Secciones de tu cuenta",
    nav: {
      home: "Inicio",
      restaurants: "Restaurantes",
      allergies: "Mis alergias",
      family: "Mi familia",
      account: "Mi cuenta",
    },
    /** Barra inferior del móvil (poco espacio). */
    navShort: {
      allergies: "Alergias",
      family: "Familia",
      account: "Cuenta",
    },
    home: {
      greeting: (email: string) => `Hola, ${email}`,
      intro:
        "Guarda tus alergias una vez y consulta las cartas de los restaurantes filtradas para ti. También puedes usar la app de SafeBite en el móvil con la misma cuenta.",
      accountConfirmed: "Tu cuenta está confirmada. ¡Bienvenido a SafeBite!",
      passwordChanged: "Tu contraseña se ha cambiado.",
      allergiesTitle: "Mis alergias",
      noConsent: "Aún no has configurado tus alergias.",
      configure: "Configurar mis alergias",
      noAllergies: "No has marcado ninguna alergia.",
      yourAllergies: (list: string) => `Tus alergias: ${list}.`,
      edit: "Editar mis alergias",
      family: (names: string) => `También filtras para: ${names}.`,
      quickSearchHint: "Cartas filtradas y mapa de dónde puedes comer",
      quickFamilyHint: "Filtra a la vez para las personas con las que comes",
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
      required: "Para guardar tus alergias necesitamos tu consentimiento explícito.",
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
    search: {
      title: "Restaurantes",
      open: "Buscar restaurantes",
      city: "Ciudad",
      nearMe: "Cerca de mí",
      locating: "Buscando tu ubicación…",
      privacy:
        "Tu ubicación solo se usa en tu navegador para ordenar por cercanía: no se guarda ni se envía.",
      denied:
        "Sin permiso de ubicación no podemos ordenar por cercanía. Puedes buscar por ciudad o permitirla en tu navegador.",
      unavailable: "No se ha podido obtener tu ubicación. Inténtalo de nuevo o busca por ciudad.",
      results: (n: number) => (n === 1 ? "1 restaurante" : `${n} restaurantes`),
      byProximity: "de más cerca a más lejos",
      noRestaurants: "Todavía no hay restaurantes publicados.",
      noResultsCity: (city: string) => `No hemos encontrado restaurantes en «${city}».`,
      mapLabel: "Mapa de restaurantes",
      listLabel: "Lista de restaurantes",
      openMenu: "Ver la carta",
      noProfile: "Guarda tus alergias para ver en el mapa dónde puedes comer.",
      forWhom: "¿Para quién buscas?",
      configureProfile: "Configurar mis alergias",
      canEatIn: (n: number, total: number) =>
        n === 1
          ? `Puedes comer en 1 de ${total} restaurantes, según lo declarado.`
          : `Puedes comer en ${n} de ${total} restaurantes, según lo declarado.`,
      showAll: "Mostrar también los demás restaurantes",
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
        "Ningún restaurante tiene platos aptos para tus alergias según lo declarado. Marca «Mostrar también los demás» para verlos todos.",
      youAreHere: "Estás aquí",
    },
    account: {
      title: "Mi cuenta",
      signedInAs: (email: string) => `Has iniciado sesión como ${email}.`,
      healthTitle: "Tus datos de salud",
      consentGiven: "Has dado tu consentimiento para guardar tu perfil de alergias.",
      consentNotGiven: "No tienes un perfil de alergias guardado.",
      withdraw: "Retirar consentimiento y borrar mis alergias",
      withdrawTitle: "¿Retirar el consentimiento?",
      withdrawMessage:
        "Se borrarán tus alergias guardadas. Las cartas dejarán de filtrarse automáticamente hasta que vuelvas a configurarlas.",
      withdrawConfirm: "Retirar y borrar",
      withdrawn: "Has retirado tu consentimiento y tus alergias se han borrado.",
      deleteTitle: "Borrar mi cuenta",
      delete: "Borrar mi cuenta",
      deleteConfirmTitle: "¿Borrar tu cuenta?",
      deleteMessage:
        "Se borrarán tu cuenta, tu perfil de alergias y todos tus datos. No se puede deshacer.",
      deleteConfirm: "Borrar mi cuenta",
      cancel: "Cancelar",
    },
  },
  family: {
    title: "Mi familia",
    description:
      "Guarda las alergias de las personas con las que comes (tus hijos, tu pareja…) y filtra las cartas y el mapa para todos a la vez.",
    consentRequired:
      "Antes de guardar las alergias de tu familia, configura las tuyas y da tu consentimiento para guardar datos de salud.",
    empty: "Aún no has añadido a nadie.",
    noAllergies: "Sin alergias marcadas",
    edit: "Editar",
    editOf: (name: string) => `Editar a ${name}`,
    usage: (n: number, limit: number) => `${n} de ${limit} familiares en tu plan.`,
    addTitle: "Añadir a alguien",
    name: "Nombre o apodo",
    nameHint: "Por ejemplo, «Lucía» o «Abuelo». No hace falta el nombre completo.",
    nameInvalid: "Escribe un nombre de 1 a 40 caracteres.",
    guardian:
      "Soy su madre, padre o tutor legal, o tengo su permiso para guardar sus alergias en SafeBite.",
    guardianRequired:
      "Para guardar las alergias de otra persona necesitas su permiso o ser su tutor.",
    add: "Añadir",
    limitReached:
      "Has llegado al número de familiares de tu plan. El plan premium permitirá hasta 10.",
    freeFull:
      "Con el plan gratis puedes guardar 1 familiar. El plan premium, con hasta 10, estará disponible próximamente.",
    premiumFull: "Has llegado al máximo de 10 familiares.",
    back: "← Mi familia",
    allergiesOf: (name: string) => `Alergias de ${name}`,
    allergiesSaved: "Sus alergias se han guardado.",
    renameTitle: "Cambiar el nombre",
    rename: "Guardar nombre",
    renamed: "Nombre guardado.",
    deleteTitle: "Quitar de mi familia",
    delete: "Quitar de mi familia",
    deleteConfirmTitle: (name: string) => `¿Quitar a ${name}?`,
    deleteMessage: "Se borrarán su nombre y sus alergias. No se puede deshacer.",
    deleted: "Se ha quitado de tu familia y sus datos se han borrado.",
  },
  admin: {
    label: "Administración",
    nav: {
      requests: "Solicitudes",
      restaurants: "Verificación de restaurantes",
      plans: "Planes",
    },
    plans: {
      title: "Planes de las cuentas",
      description:
        "Mientras no haya pagos, aquí se da o se quita el plan premium (hasta 10 familiares en lugar de 1). Escribe el email de la cuenta.",
      formLabel: "Cambiar el plan de una cuenta",
      email: "Email de la cuenta",
      makePremium: "Dar premium",
      makeFree: "Volver al plan gratis",
      notFound: "No hay ninguna cuenta con ese email.",
      madePremium: (email: string) => `${email} ya tiene el plan premium.`,
      madeFree: (email: string) => `${email} vuelve al plan gratis.`,
    },
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
      methodLabel: "Método de verificación",
      methods: { app: "App de autenticación", email: "Código por email" },
      chooseMethod:
        "Elige cómo quieres verificar tu identidad: con una app de autenticación (Google Authenticator…) o con un código que te enviamos por email.",
      emailIntro: (email: string) =>
        `Te enviaremos un código de 6 cifras a ${email}. Caduca a los 10 minutos.`,
      sendEmail: "Enviarme un código",
      resendEmail: "Enviar otro código",
      emailSent: (email: string) =>
        `Te hemos enviado un código a ${email}. Si no lo ves en unos minutos, revisa la carpeta de spam.`,
      emailCodeHint: "El código de 6 cifras del email.",
      wrongEmailCode: "El código no es correcto. Revisa el último email que te hemos enviado.",
      emailCodeExpired: "El código ha caducado o ya se ha usado. Pide uno nuevo.",
      tooManyAttempts: "Demasiados intentos con ese código. Pide uno nuevo.",
      tooManyEmails:
        "Has pedido demasiados códigos. Espera una hora o usa la app de autenticación.",
      emailError:
        "No se ha podido enviar o comprobar el código. Inténtalo de nuevo en unos minutos.",
      emailWarning:
        "El código por email es menos seguro que la app de autenticación: quien entre en tu correo podría recuperar tu contraseña y también recibir el código.",
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
      cancel: "Cancelar",
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
    area: "Restaurantes",
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
      "Hemos ubicado tu dirección en el mapa: los clientes podrán encontrarte en el mapa y con «Cerca de mí».",
    locationCheck: "Comprobar en el mapa",
    locationNotFound:
      "Esta dirección no está ubicada en el mapa, así que tu restaurante no aparecerá en la búsqueda. Revisa la calle, el número y la ciudad y guarda de nuevo.",
    locationMissing:
      "Añade la dirección del establecimiento para que los clientes puedan encontrarte en el mapa y con «Cerca de mí».",
    locationAttribution: "Ubicación obtenida de © OpenStreetMap.",
    addressNotFound: (city: string) =>
      `No encontramos esta dirección en ${city}. Revisa el nombre de la calle y el número (por ejemplo, «Calle de Alfonso I, 5») y que la ciudad sea la del establecimiento.`,
    geocoderUnavailable:
      "No hemos podido comprobar la dirección ahora mismo. No se ha guardado nada: inténtalo de nuevo en unos minutos.",
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
  allergenTable: {
    title: "Información sobre alérgenos",
    download: "Descargar tabla de alérgenos (PDF)",
    description:
      "Una tabla con todos tus platos activos y los 14 alérgenos, para colgar en el local o enseñar si te la piden.",
    updated: (date: string) => `Actualizada el ${date}.`,
    dish: "Plato",
    uncategorized: "Otros platos",
    empty: "La carta todavía no tiene platos activos.",
    legend: {
      contains: "Contiene",
      may_contain: "Puede contener trazas",
      free_from: "No contiene",
      undeclared: "Sin declarar: consulta al personal",
    },
    disclaimer:
      "Información sobre alérgenos (Reglamento (UE) n.º 1169/2011) declarada por el establecimiento. Si tienes alguna alergia o intolerancia, consulta siempre al personal antes de pedir.",
    page: (page: number, total: number) => `Página ${page} de ${total}`,
    shortLabels: {
      gluten: "Gluten",
      crustaceans: "Crustáceos",
      eggs: "Huevos",
      fish: "Pescado",
      peanuts: "Cacahuetes",
      soybeans: "Soja",
      milk: "Lácteos",
      nuts: "Frutos de cáscara",
      celery: "Apio",
      mustard: "Mostaza",
      sesame: "Sésamo",
      sulphites: "Sulfitos",
      lupin: "Altramuces",
      molluscs: "Moluscos",
    },
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
    backToSearch: "← Restaurantes",
    usingProfile: "Filtrada con tu perfil de alergias.",
    forWhom: "¿Para quién es?",
    usingProfileFor: (names: string) => `Filtrada para: ${names}.`,
    adjusted: "Ajustada solo para esta carta: tu perfil guardado no cambia.",
    resetToProfile: "Volver a mi perfil",
    configureProfile: "Configura tus alergias para que las cartas se filtren solas",
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
  notFound: {
    title: "Página no encontrada",
    description: "La página que buscas no existe o no tienes acceso a ella.",
    back: "Volver al inicio",
  },
};

export type Messages = typeof es;
