import type { Allergen } from "./allergens";

/**
 * Iconos propios de SafeBite (dibujados para este proyecto) como DATOS, sin
 * React, para que la web (SVG) y la app (react-native-svg) dibujen exactamente
 * lo mismo. Son decorativos: siempre se muestran junto al nombre del alérgeno.
 *
 * Lienzo de 24×24, trazo de 1.6 con extremos y uniones redondeados, sin relleno
 * (salvo las formas marcadas con `filled`).
 */

export const ALLERGEN_ICON_VIEWBOX = "0 0 24 24";
export const ALLERGEN_ICON_STROKE_WIDTH = 1.6;

export type IconShape =
  | { type: "path"; d: string }
  | { type: "circle"; cx: number; cy: number; r: number; filled?: boolean };

const path = (d: string): IconShape => ({ type: "path", d });
const circle = (cx: number, cy: number, r: number, filled = false): IconShape => ({
  type: "circle",
  cx,
  cy,
  r,
  filled,
});

export const ALLERGEN_ICONS: Record<Allergen, readonly IconShape[]> = {
  // Espiga de trigo.
  gluten: [
    path("M12 21V8"),
    path("M12 8c-2-1-3-3-3-5 2 1 3 3 3 5Zm0 0c2-1 3-3 3-5-2 1-3 3-3 5Z"),
    path(
      "M12 13c-2-1-3.5-2.5-3.5-4.5 2 .5 3.5 2.5 3.5 4.5Zm0 0c2-1 3.5-2.5 3.5-4.5-2 .5-3.5 2.5-3.5 4.5Z",
    ),
    path(
      "M12 18c-2-1-3.5-2.5-3.5-4.5 2 .5 3.5 2.5 3.5 4.5Zm0 0c2-1 3.5-2.5 3.5-4.5-2 .5-3.5 2.5-3.5 4.5Z",
    ),
  ],
  // Gamba: cuerpo curvado en forma de C, segmentos, cola en abanico y antenas.
  crustaceans: [
    path("M16 4c-5 0-9 3.6-9 8.5 0 3.1 2.2 5.5 5.2 5.5"),
    path("M16 8.2c-3 0-5 2-5 4.3 0 1.4.8 2.3 1.9 2.3"),
    path("M16 4v4.2M9.3 8.4l2.6 2.2M7.2 12.6h3.8M8.4 16.3l3-1.6"),
    path("M12.2 18l-2.7 3.2M12.2 18l.9 3.6M12.9 14.8l2.6 2.9"),
    path("M16 4c2.4 0 4.3 1 5.5 3M16 6c2 .4 3.4 1.7 4.2 3.6"),
  ],
  // Huevo.
  eggs: [path("M12 3c-3.5 0-6.5 6-6.5 10a6.5 6.5 0 0 0 13 0C18.5 9 15.5 3 12 3Z")],
  // Pez.
  fish: [path("M3 12c3-5 9-6.5 13-3l4-3v12l-4-3c-4 3.5-10 2-13-3Z"), circle(8, 11, 0.8, true)],
  // Cáscara de cacahuete: dos lóbulos con cintura y textura.
  peanuts: [
    path(
      "M12 2.5a4.2 4.2 0 0 1 4.2 4.2c0 1.6-.8 2.6-1.6 3.4-.6.6-.6 1.7 0 2.3.9.9 1.6 2.1 1.6 3.8a4.2 4.2 0 0 1-8.4 0c0-1.7.7-2.9 1.6-3.8.6-.6.6-1.7 0-2.3-.8-.8-1.6-1.8-1.6-3.4A4.2 4.2 0 0 1 12 2.5Z",
    ),
    path("M10.5 6h.01M13.5 7.5h.01M10.8 16h.01M13.4 14.8h.01M12 18.3h.01"),
  ],
  // Vaina de soja.
  soybeans: [
    path("M4 17C6 8 13 4 20 4c0 7-4 14-13 16l-3-3Z"),
    circle(9, 15, 1.6),
    circle(12.5, 11, 1.6),
    circle(16, 7.5, 1.6),
  ],
  // Botella de leche.
  milk: [path("M9 2h6v3l2 3v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8l2-3V2Z"), path("M7 12h10")],
  // Bellota (frutos de cáscara).
  nuts: [
    path("M5 10h14a7 7 0 0 1-7 11 7 7 0 0 1-7-11Z"),
    path("M4 10a8 5 0 0 1 16 0Z"),
    path("M12 5V2.5"),
  ],
  // Tallos de apio con hojas.
  celery: [
    path("M8 22V10m4 12V8m4 14V10"),
    path("M8 10 6 6m2 4 2-4m2 2-2-5m2 5 2-5m2 7-2-4m2 4 2-4"),
  ],
  // Bote dosificador de mostaza.
  mustard: [path("M8 8h8l1 13H7L8 8Z"), path("M10 8V5h4v3M11 5l1-3 1 3"), path("M8.5 13h7")],
  // Semillas de sésamo.
  sesame: [
    path("M7 6c1.5 1 1.5 4 0 5-1.5-1-1.5-4 0-5Z"),
    path("M16 5c1.5 1 1.5 4 0 5-1.5-1-1.5-4 0-5Z"),
    path("M11.5 12c1.5 1 1.5 4 0 5-1.5-1-1.5-4 0-5Z"),
    path("M6 16c1.5 1 1.5 4 0 5-1.5-1-1.5-4 0-5Z"),
    path("M17 15c1.5 1 1.5 4 0 5-1.5-1-1.5-4 0-5Z"),
  ],
  // Copa de vino (sulfitos).
  sulphites: [
    path("M7 3h10l-1 6a4 4 0 0 1-8 0L7 3Z"),
    path("M12 13v7m-3.5 1h7"),
    path("M7.6 7h8.8"),
  ],
  // Espiga de flores de altramuz.
  lupin: [
    path("M12 22V9"),
    circle(12, 4, 1.3),
    circle(10, 7, 1.4),
    circle(14, 7, 1.4),
    circle(9.5, 10.5, 1.5),
    circle(14.5, 10.5, 1.5),
    path("M12 18c-2 0-4-1.5-5-3m5 3c2 0 4-1.5 5-3"),
  ],
  // Concha de vieira (moluscos).
  molluscs: [
    path("M12 20 4 11a8 8 0 0 1 16 0l-8 9Z"),
    path("M12 20V5m0 15-4.5-12M12 20l4.5-12M12 20 5 10.5M12 20l7-9.5"),
  ],
};
