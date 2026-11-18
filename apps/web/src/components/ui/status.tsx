import { FILTER_STATUS_LABELS, type FilterStatus } from "@safebite/core";

/** Semáforo del filtro: color del tema más símbolo y texto (nunca solo color). */
export const STATUS_STYLES: Record<FilterStatus, { symbol: string; className: string }> = {
  no_apto: { symbol: "✕", className: "bg-status-no-apto text-on-status" },
  posibles_trazas: { symbol: "!", className: "bg-status-trazas text-on-status-trazas" },
  sin_datos: { symbol: "?", className: "bg-status-sin-datos text-on-status" },
  apto: { symbol: "✓", className: "bg-status-apto text-on-status" },
};

/** Etiqueta de estado. `label` sustituye al texto corto (p. ej. «2 platos aptos»). */
export function StatusBadge({ status, label }: { status: FilterStatus; label?: string }) {
  const { symbol, className } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${className}`}
    >
      <span aria-hidden="true">{symbol}</span>
      {label ?? FILTER_STATUS_LABELS.es[status].short}
    </span>
  );
}
