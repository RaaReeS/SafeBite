import "server-only";
import { MenuReaderError } from "./errors";
import { readPages, type MenuReader } from "./index";

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

/** Tamaño de la página con la que los tests simulan un error inesperado del servidor. */
export const FAKE_UNEXPECTED_SIDE = 4;

const FAKE_DISHES = [
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
];

/**
 * Lector simulado para los tests (MENU_READER=fake): cada página devuelve la
 * misma carta y nunca se llama a ningún servicio. Una página de 3×3 píxeles
 * simula que el servicio no responde; una de 4×4, un error inesperado. Un
 * texto con «FALLO», que el servicio no responde.
 */
export const fakeMenuReader: MenuReader = {
  async read(images) {
    return readPages(images, async (image) => {
      const size = jpegSize(image);
      if (size?.width === FAKE_FAILURE_SIDE && size.height === FAKE_FAILURE_SIDE) {
        throw new MenuReaderError("Lector simulado: fallo pedido por el test");
      }
      if (size?.width === FAKE_UNEXPECTED_SIDE && size.height === FAKE_UNEXPECTED_SIDE) {
        throw new Error("Lector simulado: error inesperado pedido por el test");
      }
      return FAKE_DISHES;
    });
  },
  async readText(text) {
    if (text.includes("FALLO")) {
      throw new MenuReaderError("Lector simulado: fallo pedido por el test");
    }
    return { dishes: FAKE_DISHES };
  },
};
