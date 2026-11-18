import { Icon } from "@/components/icon";
import { StyleSheet, Text, View } from "react-native";
import type { IconName } from "@/components/button";
import { fonts, makeStyles, radius, spacing, useTheme, type ThemeColors } from "@/theme";

type Tone = "info" | "success" | "warning" | "error";

function tones(
  colors: ThemeColors,
): Record<Tone, { background: string; text: string; icon: IconName }> {
  return {
    info: { background: colors.infoBackground, text: colors.infoText, icon: "information-circle" },
    success: {
      background: colors.successBackground,
      text: colors.successText,
      icon: "checkmark-circle",
    },
    warning: { background: colors.warningBackground, text: colors.warningText, icon: "warning" },
    error: { background: colors.dangerSoft, text: colors.errorText, icon: "alert-circle" },
  };
}

/** Aviso. Los errores se anuncian de inmediato a VoiceOver/TalkBack. */
export function Notice({ tone = "info", text }: { tone?: Tone; text: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const palette = tones(colors)[tone];
  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : "text"}
      accessibilityLiveRegion={tone === "error" ? "assertive" : "polite"}
      style={[styles.box, { backgroundColor: palette.background }]}
    >
      <Icon name={palette.icon} size={20} color={palette.text} style={styles.icon} />
      <Text style={[styles.text, { color: palette.text }]}>{text}</Text>
    </View>
  );
}

const useStyles = makeStyles(() =>
  StyleSheet.create({
    box: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.sm,
      borderRadius: radius.md,
      padding: spacing.lg,
    },
    icon: { marginTop: 1 },
    text: { flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  }),
);
