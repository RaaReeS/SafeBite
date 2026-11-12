import AsyncStorage from "@react-native-async-storage/async-storage";
import { isValidBarcode, type OffProduct } from "@safebite/core";

/**
 * Historial de productos escaneados, guardado SOLO en el móvil (nunca se sube
 * al servidor) y por usuario.
 *
 * Se guardan los datos del producto tal como los dio Open Food Facts, pero NO
 * el resultado del semáforo: se calcula al mostrarlo con el perfil actual, así
 * que si el usuario cambia sus alergias el historial se actualiza solo.
 */

export const HISTORY_LIMIT = 30;

export type HistoryEntry = Omit<OffProduct, "ingredientsText"> & { scannedAt: string };

function storageKey(userId: string): string {
  return `safebite.product-history.${userId}`;
}

function optionalTags(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((tag) => typeof tag === "string")
    ? (value as string[])
    : null;
}

function nullableText(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : undefined;
}

/** Valida una entrada leída del almacenamiento. Devuelve null si no es válida. */
function toEntry(value: unknown): HistoryEntry | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  const name = nullableText(raw.name);
  const brands = nullableText(raw.brands);
  if (
    typeof raw.code !== "string" ||
    !isValidBarcode(raw.code) ||
    name === undefined ||
    brands === undefined ||
    typeof raw.scannedAt !== "string"
  ) {
    return null;
  }
  const imageUrl = nullableText(raw.imageUrl);
  return {
    code: raw.code,
    name,
    brands,
    imageUrl: typeof imageUrl === "string" && imageUrl.startsWith("https://") ? imageUrl : null,
    // Sin datos de alérgenos (p. ej. entradas antiguas), el semáforo sale "sin datos".
    allergensTags: optionalTags(raw.allergensTags),
    tracesTags: optionalTags(raw.tracesTags),
    statesTags: optionalTags(raw.statesTags),
    scannedAt: raw.scannedAt,
  };
}

export async function getHistory(userId: string): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(toEntry).filter((entry): entry is HistoryEntry => entry !== null);
  } catch {
    // Un historial dañado no debe impedir usar el escáner.
    return [];
  }
}

/** Añade (o sube al principio) un producto. Devuelve el historial nuevo. */
export async function addToHistory(
  userId: string,
  product: OffProduct,
  now: Date = new Date(),
): Promise<HistoryEntry[]> {
  // El texto de ingredientes no hace falta en el historial: no se guarda.
  const entry: HistoryEntry = {
    code: product.code,
    name: product.name,
    brands: product.brands,
    imageUrl: product.imageUrl,
    allergensTags: product.allergensTags,
    tracesTags: product.tracesTags,
    statesTags: product.statesTags,
    scannedAt: now.toISOString(),
  };
  const previous = await getHistory(userId);
  const next = [entry, ...previous.filter((item) => item.code !== product.code)].slice(
    0,
    HISTORY_LIMIT,
  );
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // Si no se puede guardar, el escaneo sigue funcionando.
  }
  return next;
}

/** Producto de una entrada del historial, para evaluarlo con el filtro de core. */
export function historyProduct(entry: HistoryEntry): OffProduct {
  return {
    code: entry.code,
    name: entry.name,
    brands: entry.brands,
    imageUrl: entry.imageUrl,
    ingredientsText: null,
    allergensTags: entry.allergensTags,
    tracesTags: entry.tracesTags,
    statesTags: entry.statesTags,
  };
}

export async function clearHistory(userId: string): Promise<void> {
  await AsyncStorage.removeItem(storageKey(userId));
}
