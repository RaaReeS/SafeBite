/** Tiempo máximo de una petición al servidor antes de darla por fallida. */
export const REQUEST_TIMEOUT_MS = 20_000;

/**
 * fetch que se corta si el servidor no responde a tiempo. Sin esto, con una red
 * que no llega al servidor la petición puede quedarse esperando más de un minuto
 * y la pantalla, cargando. Respeta la señal de cancelación de quien llama.
 */
export function createFetchWithTimeout(
  baseFetch: typeof fetch,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): typeof fetch {
  return async (input, init) => {
    const outer = init?.signal;
    // Ya cancelada: ni se envía.
    if (outer?.aborted) throw outer.reason ?? new Error("aborted");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);
    const forward = () => controller.abort(outer?.reason);
    outer?.addEventListener("abort", forward);
    try {
      return await baseFetch(input, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
      outer?.removeEventListener("abort", forward);
    }
  };
}
