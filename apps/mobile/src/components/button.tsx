import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, fontSize, radius, spacing } from "@/theme";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "link" | "danger";
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !inactive ? styles.pressed : null,
        inactive ? styles.inactive : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.primaryText : colors.primary} />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.primary },
  secondary: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  danger: { backgroundColor: colors.danger },
  link: { minHeight: 44, paddingHorizontal: 0 },
  pressed: { opacity: 0.8 },
  inactive: { opacity: 0.6 },
  label: { fontSize: fontSize.lg, fontWeight: "600" },
  primaryLabel: { color: colors.primaryText },
  secondaryLabel: { color: colors.text },
  dangerLabel: { color: colors.primaryText },
  linkLabel: { color: colors.primary, textDecorationLine: "underline", fontWeight: "500" },
});
