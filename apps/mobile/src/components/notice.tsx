import { StyleSheet, Text, View } from "react-native";
import { colors, fontSize, radius, spacing } from "@/theme";

type Tone = "info" | "success" | "warning" | "error";

const TONES: Record<Tone, { background: string; border: string; text: string }> = {
  info: { background: "#f0f9ff", border: "#7dd3fc", text: "#082f49" },
  success: { background: "#ecfdf5", border: "#6ee7b7", text: "#022c22" },
  warning: {
    background: colors.warningBackground,
    border: colors.warningBorder,
    text: colors.warningText,
  },
  error: { background: "#fef2f2", border: "#fca5a5", text: "#450a0a" },
};

/** Aviso. Los errores se anuncian de inmediato a VoiceOver/TalkBack. */
export function Notice({ tone = "info", text }: { tone?: Tone; text: string }) {
  const palette = TONES[tone];
  return (
    <View
      accessibilityRole={tone === "error" ? "alert" : "text"}
      accessibilityLiveRegion={tone === "error" ? "assertive" : "polite"}
      style={[styles.box, { backgroundColor: palette.background, borderColor: palette.border }]}
    >
      <Text style={[styles.text, { color: palette.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.md },
  text: { fontSize: fontSize.md },
});
