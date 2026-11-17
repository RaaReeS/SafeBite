import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { tapFeedback } from "@/lib/haptics";
import { colors, fonts, spacing } from "@/theme";

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
        onPress={() => {
          tapFeedback();
          onChange(!checked);
        }}
        style={styles.row}
      >
        <View style={[styles.box, checked ? styles.boxChecked : null]}>
          {checked ? <Ionicons name="checkmark" size={18} color={colors.primaryText} /> : null}
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
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: 44 },
  box: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
  error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.danger, marginLeft: 38 },
});
