/**
 * Límites de la importación de cartas, compartidos por el navegador (que
 * prepara las imágenes) y el servidor (que los vuelve a comprobar).
 *
 * Vercel no acepta peticiones de más de 4,5 MB: 5 páginas de ~750 KB caben.
 */
export const MAX_PAGES = 5;
/** Tamaño máximo de cada página como data URL JPEG (caracteres ≈ bytes). */
export const MAX_IMAGE_CHARS = 1_000_000;
/** Lado mayor de cada página, en píxeles. */
export const MAX_IMAGE_SIDE = 1600;
