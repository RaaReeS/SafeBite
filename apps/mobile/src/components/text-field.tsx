import { useState } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/theme";

type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | undefined;
};

export function TextField({
  label,
  hint,
  error,
  style,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        placeholderTextColor={colors.textSubtle}
        style={[
          styles.input,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          style,
        ]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) =>
  StyleSheet.create({
    container: { gap: spacing.sm },
    label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
    input: {
      minHeight: 52,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontFamily: fonts.regular,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.card,
    },
    inputFocused: { borderColor: colors.accent },
    inputError: { borderColor: colors.danger },
    hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
    error: { fontFamily: fonts.semibold, fontSize: 13, color: colors.danger },
  }),
);
