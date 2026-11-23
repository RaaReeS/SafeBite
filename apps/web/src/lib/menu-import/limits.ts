/**
 * Límites de la importación de cartas, compartidos por el navegador (que
 * prepara las páginas) y el servidor (que los vuelve a comprobar).
 *
 * Las páginas viajan como archivos JPEG (binario) en un formulario. 5 páginas
 * de 700 KB son 3,5 MB, por debajo del límite de 4 MB de las Server Actions
 * (next.config.ts) y de los 4,5 MB de Vercel.
 */
export const MAX_PAGES = 5;
/** Tamaño máximo de cada página (JPEG), en bytes. */
export const MAX_IMAGE_BYTES = 700_000;
/** Lado mayor de cada página, en píxeles. */
export const MAX_IMAGE_SIDE = 1600;
/** Nombre del campo del formulario con las páginas. */
export const PAGE_FIELD = "page";
