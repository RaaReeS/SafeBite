import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad para todas las páginas.
 * - Ninguna web puede mostrar SafeBite dentro de un marco (evita que engañen a
 *   un dueño para pulsar "Publicar" o "Borrar" sin saberlo: clickjacking).
 * - El navegador no adivina tipos de archivo (nosniff).
 * - A otras webs solo se envía el dominio de origen, nunca la ruta.
 * - La web no usa cámara, micrófono, ubicación ni pagos: quedan desactivados.
 * HSTS ya lo añade Vercel.
 */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  // @safebite/core se consume como código TypeScript sin compilar.
  transpilePackages: ["@safebite/core"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
