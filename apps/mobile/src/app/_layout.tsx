import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/ui";
import { getMessages } from "@/i18n";
import { useAppFonts } from "@/lib/fonts";
import { SessionProvider, useSession } from "@/lib/session";
import { colors, spacing } from "@/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

/**
 * Con sesión solo se accede a (app); sin sesión, solo a (auth). Es una barrera de
 * interfaz: la seguridad real está en Supabase (RLS), como en la web.
 */
function RootNavigator() {
  const t = getMessages();
  const { session, isLoading, isRecoveringPassword, isOffline, retry } = useSession();
  const fontsReady = useAppFonts();

  if (isLoading && isOffline) {
    return (
      <View style={styles.offline}>
        <EmptyState
          icon="cloud-offline-outline"
          title={t.common.offlineTitle}
          text={t.common.offlineText}
          action={<Button label={t.common.retry} icon="refresh" onPress={retry} />}
        />
      </View>
    );
  }

  if (isLoading || !fontsReady) {
    return (
      <View style={styles.loading} accessibilityLabel={t.common.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const signedIn = session !== null && !isRecoveringPassword;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  offline: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
});
