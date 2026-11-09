import type { Database } from "@safebite/core";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/env";

/**
 * Refresca la sesión de Supabase en cada petición y devuelve la respuesta con
 * las cookies actualizadas y el id del usuario (o null si no hay sesión).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Cabeceras anti-caché: una respuesta con cookies de sesión nunca debe
        // cachearse en una CDN (serviría la sesión de un usuario a otro).
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // getClaims() verifica el token. No usar getSession() en el servidor: no lo verifica.
  const { data } = await supabase.auth.getClaims();

  return { response, userId: data?.claims.sub ?? null };
}
