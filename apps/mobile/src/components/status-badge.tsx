import { FILTER_STATUS_LABELS, type FilterStatus } from "@safebite/core";
import { StyleSheet, Text, View } from "react-native";
import { fontSize, radius, spacing } from "@/theme";

// El estado se indica con texto y símbolo, no solo con color (daltonismo).
export const STATUS_STYLES: Record<
  FilterStatus,
  { symbol: string; background: string; text: string }
> = {
  no_apto: { symbol: "✕", background: "#b91c1c", text: "#ffffff" },
  posibles_trazas: { symbol: "!", background: "#fbbf24", text: "#18181b" },
  sin_datos: { symbol: "?", background: "#52525b", text: "#ffffff" },
  apto: { symbol: "✓", background: "#047857", text: "#ffffff" },
};

export function StatusBadge({ status, large = false }: { status: FilterStatus; large?: boolean }) {
  const style = STATUS_STYLES[status];
  const label = FILTER_STATUS_LABELS.es[status].short;
  return (
    <View
      style={[styles.badge, large ? styles.large : null, { backgroundColor: style.background }]}
      accessible
      accessibilityLabel={label}
    >
      <Text style={[styles.text, large ? styles.largeText : null, { color: style.text }]}>
        {`${style.symbol}  ${label}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  large: { alignSelf: "stretch", paddingVertical: spacing.md, borderRadius: radius.md },
  text: { fontSize: fontSize.sm, fontWeight: "700" },
  largeText: { fontSize: fontSize.xl, textAlign: "center" },
});
