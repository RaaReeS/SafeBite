import "server-only";
import { MenuReaderError } from "./errors";
import type { MenuReader } from "./index";

/** Marcador que los tests ponen en una imagen para simular que el servicio falla. */
export const FAKE_FAILURE_MARKER = "RkFMTE8"; // «FALLO» en base64

/**
 * Lector simulado para los tests (MENU_READER=fake): devuelve siempre la misma
 * carta y nunca llama a ningún servicio.
 */
export const fakeMenuReader: MenuReader = {
  async read(images) {
    if (images.some((image) => image.includes(FAKE_FAILURE_MARKER))) {
      throw new MenuReaderError("Lector simulado: fallo pedido por el test");
    }
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
