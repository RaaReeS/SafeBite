import { FILTER_STATUS_LABELS, type FilterStatus } from "@safebite/core";
import { StyleSheet, Text, View } from "react-native";
import { fonts, radius, spacing } from "@/theme";

// El estado se indica con texto y símbolo, no solo con color (daltonismo).
export const STATUS_STYLES: Record<
  FilterStatus,
  { symbol: string; background: string; text: string }
> = {
  no_apto: { symbol: "✕", background: "#dc2626", text: "#ffffff" },
  posibles_trazas: { symbol: "!", background: "#fbbf24", text: "#18181b" },
  sin_datos: { symbol: "?", background: "#5b6472", text: "#ffffff" },
  apto: { symbol: "✓", background: "#059669", text: "#ffffff" },
};

/** Etiqueta de estado. `label` sustituye al texto corto (p. ej. «2 platos aptos»). */
export function StatusBadge({
  status,
  large = false,
  label,
}: {
  status: FilterStatus;
  large?: boolean;
  label?: string;
}) {
  const style = STATUS_STYLES[status];
  const text = label ?? FILTER_STATUS_LABELS.es[status].short;
  return (
    <View
      style={[styles.badge, large ? styles.large : null, { backgroundColor: style.background }]}
      accessible
      accessibilityLabel={text}
    >
      <Text style={[styles.text, large ? styles.largeText : null, { color: style.text }]}>
        {`${style.symbol}  ${text}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  large: { alignSelf: "stretch", paddingVertical: spacing.lg, borderRadius: radius.md },
  text: { fontFamily: fonts.bold, fontSize: 13 },
  largeText: { fontSize: 20, textAlign: "center" },
});
