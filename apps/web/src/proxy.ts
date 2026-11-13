import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Refresca la sesión y hace una comprobación optimista: sin sesión no se entra
 * al panel. NO es la autorización real: cada página y cada Server Action vuelve
 * a comprobar el usuario en el servidor, y RLS es la última barrera.
 */
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isPrivate = ["/panel", "/admin", "/comensal"].some((prefix) => pathname.startsWith(prefix));
  if (userId === null && isPrivate) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    const redirect = NextResponse.redirect(loginUrl);
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  }

  return response;
}

// Solo las rutas que usan sesión. La carta pública (/r/...) no pasa por aquí.
export const config = {
  matcher: [
    "/panel/:path*",
    "/admin/:path*",
    "/comensal/:path*",
    "/login",
    "/registro",
    "/recuperar",
    "/nueva-contrasena",
    "/auth/:path*",
  ],
};
