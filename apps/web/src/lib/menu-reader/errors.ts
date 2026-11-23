/** El lector no ha podido leer la carta (servicio caído, límite agotado, sin clave…). */
export class MenuReaderError extends Error {
  override name = "MenuReaderError";
}
