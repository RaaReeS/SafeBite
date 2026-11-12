import AsyncStorage from "@react-native-async-storage/async-storage";
import { isValidBarcode } from "@safebite/core";

/**
 * Historial de productos escaneados, guardado SOLO en el móvil (nunca se sube
 * al servidor). Se guarda por usuario y sin el resultado del semáforo: al
 * abrir un producto se vuelve a evaluar con el perfil y los datos actuales.
 */

export const HISTORY_LIMIT = 30;

export type HistoryEntry = {
  code: string;
  name: string | null;
  brands: string | null;
  scannedAt: string;
};

function storageKey(userId: string): string {
  return `safebite.product-history.${userId}`;
}

function isEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.code === "string" &&
    isValidBarcode(entry.code) &&
    (entry.name === null || typeof entry.name === "string") &&
    (entry.brands === null || typeof entry.brands === "string") &&
    typeof entry.scannedAt === "string"
  );
}

export async function getHistory(userId: string): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    // Un historial dañado no debe impedir usar el escáner.
    return [];
  }
}

/** Añade (o sube al principio) un producto. Devuelve el historial nuevo. */
export async function addToHistory(
  userId: string,
  entry: Omit<HistoryEntry, "scannedAt">,
  now: Date = new Date(),
): Promise<HistoryEntry[]> {
  const previous = await getHistory(userId);
  const next = [
    { ...entry, scannedAt: now.toISOString() },
    ...previous.filter((item) => item.code !== entry.code),
  ].slice(0, HISTORY_LIMIT);
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // Si no se puede guardar, el escaneo sigue funcionando.
  }
  return next;
}

export async function clearHistory(userId: string): Promise<void> {
  await AsyncStorage.removeItem(storageKey(userId));
}
