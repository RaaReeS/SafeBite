import { Stack } from "expo-router";
import { colors } from "@/theme";

// Sin sesión, la app empieza en la pantalla de bienvenida.
export const unstable_settings = { anchor: "bienvenida" };

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="bienvenida" options={{ headerShown: false }} />
    </Stack>
  );
}
