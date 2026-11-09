import { FILTER_DISCLAIMER } from "@safebite/core";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { getMessages } from "@/i18n";
import { colors, fontSize, spacing } from "@/theme";

export default function WelcomeScreen() {
  const t = getMessages();
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.title} accessibilityRole="header">
          {t.common.appName}
        </Text>
        <Text style={styles.tagline}>{t.common.tagline}</Text>
      </View>
      <Button label={t.welcome.register} onPress={() => router.push("/registro")} />
      <Button label={t.welcome.login} variant="secondary" onPress={() => router.push("/login")} />
      <Text style={styles.disclaimer}>{FILTER_DISCLAIMER.es}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.sm, marginTop: spacing.xxl * 2, marginBottom: spacing.xl },
  title: { fontSize: 40, fontWeight: "800", color: colors.primary },
  tagline: { fontSize: fontSize.lg, color: colors.text },
  disclaimer: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.lg },
});
