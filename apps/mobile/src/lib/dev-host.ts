/**
 * En desarrollo, la app en el móvil (Expo Go) llega al PC por la red local, y la
 * IP del PC cambia con cada red (wifi de casa, punto de acceso…). Expo ya sabe
 * esa IP: es desde donde el móvil acaba de descargar la app. Aquí se usa para
 * las direcciones locales (Supabase y la web), así .env.local no hay que tocarlo.
 */

/** IPv4 de red privada o del propio equipo (no salen a internet). */
export function isLocalHost(host: string): boolean {
  if (host === "localhost") return true;
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return false;
  }
  const [a = 0, b = 0] = parts;
  return a === 127 || a === 10 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31);
}

/** Host de `hostUri` de Expo («172.20.10.12:8081» → «172.20.10.12»), o null. */
export function hostFromHostUri(hostUri: string | null | undefined): string | null {
  if (hostUri === null || hostUri === undefined || hostUri === "") return null;
  const host = hostUri.split("/")[0]?.split(":")[0] ?? "";
  return host === "" ? null : host;
}

/**
 * Cambia el host de `url` por el del PC si las dos son direcciones locales. Una
 * dirección de producción (https://…supabase.co) o un túnel de Expo no se tocan.
 */
export function withDevHost(url: string, devHost: string | null): string {
  if (devHost === null || !isLocalHost(devHost)) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (!isLocalHost(parsed.hostname)) return url;
  parsed.hostname = devHost;
  // URL añade una barra final a una dirección sin ruta: se quita para no cambiarla.
  const result = parsed.toString();
  return url.endsWith("/") ? result : result.replace(/\/$/, "");
}
