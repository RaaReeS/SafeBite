import "server-only";
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
  read(images: string[]): Promise<unknown>;
}

export function getMenuReader(): MenuReader {
  return process.env.MENU_READER === "fake" ? fakeMenuReader : groqMenuReader;
}
