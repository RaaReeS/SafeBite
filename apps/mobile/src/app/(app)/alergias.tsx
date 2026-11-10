import { ALLERGENS, ALLERGEN_LABELS, type Allergen } from "@safebite/core";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Notice } from "@/components/notice";
import { Screen } from "@/components/screen";
import { getMessages } from "@/i18n";
import { env } from "@/lib/env";
import { giveHealthConsent, saveMyAllergens } from "@/lib/profile";
import { useHealthProfile } from "@/lib/use-health-profile";
import { colors, fontSize, spacing } from "@/theme";

export default function AllergiesScreen() {
  const t = getMessages();
  const { state, reload, userId } = useHealthProfile();

  return (
    <Screen>
      <Stack.Screen options={{ title: t.allergies.title }} />
      {state.status === "loading" ? (
        <ActivityIndicator color={colors.primary} accessibilityLabel={t.common.loading} />
      ) : null}
      {state.status === "error" ? (
        <>
          <Notice tone="error" text={t.home.loadError} />
          <Button label={t.home.retry} variant="secondary" onPress={() => void reload()} />
        </>
      ) : null}
      {state.status === "ready" && state.profile.consentGivenAt === null && userId ? (
        <ConsentForm userId={userId} onConsent={() => void reload()} />
      ) : null}
      {state.status === "ready" && state.profile.consentGivenAt !== null ? (
        <AllergenSelector initial={state.profile.allergens} />
      ) : null}
    </Screen>
  );
}

/** Consentimiento explícito e informado para datos de salud (RGPD, art. 9). */
function ConsentForm({ userId, onConsent }: { userId: string; onConsent: () => void }) {
  const t = getMessages();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function accept() {
    setError(false);
    setLoading(true);
    try {
      await giveHealthConsent(userId);
      onConsent();
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Text style={styles.title} accessibilityRole="header">
        {t.consent.title}
      </Text>
      <Text style={styles.text}>{t.consent.intro}</Text>
      <View style={styles.points}>
        {t.consent.points.map((point) => (
          <Text key={point} style={styles.text}>
            {`•  ${point}`}
          </Text>
        ))}
      </View>
      <Button
        variant="link"
        label={t.consent.privacy}
        onPress={() => void Linking.openURL(`${env.siteUrl}/privacidad`)}
      />
      {error ? <Notice tone="error" text={t.account.error} /> : null}
      <Checkbox label={t.consent.checkbox} checked={checked} onChange={setChecked} />
      <Button
        label={t.consent.accept}
        onPress={() => void accept()}
        disabled={!checked}
        loading={loading}
      />
    </>
  );
}

function AllergenSelector({ initial }: { initial: Allergen[] }) {
  const t = getMessages();
  const router = useRouter();
  const [selected, setSelected] = useState<Allergen[]>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => setSelected(initial), [initial]);

  const toggle = (allergen: Allergen, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, allergen] : current.filter((a) => a !== allergen),
    );

  async function save() {
    setError(false);
    setLoading(true);
    try {
      await saveMyAllergens(selected);
      // Sin pantalla anterior (p. ej. abierta con un enlace), se vuelve al inicio.
      if (router.canGoBack()) router.back();
      else router.replace("/inicio");
    } catch {
      // El guardado es atómico: si falla, el perfil anterior sigue intacto.
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Text style={styles.text}>{t.allergies.description}</Text>
      {error ? <Notice tone="error" text={t.allergies.saveError} /> : null}
      <View style={styles.list}>
        {ALLERGENS.map((allergen) => (
          <Checkbox
            key={allergen}
            label={ALLERGEN_LABELS.es[allergen]}
            checked={selected.includes(allergen)}
            onChange={(checked) => toggle(allergen, checked)}
          />
        ))}
      </View>
      <Button label={t.allergies.save} onPress={() => void save()} loading={loading} />
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  text: { fontSize: fontSize.md, color: colors.text },
  points: { gap: spacing.sm },
  list: { gap: spacing.xs },
});
