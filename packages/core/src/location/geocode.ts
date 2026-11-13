import { isValidCoordinates, type Coordinates } from "./distance";

/**
 * Elige, entre los resultados de Nominatim (OpenStreetMap), el que está en la
 * ciudad que escribió el restaurante.
 *
 * Nominatim acepta como "ciudad" también la provincia: «Calle Alfonso I 5,
 * Zaragoza» devuelve primero la calle de Ejea de los Caballeros (provincia de
 * Zaragoza). Por eso solo vale un resultado cuyo municipio coincida con la
 * ciudad, sin distinguir mayúsculas, tildes ni espacios.
 */

/** Lo que se usa de cada resultado de `search?format=jsonv2&addressdetails=1`. */
export type NominatimResult = {
  lat?: unknown;
  lon?: unknown;
  address?: Record<string, unknown>;
};

/** Campos de Nominatim que pueden nombrar el municipio, del más al menos habitual. */
const LOCALITY_FIELDS = ["city", "town", "village", "municipality", "hamlet"] as const;

function normalizePlace(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Coordenadas del primer resultado que está en `city`; null si ninguno lo está. */
export function pickGeocodeMatch(results: unknown, city: string): Coordinates | null {
  if (!Array.isArray(results)) return null;
  const wanted = normalizePlace(city);
  if (wanted === "") return null;

  for (const result of results as NominatimResult[]) {
    if (typeof result !== "object" || result === null) continue;
    const address = result.address ?? {};
    const inCity = LOCALITY_FIELDS.some((field) => {
      const value = address[field];
      return typeof value === "string" && normalizePlace(value) === wanted;
    });
    if (!inCity) continue;
    const coordinates = {
      latitude: typeof result.lat === "string" ? Number(result.lat) : Number.NaN,
      longitude: typeof result.lon === "string" ? Number(result.lon) : Number.NaN,
    };
    if (isValidCoordinates(coordinates)) return coordinates;
  }
  return null;
}
