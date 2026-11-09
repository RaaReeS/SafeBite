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
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecoveringPassword, setRecoveringPassword] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setIsLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{ session, isLoading, isRecoveringPassword, setRecoveringPassword }}
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
