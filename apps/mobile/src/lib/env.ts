import Constants from "expo-constants";
import { hostFromHostUri, withDevHost } from "./dev-host";

// Variables públicas de Expo. Solo se incluyen si se leen con su nombre literal.

function required(name: string, value: string | undefined): string {
  if (value === undefined || value === "") {
    throw new Error(`Falta la variable de entorno ${name}. Revisa .env.example.`);
  }
  return value;
}

/**
 * En desarrollo, IP del PC tal como la ve el móvil (desde donde Expo Go ha
 * descargado la app). En la app publicada no hay: las direcciones no cambian.
 */
const devHost = __DEV__ ? hostFromHostUri(Constants.expoConfig?.hostUri) : null;

export const env = {
  supabaseUrl: withDevHost(
    required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
    devHost,
  ),
  supabasePublishableKey: required(
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  /** Web de SafeBite (términos, privacidad), sin barra final. */
  siteUrl: withDevHost(
    required("EXPO_PUBLIC_SITE_URL", process.env.EXPO_PUBLIC_SITE_URL),
    devHost,
  ).replace(/\/+$/, ""),
};
