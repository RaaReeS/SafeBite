import { safeRedirectPath } from "@safebite/core";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { destinationAfterEmailLink } from "@/lib/auth-destination";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_TYPES: readonly EmailOtpType[] = ["email", "signup", "recovery"];

function isAllowedType(value: string | null): value is EmailOtpType {
  return value !== null && (ALLOWED_TYPES as readonly string[]).includes(value);
}

/**
 * Destino de los enlaces de los emails de Auth (confirmación de cuenta y
 * recuperación de contraseña). Verifica el token, abre la sesión y redirige a
 * `next` (solo rutas internas).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  let verified = false;

  if (tokenHash !== null && isAllowedType(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    verified = error === null;
  } else if (code !== null) {
    // Plantillas por defecto de Supabase (flujo PKCE, mismo navegador).
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    verified = error === null;
  }

  // En la recuperación se va siempre al formulario de contraseña nueva; el
  // destino según el rol se decide después de guardarla (updatePassword).
  let destination = "/login?error=enlace";
  if (verified) {
    destination =
      type === "recovery" ? next : await destinationAfterEmailLink(supabase, next, "cuenta");
  }
  return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
}
