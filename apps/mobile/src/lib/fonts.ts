import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";

/**
 * Carga la tipografía Inter (los nombres coinciden con `fonts` del tema).
 * Devuelve true cuando está lista; si falla, la app sigue con la del sistema.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  return loaded || error !== null;
}
