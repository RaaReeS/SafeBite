import "server-only";
import { MenuReaderError } from "./errors";
import type { MenuReader } from "./index";

/** Tamaño (en píxeles) de la imagen con la que los tests simulan que el servicio falla. */
export const FAKE_FAILURE_SIDE = 3;

/** Ancho y alto de un JPEG en data URL (de su cabecera SOF), o null. */
function jpegSize(dataUrl: string): { width: number; height: number } | null {
  const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  for (let i = 2; i + 9 < bytes.length;) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1] ?? 0;
    const length = bytes.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
    }
    i += 2 + length;
  }
  return null;
}

/**
 * Lector simulado para los tests (MENU_READER=fake): devuelve siempre la misma
 * carta y nunca llama a ningún servicio. Una página de 3×3 píxeles simula que
 * el servicio no responde.
 */
export const fakeMenuReader: MenuReader = {
  async read(images) {
    const failing = images.some((image) => {
      const size = jpegSize(image);
      return size?.width === FAKE_FAILURE_SIDE && size.height === FAKE_FAILURE_SIDE;
    });
    if (failing) throw new MenuReaderError("Lector simulado: fallo pedido por el test");
    return {
      dishes: [
        {
          name: "Gambas al ajillo",
          description: "Con guindilla",
          price: "12,50 €",
          category: "Entrantes",
          ingredients: null,
          allergens: [{ allergen: "crustaceans", level: "contains" }],
        },
        {
          name: "Ensalada verde",
          description: null,
          price: 8,
          category: "Entrantes",
          ingredients: "Lechuga, tomate",
          allergens: [],
        },
      ],
    };
  },
};
