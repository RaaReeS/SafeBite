// Variables públicas de Expo. Solo se incluyen si se leen con su nombre literal.

function required(name: string, value: string | undefined): string {
  if (value === undefined || value === "") {
    throw new Error(`Falta la variable de entorno ${name}. Revisa .env.example.`);
  }
  return value;
}

export const env = {
  supabaseUrl: required("EXPO_PUBLIC_SUPABASE_URL", process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: required(
    "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  /** Web de SafeBite (términos, privacidad), sin barra final. */
  siteUrl: required("EXPO_PUBLIC_SITE_URL", process.env.EXPO_PUBLIC_SITE_URL).replace(/\/+$/, ""),
};
