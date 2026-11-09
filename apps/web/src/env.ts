// Variables de entorno públicas. Next solo las incluye en el bundle si se leen
// con su nombre literal (process.env.NEXT_PUBLIC_...), por eso no se itera.

function required(name: string, value: string | undefined): string {
  if (value === undefined || value === "") {
    throw new Error(`Falta la variable de entorno ${name}. Revisa .env.example.`);
  }
  return value;
}

export const env = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: required(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
  /** URL pública de la web, sin barra final. Se usa en los QR y en los emails de Auth. */
  siteUrl: required("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL).replace(/\/+$/, ""),
};
