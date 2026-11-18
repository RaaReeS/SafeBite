import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router";
import type { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/ui";
import { getMessages } from "@/i18n";
import { useAppFonts } from "@/lib/fonts";
import { SessionProvider, useSession } from "@/lib/session";
import { makeStyles, spacing, ThemeProvider, useTheme } from "@/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedNavigation>
          <SessionProvider>
            <RootNavigator />
          </SessionProvider>
        </ThemedNavigation>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * Colores de la navegación (fondo entre pantallas, cabeceras, pestañas) y de la
 * barra de estado según el modo claro u oscuro.
 */
function ThemedNavigation({ children }: { children: ReactNode }) {
  const { scheme, colors } = useTheme();
  const base = scheme === "dark" ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };
  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {children}
    </NavigationThemeProvider>
  );
}

/**
 * Con sesión solo se accede a (app); sin sesión, solo a (auth). Es una barrera de
 * interfaz: la seguridad real está en Supabase (RLS), como en la web.
 */
function RootNavigator() {
  const styles = useStyles();
  const { colors } = useTheme();
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
        <ActivityIndicator color={colors.accent} />
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

const useStyles = makeStyles(({ colors }) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    offline: {
      flex: 1,
      justifyContent: "center",
      padding: spacing.xl,
      backgroundColor: colors.background,
    },
  }),
);
