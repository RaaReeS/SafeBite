import { ALLERGENS, ALLERGEN_LABELS } from "@safebite/core";
import { Stack } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { getMessages } from "@/i18n";
import { colors, fontSize, spacing } from "@/theme";

// Pantalla provisional: la navegación real (acceso, perfil, búsqueda) llega en
// los siguientes pasos de esta fase.
export default function HomeScreen() {
  const t = getMessages();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: t.common.appName }} />
      <Text style={styles.title}>{t.home.title}</Text>
      <Text style={styles.description}>{t.home.description}</Text>
      {ALLERGENS.map((allergen) => (
        <Text key={allergen} style={styles.item}>
          {ALLERGEN_LABELS.es[allergen]}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: "700", color: colors.text },
  description: { fontSize: fontSize.md, color: colors.textMuted, marginBottom: spacing.md },
  item: { fontSize: fontSize.md, color: colors.text },
});
