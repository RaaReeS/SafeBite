// eslint-disable-next-line no-control-regex -- se buscan caracteres de control a propósito.
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

/**
 * Valida una ruta de destino recibida del usuario (por ejemplo, `?next=` del
 * login) para evitar redirecciones abiertas: solo se aceptan rutas internas.
 * Si no es segura, devuelve `fallback`.
 *
 * Una ruta interna empieza por una sola "/". Se rechazan "//" y "\" (los
 * navegadores los interpretan como otro dominio) y los caracteres de control
 * (los navegadores eliminan tabuladores y saltos de línea, de modo que
 * "/\t/evil.com" acabaría siendo "//evil.com").
 */
export function safeRedirectPath(value: unknown, fallback = "/panel"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("\\") || CONTROL_CHARACTERS.test(value)) return fallback;
  return value;
}
