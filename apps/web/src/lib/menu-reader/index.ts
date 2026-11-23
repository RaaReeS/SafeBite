import "server-only";
import { MenuReaderError } from "./errors";
import { fakeMenuReader } from "./fake";
import { groqMenuReader } from "./groq";

export { MenuReaderError } from "./errors";

/**
 * Lector de cartas: recibe las páginas de la carta (imágenes JPEG en data URL)
 * y devuelve la respuesta del modelo sin validar (`{ dishes: [...] }`), que
 * valida `parseMenuResponse` de @safebite/core.
 *
 * Intercambiable: hoy Groq (plan gratis). Con MENU_READER=fake (tests) se usa
 * un lector simulado y no se llama a nadie.
 */
export interface MenuReader {
  /** Páginas de la carta como imágenes (data URL). */
  read(images: string[]): Promise<unknown>;
  /** Texto de la carta (pegado o sacado de su web o de un PDF). */
  readText(text: string): Promise<unknown>;
}

/**
 * Lee cada página por separado y junta los platos de las que salen bien: una
 * página que falla no hace perder las demás. Solo si fallan todas, error. Un
 * error que no es del lector (un fallo del código) se deja pasar.
 */
export async function readPages(
  images: string[],
  readPage: (image: string) => Promise<unknown[]>,
): Promise<{ dishes: unknown[] }> {
  const results = await Promise.allSettled(images.map(readPage));
  const unexpected = results.find(
    (result) => result.status === "rejected" && !(result.reason instanceof MenuReaderError),
  );
  if (unexpected?.status === "rejected") throw unexpected.reason;
  const pages = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
  if (pages.length === 0) throw new MenuReaderError("No se ha podido leer ninguna página");
  return { dishes: pages.flat() };
}

export function getMenuReader(): MenuReader {
  return process.env.MENU_READER === "fake" ? fakeMenuReader : groqMenuReader;
}
