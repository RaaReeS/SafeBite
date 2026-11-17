import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

type SessionContextValue = {
  session: Session | null;
  /** true mientras se recupera la sesión guardada al abrir la app. */
  isLoading: boolean;
  /**
   * true durante el cambio de contraseña con código: verificar el código abre
   * sesión, pero no hay que entrar en la app hasta guardar la contraseña nueva.
   */
  isRecoveringPassword: boolean;
  setRecoveringPassword: (value: boolean) => void;
  /** true si al abrir la app no se pudo recuperar la sesión a tiempo (sin conexión). */
  isOffline: boolean;
  /** Vuelve a intentar recuperar la sesión. */
  retry: () => void;
};

/** Si la sesión no se recupera en este tiempo, se ofrece reintentar. */
export const STARTUP_TIMEOUT_MS = 10_000;

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveringPassword, setRecoveringPassword] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setIsOffline(false);
    // Con la sesión caducada, recuperarla necesita al servidor: si no llega a
    // tiempo, se avisa en vez de dejar la pantalla de carga para siempre.
    const timer = setTimeout(() => {
      if (active) setIsOffline(true);
    }, STARTUP_TIMEOUT_MS);
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        // Si llega tarde (tras el aviso), se entra igualmente.
        setSession(data.session);
        setIsLoading(false);
        setIsOffline(false);
      })
      .catch(() => {
        if (active) setIsOffline(true);
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [attempt]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        isLoading,
        isRecoveringPassword,
        setRecoveringPassword,
        isOffline,
        retry: () => setAttempt((n) => n + 1),
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (value === null) throw new Error("useSession debe usarse dentro de SessionProvider");
  return value;
}
