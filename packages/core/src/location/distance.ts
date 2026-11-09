export type Coordinates = { latitude: number; longitude: number };

/** Radio medio de la Tierra en km. */
const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Distancia en línea recta (fórmula del haversine), en kilómetros. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  // min(1, …) evita errores de redondeo en puntos casi opuestos.
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, h)));
}

type MaybeCoordinates = { latitude: number | null; longitude: number | null };

export function isValidCoordinates(value: MaybeCoordinates): value is Coordinates {
  const { latitude, longitude } = value;
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

/**
 * Ordena lugares de más cerca a más lejos de `origin`. Los que no tienen
 * coordenadas válidas quedan fuera. `maxKm` limita el radio.
 *
 * Se calcula en el dispositivo: la ubicación del usuario no se envía a ningún
 * servidor.
 */
export function sortByDistance<T extends MaybeCoordinates>(
  items: readonly T[],
  origin: Coordinates,
  maxKm = Number.POSITIVE_INFINITY,
): { item: T; distanceKm: number }[] {
  return items
    .filter((item) => isValidCoordinates(item))
    .map((item) => ({ item, distanceKm: distanceKm(origin, item as T & Coordinates) }))
    .filter(({ distanceKm: d }) => d <= maxKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Texto de distancia para mostrar: "a 350 m", "a 1,3 km", "a 12 km". */
export function formatDistance(km: number): string {
  if (km < 0.05) return "a menos de 50 m";
  const meters = Math.round((km * 1000) / 10) * 10;
  if (meters < 1000) return `a ${meters} m`;
  if (km < 10) return `a ${String(Math.round(km * 10) / 10).replace(".", ",")} km`;
  return `a ${Math.round(km)} km`;
}
