import type { FilterStatus } from "@safebite/core";

/** Colores de los marcadores del mapa. El estado también va en texto, no solo en color. */
export const SUITABILITY_STYLES: Record<
  FilterStatus,
  { stroke: string; fill: string; symbol: string }
> = {
  apto: {
    stroke: "#047857",
    fill: "#10b981",
    symbol: "✓",
  },
  posibles_trazas: {
    stroke: "#b45309",
    fill: "#fbbf24",
    symbol: "!",
  },
  sin_datos: {
    stroke: "#3f3f46",
    fill: "#a1a1aa",
    symbol: "?",
  },
  no_apto: {
    stroke: "#991b1b",
    fill: "#ef4444",
    symbol: "✕",
  },
};
