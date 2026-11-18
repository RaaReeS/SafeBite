/**
 * Apariencia elegida por el usuario en este navegador: «system» sigue al sistema
 * (sin atributo); «light» y «dark» ponen data-theme en <html> (ver globals.css).
 */
export type Appearance = "system" | "light" | "dark";

export const APPEARANCE_STORAGE_KEY = "safebite.appearance";

export function isAppearance(value: unknown): value is Appearance {
  return value === "system" || value === "light" || value === "dark";
}

/** Lo guardado en este navegador; «system» si no hay nada o no se puede leer. */
export function readAppearance(): Appearance {
  try {
    const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return isAppearance(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

// Pequeño almacén para useSyncExternalStore: todos los menús de la página
// muestran la misma elección y se enteran cuando cambia.
const listeners = new Set<() => void>();

export function subscribeAppearance(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** En el servidor no hay elección guardada: «Automático». */
export function serverAppearance(): Appearance {
  return "system";
}

/** Guarda la elección (si se puede) y avisa a los menús. */
export function storeAppearance(appearance: Appearance): void {
  try {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
  } catch {
    // Sin almacenamiento (modo privado): se aplica igualmente en esta página.
  }
  for (const listener of listeners) listener();
}

export function applyAppearance(appearance: Appearance): void {
  const root = document.documentElement;
  if (appearance === "system") delete root.dataset.theme;
  else root.dataset.theme = appearance;
}

/**
 * Script del <head>: aplica la elección guardada antes de pintar la página, así
 * no hay un destello del modo contrario al cargar. Solo acepta valores conocidos.
 */
export const APPEARANCE_BOOT_SCRIPT = `try{var a=localStorage.getItem(${JSON.stringify(
  APPEARANCE_STORAGE_KEY,
)});if(a==="light"||a==="dark")document.documentElement.dataset.theme=a}catch(e){}`;
