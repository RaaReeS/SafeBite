import { Stack } from "expo-router";
import { stackScreenOptions } from "@/lib/stack-options";

// Sin sesión, la app empieza en la pantalla de bienvenida.
export const unstable_settings = { anchor: "bienvenida" };

export default function AuthLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="bienvenida" options={{ headerShown: false }} />
    </Stack>
  );
}
