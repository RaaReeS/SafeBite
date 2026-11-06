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
- Paquetes con el scope `@safebite/*`. TypeScript fijado en ~6.0 (typescript-eslint aún no soporta la 7).
- Roles de cuenta en `profiles.role`: `diner`, `restaurant_owner`, `admin`. El usuario nunca puede cambiar su propio rol; `admin` solo se asigna desde el servidor (service role).
- Componentes funcionales, TypeScript estricto, sin `any`.
- Commits pequeños y descriptivos, uno por paso que funcione.
- En tareas grandes: planificar primero, esperar confirmación y programar después.
- Cada cambio en lógica crítica incluye tests.

## Comandos

- `pnpm install`: instalar dependencias
- `pnpm dev:web`: arrancar la web
- `pnpm dev:mobile`: arrancar Expo
- `pnpm test`: ejecutar tests
- `pnpm lint`: revisar código
- `pnpm db:start` / `pnpm db:stop`: arrancar/parar Supabase local (requiere Docker Desktop abierto)
- `pnpm db:reset`: recrear la BD local aplicando migraciones y `supabase/seed.sql`
- `pnpm db:test`: tests pgTAP de permisos RLS (`supabase/tests/`)
- `pnpm db:types`: regenerar `packages/core/src/db/database.types.ts` tras cambiar una migración

## Fuera del MVP (no implementar todavía)

Traductor con cámara, verificación de protocolos de cocina, dietas médicas con datos nutricionales (diabetes, hipertensión), pagos y suscripciones.
