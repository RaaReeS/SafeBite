import "react-native-url-polyfill/auto";
import type { Database } from "@safebite/core";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import { env } from "./env";
import { secureSessionStorage } from "./secure-session-storage";

/**
 * Cliente de Supabase de la app. Actúa con la sesión del usuario: todas las
 * consultas pasan por RLS (cada usuario solo ve su perfil y sus alergias).
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: secureSessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresca la sesión solo con la app en primer plano (recomendación de Supabase).
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
