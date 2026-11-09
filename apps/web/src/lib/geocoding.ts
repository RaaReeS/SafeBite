import "server-only";
import type { Coordinates } from "@safebite/core";
import { env } from "@/env";

/**
 * Convierte la dirección de un restaurante en coordenadas, para la búsqueda
 * "cerca de mí" de la app.
 *
 * Proveedor: Nominatim (OpenStreetMap), gratuito. Normas de uso que se cumplen:
 * peticiones esporádicas (solo al guardar un restaurante con dirección nueva),
 * desde el servidor, identificando la aplicación (sin datos personales).
 * https://operations.osmfoundation.org/policies/nominatim/
 *
 * Con GEOCODER=fake (tests) se usa un geocodificador simulado y no se llama a
 * ningún servicio externo.
 */
export async function geocodeAddress(address: string, city: string): Promise<Coordinates | null> {
  if (process.env.GEOCODER === "fake") return fakeGeocode(address, city);
  return nominatimGeocode(address, city);
}

async function nominatimGeocode(address: string, city: string): Promise<Coordinates | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("street", address);
  url.searchParams.set("city", city);
  url.searchParams.set("accept-language", "es");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": `SafeBite/0.1 (+${env.siteUrl})` },
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const results = (await response.json()) as { lat?: string; lon?: string }[];
    const first = results[0];
    if (first?.lat === undefined || first.lon === undefined) return null;
    const coordinates = { latitude: Number(first.lat), longitude: Number(first.lon) };
    return Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)
      ? coordinates
      : null;
  } catch {
    // Si el servicio falla o tarda, el restaurante se guarda igualmente sin ubicación.
    return null;
  }
}

const FAKE_CITIES: Record<string, Coordinates> = {
  madrid: { latitude: 40.4168, longitude: -3.7038 },
  sevilla: { latitude: 37.3891, longitude: -5.9845 },
  barcelona: { latitude: 41.3874, longitude: 2.1686 },
};

/** Simulado y determinista: misma dirección, mismas coordenadas. */
function fakeGeocode(address: string, city: string): Coordinates | null {
  const base = FAKE_CITIES[city.trim().toLowerCase()];
  if (base === undefined || /no existe/i.test(address)) return null;
  let hash = 0;
  for (const char of address) hash = (hash * 31 + char.charCodeAt(0)) % 1000;
  return { latitude: base.latitude + hash / 100_000, longitude: base.longitude + hash / 100_000 };
}

/** Enlace para comprobar la ubicación en OpenStreetMap. */
export function mapUrl({ latitude, longitude }: Coordinates): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
}
