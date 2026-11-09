import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/theme";

type CheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | undefined;
};

export function Checkbox({ label, checked, onChange, error }: CheckboxProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}
      >
        <View style={[styles.box, checked ? styles.boxChecked : null]}>
          {checked ? <Text style={styles.tick}>✓</Text> : null}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, minHeight: 44 },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  tick: { color: colors.primaryText, fontWeight: "700" },
  label: { flex: 1, fontSize: fontSize.md, color: colors.text },
  error: { fontSize: fontSize.sm, fontWeight: "600", color: colors.danger },
});
