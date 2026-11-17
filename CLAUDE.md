# SafeBite

Plataforma para personas con alergias, intolerancias y dietas específicas que quieren comer fuera de casa y comprar alimentos con seguridad. Consta de una app móvil para usuarios, un panel web para restaurantes y una carta web pública accesible por QR.

Especificación completa en `ESPECIFICACION.md`. Léela antes de empezar cualquier tarea grande.

## Stack

- Lenguaje: TypeScript en todo el proyecto
- Web (panel de restaurantes + carta pública por QR): Next.js (App Router)
- Móvil: React Native con Expo
- Backend: Supabase (Postgres, Auth, Row Level Security), región UE
- Productos envasados: API de Open Food Facts
- Tests: Vitest (lógica) y Playwright (web)

## Estructura del repositorio (monorepo)

- `apps/web`: Next.js
- `apps/mobile`: Expo
- `packages/core`: lógica compartida (tipos, filtro de alérgenos, validaciones)
- `supabase/`: migraciones SQL y políticas RLS

## Reglas críticas (no negociables)

1. **Seguridad ante todo en el filtro de alérgenos.** Ante la duda, un plato nunca se marca como "apto". Estados posibles: `apto`, `no_apto`, `sin_datos`, `posibles_trazas`. Si faltan datos de un alérgeno relevante para el usuario, el resultado es `sin_datos`, nunca `apto`.
2. **El filtro vive solo en `packages/core`** y tiene tests exhaustivos (varias alergias a la vez, trazas, platos sin datos, platos sin ingredientes). No se duplica esta lógica en web o móvil.
3. **Los datos de salud son datos sensibles (RGPD, art. 9).** Un usuario solo puede leer y editar su propio perfil de alergias. Nunca se exponen a restaurantes ni a otros usuarios. Todas las tablas llevan Row Level Security activado.
4. **Cada restaurante solo edita su propia carta.** Políticas RLS por propietario.
5. **Lenguaje responsable:** la app nunca dice "garantizado" ni "100 % seguro". Usa "información declarada por el establecimiento" y muestra el aviso: "Confirma siempre con el establecimiento y revisa la etiqueta física".
6. Los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011) son un enum único definido en `packages/core`.
7. Nunca subir claves, tokens ni archivos `.env` al repositorio.

## Convenciones

- Interfaz y textos en español (preparar i18n desde el inicio).
- Identificadores en inglés: tablas, columnas, enums, variables y funciones (`name`, `created_at`, `restaurant_owner`). El español es solo para textos visibles al usuario.
  - **Excepción deliberada:** los estados del filtro se mantienen en español (`apto`, `no_apto`, `posibles_trazas`, `sin_datos`), como en la especificación. No traducirlos.
- Registro con un email que ya tiene cuenta confirmada: Supabase no envía nada y devuelve `user.identities` vacío. Por decisión del usuario, la web y la app muestran en rojo "Esta cuenta ya está registrada" en vez de pedir el email o el código. Se acepta que esto revela qué emails están registrados (lo limita el rate limit de Supabase). Login y recuperación de contraseña siguen sin revelarlo.
- Productos (Open Food Facts): `src/products` traduce las etiquetas de OFF al filtro de core. OFF nunca declara "no contiene": solo se emite `free_from` si OFF marca los ingredientes como completos (`en:ingredients-completed`) y todas las etiquetas son reconocibles (decisión del usuario). Si no, `sin_datos`.
- Perfil de alergias vacío: el filtro devuelve `apto`, pero la interfaz no muestra etiquetas de estado; muestra `FILTER_EMPTY_PROFILE_HINT`.
- Paquetes con el scope `@safebite/*`. TypeScript fijado en ~6.0 (typescript-eslint aún no soporta la 7).
- Roles de cuenta en `profiles.role`: `diner`, `restaurant_owner`, `admin`. El usuario nunca puede cambiar su propio rol; `admin` solo se asigna desde el servidor (service role).
- Solicitudes «Pide este restaurante»: el admin las gestiona con `admin_request_summary()` y `admin_set_request_status()`, que agrupan por restaurante y ciudad y nunca devuelven quién las pidió. Estados: `pending` y `added`. Límite: 20 por usuario en 24 h (error propio `SB429`).
- Verificación de restaurantes: un restaurante solo es público (vistas `public_*`, app y QR) si está publicado Y `verification_status = 'verified'`. Solo el admin lo cambia (`admin_set_restaurant_verification()`, rechazo con motivo obligatorio). Cambiar nombre, ciudad o dirección lo devuelve a `pending`.
- El admin necesita verificación en dos pasos, a elegir en `/admin/dos-pasos`: app de autenticación (TOTP de Supabase, sesión `aal2`) o código por email. La web lo exige (`requireAdmin`) y la base de datos también (`private.require_admin()`: `aal2` o sesión verificada por email en `private.admin_email_sessions`, 12 h). El código por email lo genera y envía la propia base de datos (pg_net → Brevo; Mailpit en local), nunca pasa por el cliente; 10 min, 5 intentos, 5 envíos/hora. **Decisión del usuario:** se acepta que el email es menos seguro (quien entre en el correo puede recuperar la contraseña y recibir el código). Si pierde el móvil del autenticador, se borra el factor desde el panel de Supabase (Authentication → Users).
- Perfiles de familia (función premium, decisión del usuario; **cambio de alcance**: el cobro llegará más adelante): `family_members` y `family_member_allergens`, datos de salud de terceros solo para el titular. Alta solo con `add_family_member` (consentimiento + declaración de tutor o permiso + límite del plan, error `SB402`). `profiles.plan`: `free` = 1 familiar, `premium` = 10; solo lo cambia el admin (`/admin/planes`, `admin_set_account_plan`) hasta que haya pagos. La carta y el mapa filtran por defecto para toda la familia con `combineProfiles` (core).
- Tablas nuevas en `public`: Supabase da permisos por defecto a `anon` y `authenticated`; hacer `revoke all` antes de conceder los necesarios (el test pgTAP de esquema lo vigila).
- Componentes funcionales, TypeScript estricto, sin `any`.
- Commits pequeños y descriptivos, uno por paso que funcione.
- En tareas grandes: planificar primero, esperar confirmación y programar después.
- Cada cambio en lógica crítica incluye tests.

## Comandos

- `pnpm install`: instalar dependencias
- `pnpm dev:web`: arrancar la web
- `pnpm dev:mobile`: arrancar Expo
- `pnpm test`: ejecutar tests (en `packages/core` exige cobertura del 100 % en `src/filter`, `src/allergens`, `src/menu` y `src/products`)
- `pnpm test:mutation`: mutation testing con Stryker sobre `src/filter`, `src/allergens`, `src/menu` y `src/products` (umbral 100 %). Ejecutarlo tras cualquier cambio en esas carpetas. `src/allergens/icons.ts` se excluye: son datos de dibujo decorativos, no lógica.
- `pnpm lint`: revisar código
- `pnpm db:start` / `pnpm db:stop`: arrancar/parar Supabase local (requiere Docker Desktop abierto)
- `pnpm db:reset`: recrear la BD local aplicando migraciones y `supabase/seed.sql`
- `pnpm db:test`: tests pgTAP de permisos RLS (`supabase/tests/`)
- `pnpm db:types`: regenerar `packages/core/src/db/database.types.ts` tras cambiar una migración
- `pnpm test:e2e`: tests de extremo a extremo con Playwright (`apps/web/e2e/`). Los `admin*.spec.ts` van en un proyecto aparte con un solo worker (Supabase no admite dos verificaciones TOTP simultáneas del mismo factor); `e2e/global-setup.ts` obtiene una vez la sesión de admin para la API. Requiere Docker abierto, `pnpm db:start` y `apps/web/.env.local` (ver `.env.example`). Usa el puerto 3000 (debe coincidir con `site_url` de `supabase/config.toml`) y lee los emails de Auth en Mailpit.

## Desarrollo local

- En local ningún email sale a internet: los de Auth (confirmación, recuperación) se ven en Mailpit, http://127.0.0.1:54324. La confirmación de email está activada también en local.
- Cuentas de prueba del seed (contraseña `password123`): `restaurante@safebite.test`, `comensal@safebite.test`, `admin@safebite.test` (rol `admin`, con verificación en dos pasos; clave TOTP de pruebas `JBSWY3DPEHPK3PXP`, solo local) y `admin-nuevo@safebite.test` (admin sin autenticador, para probar el alta).
- App móvil en un dispositivo real (Expo Go): `apps/mobile/.env.local` debe apuntar a la IP del PC en la wifi (`http://<IP>:54321`), no a `127.0.0.1`. Móvil y PC en la misma red.
- La app declara `@babel/core@7` como dependencia de desarrollo: Stryker (en core) trae Babel 8 al monorepo y Expo necesita la 7.

## Producción

- Web: https://safebitee.vercel.app (Vercel, plan gratuito, raíz `apps/web`, región `fra1`). Se despliega desde `main`.
- Supabase: proyecto `alccfbdpkpvwajvpjxqb` en eu-central-1 (Frankfurt), enlazado con `supabase link`.
- Migraciones: `npx supabase db push --remote --dry-run` y, tras confirmarlo con el usuario, sin `--dry-run`.
- Configuración de Auth: los valores de producción están en `[remotes.production]` de `supabase/config.toml`. Ejecutar SIEMPRE `npx supabase config diff` antes de `config push`: el resto del archivo es para desarrollo local y no debe llegar a producción.
- SMTP (Brevo): solo en el panel de Supabase. Sus credenciales nunca van en el repositorio.
- Código por email del admin: en Vault de producción (SQL Editor, nunca en el repo) `admin_email_provider` = `brevo`, `admin_email_sender` y `admin_email_api_key` (clave de la API de Brevo). Sin ellos, pedir el código falla con `SB503` y queda la app de autenticación.
- Todo gratis por decisión del usuario hasta que haya dominio propio. Vercel Hobby no permite uso comercial: revisarlo antes del piloto con restaurantes reales.

## Convenciones de la web (Next.js 16)

- Áreas por rol: `/comensal` (comensales: perfil de alergias, búsqueda con mapa), `/panel` (restaurantes) y `/admin`. `requireDiner`, `requireRestaurantOwner` y `requireAdmin` redirigen a cada uno a la suya. En el registro se elige el tipo de cuenta (sin valor por defecto).
- Mapa: MapLibre GL con el estilo «Liberty» de OpenFreeMap (vectorial, gratuito, sin claves; datos de OpenStreetMap), cargado solo en el navegador (`next/dynamic` sin SSR). La búsqueda por ciudad y por cercanía se hace en el navegador: la ubicación nunca sale del dispositivo. En los tests, `useOfflineMap` sirve un estilo mínimo y no se descarga nada.
- `Permissions-Policy` permite `geolocation=(self)` en toda la web: al navegar dentro de la web el navegador mantiene la política de la primera página cargada, así que limitarla a una ruta deja «Cerca de mí» bloqueado.
- `/r/[slug]` con sesión de comensal parte de su perfil guardado (leído en el servidor); los ajustes en la carta no se guardan.
- `proxy.ts` (antes `middleware.ts`) solo refresca la sesión y hace una redirección optimista. La autorización real se repite en cada página, cada Server Action y cada Route Handler, y RLS es la última barrera.
- En archivos `"use server"` solo se exportan Server Actions: cualquier export es invocable desde el navegador. Los argumentos de `.bind()` se tratan como entrada no fiable (validar ids, comprobar propietario).
- Con Cache Components, lo que lee la sesión va dentro de `<Suspense>`. No usar `use cache` con datos de un usuario.
- Los 404 dentro de contenido en streaming responden 200 con la página de "no encontrado" y `noindex` (comportamiento documentado de Next).
- Next conserva ocultas en el DOM las páginas visitadas: en los tests, buscar elementos por rol o dentro de un formulario con nombre accesible.

## Convenciones de la app móvil (Expo SDK 58)

- Rutas en `apps/mobile/src/app` con Expo Router. Con sesión solo se accede al grupo `(app)`; sin sesión, solo a `(auth)` (`Stack.Protected`). La ruta raíz `index` solo redirige y debe seguir existiendo: sin ella, abrir la app sin sesión da "Unmatched Route".
- La sesión de Supabase se guarda cifrada (`src/lib/secure-session-storage.ts`): nunca en AsyncStorage en claro.
- La confirmación de email y la recuperación de contraseña en la app usan el código del email (`verifyOtp`), no el enlace.
- Tests con jest-expo y React Native Testing Library v14: `renderRouter`, `fireEvent` y `act` son asíncronos y hay que esperarlos (`await`). Los simuladores van en `src/test-utils/` (todo lo que esté en `__tests__/` se ejecuta como test).

## Fuera del MVP (no implementar todavía)

Traductor con cámara, verificación de protocolos de cocina, dietas médicas con datos nutricionales (diabetes, hipertensión), pagos y suscripciones (el plan premium existe, pero aún sin cobro: se asigna desde `/admin/planes`).
