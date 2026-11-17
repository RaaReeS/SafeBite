import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radius, shadow, spacing } from "@/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "link" | "danger";
  /** Icono opcional a la izquierda del texto (decorativo: el texto ya lo dice). */
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
};

const LABEL_COLOR = {
  primary: colors.primaryText,
  secondary: colors.text,
  link: colors.primary,
  danger: colors.danger,
} as const;

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
}: ButtonProps) {
  const inactive = disabled || loading;
  const color = LABEL_COLOR[variant];
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
        <ActivityIndicator color={color} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Ionicons name={icon} size={20} color={color} importantForAccessibility="no" />
          ) : null}
          <Text style={[styles.label, { color }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  primary: { backgroundColor: colors.primary, ...shadow.card },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: { backgroundColor: colors.dangerSoft },
  link: { minHeight: 44, paddingHorizontal: spacing.sm },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  inactive: { opacity: 0.55 },
  label: { fontFamily: fonts.semibold, fontSize: 16 },
});
