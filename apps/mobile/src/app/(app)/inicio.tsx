import { Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { Button } from "@/components/button";
import { Screen } from "@/components/screen";
import { getMessages } from "@/i18n";
import { useSession } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { colors, fontSize } from "@/theme";

// Pantalla provisional con sesión: el perfil de alergias y la búsqueda llegan
// en los siguientes pasos de esta fase.
export default function HomeScreen() {
  const t = getMessages();
  const { session } = useSession();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false); // La app vuelve sola a la pantalla de bienvenida.
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t.common.appName }} />
      <Text style={styles.greeting}>{t.home.greeting(session?.user.email ?? "")}</Text>
      <Text style={styles.text}>{t.home.comingSoon}</Text>
      <Button
        label={t.auth.logout}
        variant="secondary"
        onPress={() => void signOut()}
        loading={loading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: fontSize.xl, fontWeight: "700", color: colors.text },
  text: { fontSize: fontSize.md, color: colors.textMuted },
});
