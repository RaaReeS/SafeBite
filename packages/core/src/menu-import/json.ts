/**
 * Final del objeto JSON que empieza en `start` (posición de su «{»), contando
 * llaves fuera de las cadenas. -1 si no se cierra: el trozo que sale entonces
 * (vacío) no es JSON y se descarta.
 */
function objectEnd(content: string, start: number): number {
  let depth = 0;
  let inString = false;
  // Stryker disable next-line EqualityOperator: content[length] es undefined y no cuenta.
  for (let index = start; index < content.length; index += 1) {
    const char = content[index];
    if (inString) {
      if (char === "\\") index += 1;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  // Stryker disable next-line UnaryOperator: con +1 el trozo tampoco es JSON (empieza en «{»).
  return -1;
}

function isMenu(value: unknown): value is { dishes: unknown[] } {
  return (
    typeof value === "object" && value !== null && "dishes" in value && Array.isArray(value.dishes)
  );
}

/**
 * La carta ({"dishes": [...]}) dentro de la respuesta de la IA, aunque venga
 * con texto alrededor (razonamiento, notas) que también tenga llaves. Prueba
 * cada objeto completo, de izquierda a derecha, y devuelve el primero que es
 * una carta; null si no hay ninguno.
 */
export function extractMenuJson(content: string): { dishes: unknown[] } | null {
  // Stryker disable next-line StringLiteral: empezar en 0 solo añade un trozo con texto delante, que no es JSON.
  for (let start = content.indexOf("{"); start !== -1; start = content.indexOf("{", start + 1)) {
    const end = objectEnd(content, start);
    try {
      const parsed: unknown = JSON.parse(content.slice(start, end + 1));
      if (isMenu(parsed)) return parsed;
    } catch {
      // No era un objeto JSON válido: se prueba desde la siguiente llave.
    }
  }
  return null;
}
