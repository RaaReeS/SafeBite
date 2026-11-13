import type { FilterStatus } from "@safebite/core";

/** Colores del mapa y de la lista. El estado también va en texto, no solo en color. */
export const SUITABILITY_STYLES: Record<
  FilterStatus,
  { stroke: string; fill: string; badge: string; symbol: string }
> = {
  apto: {
    stroke: "#047857",
    fill: "#10b981",
    badge: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
    symbol: "✓",
  },
  posibles_trazas: {
    stroke: "#b45309",
    fill: "#fbbf24",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
    symbol: "!",
  },
  sin_datos: {
    stroke: "#3f3f46",
    fill: "#a1a1aa",
    badge: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    symbol: "?",
  },
  no_apto: {
    stroke: "#991b1b",
    fill: "#ef4444",
    badge: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
    symbol: "✕",
  },
};
