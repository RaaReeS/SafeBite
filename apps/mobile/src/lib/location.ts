import type { Coordinates } from "@safebite/core";
import * as Location from "expo-location";

export type LocationResult =
  | { status: "granted"; coordinates: Coordinates }
  | { status: "denied" }
  | { status: "unavailable" };

/**
 * Posición actual SOLO si el usuario ya dio permiso antes. No muestra ningún
 * aviso de permiso: sirve para ordenar por cercanía al abrir la búsqueda sin
 * pedir nada que el usuario no haya aceptado ya.
 */
export async function getCoordinatesIfAllowed(): Promise<Coordinates | null> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) return null;
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch {
    return null;
  }
}

/**
 * Pide permiso de ubicación (solo mientras se usa la app) y devuelve la
 * posición actual. Solo se llama cuando el usuario pulsa "Cerca de mí", nunca
 * al abrir la app. La posición no se guarda ni se envía: se usa en el
 * dispositivo para ordenar por distancia.
 */
export async function getCurrentCoordinates(): Promise<LocationResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) return { status: "denied" };
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      status: "granted",
      coordinates: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    };
  } catch {
    return { status: "unavailable" };
  }
}
