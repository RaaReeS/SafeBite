import { ALLERGEN_LABELS, FILTER_DISCLAIMER } from "@safebite/core";
import { Stack, useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { getMessages } from "@/i18n";
import { useSession } from "@/lib/session";
import { useHealthProfile } from "@/lib/use-health-profile";
import { colors, fontSize, radius, spacing } from "@/theme";

export default function HomeScreen() {
  const t = getMessages();
  const router = useRouter();
  const { session } = useSession();
  const { state, reload } = useHealthProfile();

  return (
    <Screen>
      <Stack.Screen options={{ title: t.common.appName }} />
      <Text style={styles.greeting} accessibilityRole="header">
        {t.home.greeting(session?.user.email ?? "")}
      </Text>

      <Button label={t.search.open} onPress={() => router.push("/buscar")} />
      <Button label={t.scanner.open} variant="secondary" onPress={() => router.push("/escanear")} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.home.allergiesTitle}</Text>
        {state.status === "loading" ? (
          <ActivityIndicator color={colors.primary} accessibilityLabel={t.common.loading} />
        ) : null}
        {state.status === "error" ? (
          <>
            <Notice tone="error" text={t.home.loadError} />
            <Button label={t.home.retry} variant="secondary" onPress={() => void reload()} />
          </>
        ) : null}
        {state.status === "ready" && state.profile.consentGivenAt === null ? (
          <>
            <Text style={styles.text}>{t.home.noConsent}</Text>
            <Button label={t.home.configure} onPress={() => router.push("/alergias")} />
          </>
        ) : null}
        {state.status === "ready" && state.profile.consentGivenAt !== null ? (
          <>
            <Text style={styles.text}>
              {state.profile.allergens.length === 0
                ? t.home.noAllergies
                : t.home.yourAllergies(
                    state.profile.allergens.map((a) => ALLERGEN_LABELS.es[a]).join(", "),
                  )}
            </Text>
            <Button
              label={t.home.edit}
              variant="secondary"
              onPress={() => router.push("/alergias")}
            />
          </>
        ) : null}
      </View>

      <Button label={t.home.account} variant="link" onPress={() => router.push("/cuenta")} />
      <Text style={styles.disclaimer}>{FILTER_DISCLAIMER.es}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.text },
  text: { fontSize: fontSize.md, color: colors.text },
  disclaimer: { fontSize: fontSize.sm, color: colors.textMuted },
});
