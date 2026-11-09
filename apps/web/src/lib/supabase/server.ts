import "server-only";
import type { Database } from "@safebite/core";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/env";

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 * Actúa con la sesión del usuario: todas las consultas pasan por RLS.
 * Se crea uno por petición (nunca se reutiliza entre usuarios).
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies. No pasa nada:
          // proxy.ts ya ha refrescado la sesión antes de llegar aquí.
        }
      },
    },
  });
}
