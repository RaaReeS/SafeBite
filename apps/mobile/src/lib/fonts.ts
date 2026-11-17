import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { useEffect, useState } from "react";

/** Si la tipografía no carga en este tiempo, la app sigue con la del sistema. */
const FONT_TIMEOUT_MS = 4000;

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
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setGaveUp(true), FONT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);
  return loaded || error !== null || gaveUp;
}
