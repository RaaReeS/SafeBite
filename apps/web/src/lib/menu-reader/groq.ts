import "server-only";
import { ALLERGENS } from "@safebite/core";
import { MenuReaderError } from "./errors";
import { readPages, type MenuReader } from "./index";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "qwen/qwen3.6-27b";
/** Por debajo de los 60 s que Vercel da a la función (maxDuration), con margen. */
const TIMEOUT_MS = 45_000;

/**
 * Instrucciones para el modelo. Solo lo que aparece en la carta; ante la duda,
 * nada: el restaurante revisa todo y los alérgenos solo son una propuesta.
 */
const INSTRUCTIONS = `Eres un asistente que lee cartas de restaurantes en España.
Te paso una página de la carta. Devuelve SOLO un objeto JSON con esta forma:
{"dishes":[{"name":string,"description":string|null,"price":string|number|null,"category":string|null,"ingredients":string|null,"allergens":[{"allergen":string,"level":"contains"|"may_contain"}]}]}

Reglas:
- Un elemento por cada plato o bebida que aparezca en la página. No inventes platos ni precios.
- "name": el nombre tal como aparece. "description": el texto que lo describe, si lo hay.
- "price": el precio en euros tal como aparece (por ejemplo "12,50 €"); null si no hay o hay varios.
- "category": la sección de la carta en la que está (por ejemplo "Entrantes"), si la hay.
- "ingredients": solo si la carta los enumera.
- "allergens": alérgenos que el plato contiene casi con seguridad por su nombre, descripción o ingredientes. Usa SOLO estos códigos: ${ALLERGENS.join(", ")}.
  "contains" si los lleva; "may_contain" si la carta indica trazas. Si no estás seguro, no pongas nada. Nunca indiques que un plato NO contiene algo.
- Si la página no es una carta o no tiene platos, devuelve {"dishes":[]}.`;

type GroqResponse = { choices?: { message?: { content?: unknown } }[] };

/**
 * El JSON de la respuesta, aunque el modelo añada texto alrededor. Si no se
 * puede leer, esa página se queda sin platos (las demás siguen).
 */
function extractJson(content: string): unknown {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start === -1 || end < start) return null;
  try {
    return JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function readPage(image: string, apiKey: string, model: string): Promise<unknown[]> {
  let response: Response;
  try {
    response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: INSTRUCTIONS },
          {
            role: "user",
            content: [
              { type: "text", text: "Lee esta página de la carta." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new MenuReaderError(`No se ha podido conectar con Groq: ${String(error)}`);
  }
  if (!response.ok) {
    throw new MenuReaderError(`Groq ha respondido ${response.status}`);
  }
  let body: GroqResponse;
  try {
    body = (await response.json()) as GroqResponse;
  } catch (error) {
    throw new MenuReaderError(`Respuesta de Groq ilegible: ${String(error)}`);
  }
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new MenuReaderError("Respuesta de Groq sin contenido");
  const parsed = extractJson(content);
  const dishes =
    typeof parsed === "object" && parsed !== null && "dishes" in parsed ? parsed.dishes : [];
  return Array.isArray(dishes) ? dishes : [];
}

/**
 * Groq (plan gratis, modelo con visión). Una petición por página: el modelo
 * admite pocas imágenes por petición y así una página no bloquea a las demás.
 */
export const groqMenuReader: MenuReader = {
  async read(images) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new MenuReaderError("Falta GROQ_API_KEY");
    const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
    return readPages(images, (image) => readPage(image, apiKey, model));
  },
};
