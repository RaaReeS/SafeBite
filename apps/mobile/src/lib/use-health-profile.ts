import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { getHealthProfile, type HealthProfile } from "./profile";
import { useSession } from "./session";

type State =
  { status: "loading" } | { status: "ready"; profile: HealthProfile } | { status: "error" };

/** Perfil de salud del usuario con sesión. Se recarga cada vez que la pantalla se muestra. */
export function useHealthProfile() {
  const { session } = useSession();
  const userId = session?.user.id;
  const [state, setState] = useState<State>({ status: "loading" });

  const reload = useCallback(async () => {
    if (userId === undefined) return;
    try {
      setState({ status: "ready", profile: await getHealthProfile(userId) });
    } catch {
      setState({ status: "error" });
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { state, reload, userId };
}
