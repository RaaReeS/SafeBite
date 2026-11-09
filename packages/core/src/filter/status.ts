/**
 * Resultado del filtro de alérgenos para un plato o producto y un usuario.
 *
 * Los identificadores van en español por decisión expresa (excepción a la
 * convención de identificadores en inglés): coinciden con la especificación.
 *
 * Ordenados de más a menos grave. Prioridad:
 * no_apto > posibles_trazas > sin_datos > apto. Ante la duda, nunca apto.
 */
export const FILTER_STATUSES = ["no_apto", "posibles_trazas", "sin_datos", "apto"] as const;

export type FilterStatus = (typeof FILTER_STATUSES)[number];

export function isFilterStatus(value: unknown): value is FilterStatus {
  return typeof value === "string" && (FILTER_STATUSES as readonly string[]).includes(value);
}

/**
 * Comparador para `Array.prototype.sort`: ordena de menos a más grave, de modo
 * que los platos aptos aparecen primero. FILTER_STATUSES va de más a menos
 * grave, así que un índice menor significa más gravedad.
 */
export function compareStatus(a: FilterStatus, b: FilterStatus): number {
  return FILTER_STATUSES.indexOf(b) - FILTER_STATUSES.indexOf(a);
}

/**
 * Devuelve el estado más grave de la lista. Una lista vacía no aporta
 * información, así que el resultado es `sin_datos`, nunca `apto`
 * (Math.min() sin argumentos es Infinity, que no es un índice válido).
 */
export function mostSevereStatus(statuses: readonly FilterStatus[]): FilterStatus {
  const worstIndex = Math.min(...statuses.map((status) => FILTER_STATUSES.indexOf(status)));
  return FILTER_STATUSES[worstIndex] ?? "sin_datos";
}
