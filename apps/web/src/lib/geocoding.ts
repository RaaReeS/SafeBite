import "server-only";
import { pickGeocodeMatch, type Coordinates } from "@safebite/core";
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
export type GeocodeResult =
  | { status: "found"; coordinates: Coordinates }
  /** No hay ninguna dirección así en esa ciudad. */
  | { status: "not_found" }
  /** El servicio no responde: no se sabe si la dirección existe. */
  | { status: "unavailable" };

export async function geocodeAddress(address: string, city: string): Promise<GeocodeResult> {
  if (process.env.GEOCODER === "fake") return fakeGeocode(address, city);
  return nominatimGeocode(address, city);
}

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
/** Normas de uso de Nominatim: como mucho una petición por segundo. */
const NOMINATIM_GAP_MS = 1100;

async function nominatim(params: Record<string, string>): Promise<unknown> {
  const url = new URL(NOMINATIM);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "es");
  url.searchParams.set("accept-language", "es");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: { "User-Agent": `SafeBite/0.1 (+${env.siteUrl})` },
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Nominatim ${response.status}`);
  return response.json();
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Caja del municipio [oeste, norte, este, sur], o null si no se encuentra. */
async function cityViewbox(city: string): Promise<string | null> {
  const results = await nominatim({ city, featureType: "settlement", limit: "1" });
  const box = Array.isArray(results)
    ? (results[0] as { boundingbox?: unknown } | undefined)?.boundingbox
    : undefined;
  if (!Array.isArray(box) || box.length !== 4) return null;
  const [south, north, west, east] = box.map(Number);
  if (![south, north, west, east].every((n) => Number.isFinite(n))) return null;
  return `${west},${north},${east},${south}`;
}

async function nominatimGeocode(address: string, city: string): Promise<GeocodeResult> {
  try {
    // 1. Calle y ciudad. Nominatim mezcla municipios de la provincia con el mismo
    //    nombre, así que se piden varios y se elige el del municipio escrito.
    const direct = pickGeocodeMatch(
      await nominatim({ street: address, city, addressdetails: "1", limit: "5" }),
      city,
    );
    if (direct !== null) return { status: "found", coordinates: direct };

    // 2. Si no, la calle buscada solo dentro del municipio (p. ej. «Calle Alfonso I 5»
    //    en Zaragoza, que el paso 1 confunde con pueblos de la provincia).
    await wait(NOMINATIM_GAP_MS);
    const viewbox = await cityViewbox(city);
    if (viewbox === null) return { status: "not_found" };
    await wait(NOMINATIM_GAP_MS);
    const bounded = pickGeocodeMatch(
      await nominatim({ q: address, viewbox, bounded: "1", addressdetails: "1", limit: "5" }),
      city,
    );
    return bounded === null ? { status: "not_found" } : { status: "found", coordinates: bounded };
  } catch {
    return { status: "unavailable" };
  }
}

const FAKE_CITIES: Record<string, Coordinates> = {
  madrid: { latitude: 40.4168, longitude: -3.7038 },
  sevilla: { latitude: 37.3891, longitude: -5.9845 },
  barcelona: { latitude: 41.3874, longitude: 2.1686 },
};

/**
 * Simulado y determinista: misma dirección, mismas coordenadas. Una dirección
 * con «no existe» no se encuentra; con «sin servicio», el servicio no responde.
 */
function fakeGeocode(address: string, city: string): GeocodeResult {
  if (/sin servicio/i.test(address)) return { status: "unavailable" };
  const base = FAKE_CITIES[city.trim().toLowerCase()];
  if (base === undefined || /no existe/i.test(address)) return { status: "not_found" };
  let hash = 0;
  for (const char of address) hash = (hash * 31 + char.charCodeAt(0)) % 1000;
  return {
    status: "found",
    coordinates: {
      latitude: base.latitude + hash / 100_000,
      longitude: base.longitude + hash / 100_000,
    },
  };
}

/** Enlace para comprobar la ubicación en OpenStreetMap. */
export function mapUrl({ latitude, longitude }: Coordinates): string {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=18/${latitude}/${longitude}`;
}
