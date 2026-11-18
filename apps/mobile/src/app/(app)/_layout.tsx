import { Stack } from "expo-router";
import { stackScreenOptions } from "@/lib/stack-options";
import { useTheme } from "@/theme";

/**
 * Con sesión: la barra inferior de pestañas ((tabs)) y, por encima, las pantallas
 * de detalle (carta, producto, alergias, familia, cuenta…), con su flecha de volver.
 */
export default function AppLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={stackScreenOptions(colors)}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
