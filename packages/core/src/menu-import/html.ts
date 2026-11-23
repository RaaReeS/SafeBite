/** Entidades con nombre habituales en cartas españolas. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  euro: "€",
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  ntilde: "ñ",
  Ntilde: "Ñ",
  uuml: "ü",
  iexcl: "¡",
  iquest: "¿",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, body: string) => {
    if (body.startsWith("#")) {
      const code =
        body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : Number(body.slice(1));
      return code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    }
    return NAMED_ENTITIES[body] ?? entity;
  });
}

/** Elementos cuyo contenido no es texto de la carta. */
const HIDDEN = /<(script|style|noscript|svg|template|iframe|head)\b[\s\S]*?<\/\1\s*>/gi;
/** Etiquetas que separan bloques (cada una, un salto de línea). */
const BLOCK =
  /<\/?(p|div|br|li|ul|ol|tr|table|h[1-6]|section|article|header|footer|main|nav|aside|dt|dd|dl|blockquote|pre|hr)\b[^>]*>/gi;

/**
 * Texto de una página web para que el modelo lea la carta: sin scripts,
 * estilos ni etiquetas, con un salto por bloque, espacios unidos y entidades
 * descodificadas. No ejecuta nada: es solo texto.
 */
export function htmlToText(html: string): string {
  // En HTML, los saltos del código son espacios: los saltos los ponen los bloques.
  // Stryker disable next-line Regex: «\s» y «\s+» con /g dan el mismo texto final.
  const flat = html.replace(/\s+/g, " ");
  const text = flat
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(HIDDEN, "\n")
    .replace(BLOCK, "\n")
    .replace(/<[^>]*>/g, " ");
  return decodeEntities(text)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line !== "")
    .join("\n");
}
