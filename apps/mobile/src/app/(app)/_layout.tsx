import { Stack } from "expo-router";
import { stackScreenOptions } from "@/lib/stack-options";

/**
 * Con sesión: la barra inferior de pestañas ((tabs)) y, por encima, las pantallas
 * de detalle (carta, producto, alergias, familia, cuenta…), con su flecha de volver.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
