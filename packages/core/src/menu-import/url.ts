/**
 * URL existe en Node, en los navegadores y en la app (polyfill), pero core no
 * carga los tipos del navegador: se declara solo lo que se usa.
 */
declare const URL: new (input: string) => {
  protocol: string;
  username: string;
  password: string;
  port: string;
  hostname: string;
  toString(): string;
};

/**
 * Comprobaciones para descargar la carta desde un enlace que escribe el
 * restaurante sin abrir la puerta a SSRF: solo direcciones públicas de
 * internet, nunca la red interna del servidor ni los metadatos de la nube.
 */

function parseIPv4(text: string): number[] | null {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(text);
  if (match === null) return null;
  const octets = match.slice(1).map((part) => (/^0\d/.test(part) ? Number.NaN : Number(part)));
  return octets.every((octet) => octet <= 255) ? octets : null;
}

/** Rangos IPv4 que no son internet público (RFC 6890 y similares). */
function isPublicIPv4([a = 0, b = 0, c = 0]: number[]): boolean {
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  if (a === 169 && b === 254) return false; // enlace local (metadatos de la nube)
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
  if (a === 198 && (b === 18 || b === 19)) return false; // pruebas de red
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

/** Los 8 grupos de 16 bits de una IPv6 (admite «::» y una IPv4 al final), o null. */
function parseIPv6(text: string): number[] | null {
  let rest = text;
  const tail: number[] = [];
  // Una IPv4 al final (::ffff:1.2.3.4): solo puede ir en el último grupo.
  const lastColon = rest.lastIndexOf(":");
  if (rest.includes(".")) {
    const octets = parseIPv4(rest.slice(lastColon + 1));
    if (octets === null) return null;
    const [a = 0, b = 0, c = 0, d = 0] = octets;
    tail.push(a * 256 + b, c * 256 + d);
    // Lo que va antes de la IPv4: «::ffff:» → «::ffff»; «::» se queda como está.
    const prefix = rest.slice(0, lastColon + 1);
    rest = prefix.endsWith("::") ? prefix : prefix.slice(0, -1);
  }
  const gap = rest.indexOf("::");
  const toGroups = (part: string) => (part === "" ? [] : part.split(":"));
  const head = toGroups(gap === -1 ? rest : rest.slice(0, gap));
  // Un segundo «::» deja un grupo vacío, que no pasa la comprobación de abajo.
  const end = toGroups(gap === -1 ? "" : rest.slice(gap + 2));
  const written = head.length + end.length + tail.length;
  if (gap === -1 ? written !== 8 : written > 7) return null;
  const parse = (group: string) => (/^[0-9a-f]{1,4}$/i.test(group) ? parseInt(group, 16) : null);
  const groups = [...head, ...Array<string>(8 - written).fill("0"), ...end].map(parse);
  if (groups.some((group) => group === null)) return null;
  return [...(groups as number[]), ...tail];
}

function isPublicIPv6(groups: number[]): boolean {
  const [g0 = 0, g1 = 0, , , , g5 = 0, g6 = 0, g7 = 0] = groups;
  const firstFiveZero = groups.slice(0, 5).every((group) => group === 0);
  // IPv4 dentro de IPv6 (::ffff:a.b.c.d): manda la IPv4.
  if (firstFiveZero && g5 === 0xffff) return isPublicIPv4([g6 >> 8, g6 & 0xff, g7 >> 8, g7 & 0xff]);
  if (firstFiveZero) return false; // ::, ::1 y el resto de ::/80 (IPv4 «compatibles» antiguas)
  if ((g0 & 0xfe00) === 0xfc00) return false; // única local
  if ((g0 & 0xffc0) === 0xfe80) return false; // enlace local
  if ((g0 & 0xff00) === 0xff00) return false; // multicast
  if (g0 === 0x64 && g1 === 0xff9b) return false; // NAT64
  if (g0 === 0x2001 && g1 === 0xdb8) return false; // documentación
  return true;
}

/** true si la IP (v4 o v6) es de internet público; false si es interna o no es una IP. */
export function isPublicAddress(ip: string): boolean {
  const v4 = parseIPv4(ip);
  if (v4 !== null) return isPublicIPv4(v4);
  const v6 = parseIPv6(ip);
  return v6 !== null && isPublicIPv6(v6);
}

export type MenuUrlCheck =
  | { ok: true; url: string }
  | { ok: false; reason: "invalid" | "protocol" | "credentials" | "port" | "private" };

/** Nombres que nunca son de internet público. */
function isInternalName(host: string): boolean {
  return (
    // «localhost», «intranet»… (sin punto).
    !host.includes(".") ||
    [".localhost", ".local", ".internal"].some((suffix) => host.endsWith(suffix))
  );
}

/**
 * Comprueba el enlace de la carta antes de descargarlo. Solo http/https, sin
 * usuario ni contraseña, con los puertos de siempre y a un nombre o IP pública.
 * (El servidor vuelve a comprobar la IP real al conectarse.)
 */
export function checkMenuUrl(input: string): MenuUrlCheck {
  let url: InstanceType<typeof URL>;
  try {
    // URL ya quita los espacios del principio y del final.
    url = new URL(input);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "protocol" };
  }
  if (url.username !== "" || url.password !== "") return { ok: false, reason: "credentials" };
  if (url.port !== "") return { ok: false, reason: "port" };
  // Stryker disable next-line Regex: los corchetes de una IPv6 solo pueden ir en los extremos.
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  const literal = parseIPv4(host) !== null || host.includes(":");
  if (literal ? !isPublicAddress(host) : isInternalName(host)) {
    return { ok: false, reason: "private" };
  }
  return { ok: true, url: url.toString() };
}
