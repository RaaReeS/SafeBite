import { Stack } from "expo-router";
import { stackScreenOptions } from "@/lib/stack-options";
import { useTheme } from "@/theme";

// Sin sesión, la app empieza en la pantalla de bienvenida.
export const unstable_settings = { anchor: "bienvenida" };

export default function AuthLayout() {
  const { colors } = useTheme();
  return (
    <Stack screenOptions={stackScreenOptions(colors)}>
      <Stack.Screen name="bienvenida" options={{ headerShown: false }} />
    </Stack>
  );
}
