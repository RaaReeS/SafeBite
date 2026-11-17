import { combineProfiles, type Allergen } from "@safebite/core";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getMessages } from "@/i18n";
import { getFamily } from "./family";
import { useHealthProfile } from "./use-health-profile";

/** Una persona para la que se filtra: «Yo» o un familiar. */
export type Person = { id: string; name: string; allergens: Allergen[] };

/** Id fijo de «Yo» (los familiares usan su uuid). */
export const ME = "yo";

/**
 * Personas del usuario («Yo» y su familia) y las elegidas en esta pantalla. Por
 * defecto, todas: un plato o restaurante apto lo es para toda la familia.
 * `allergens` son las de las elegidas, combinadas con core. Sin consentimiento
 * para datos de salud no hay personas (ni alergias).
 */
export function usePeople() {
  const t = getMessages();
  const { state: profileState, userId, reload: reloadProfile } = useHealthProfile();
  const consent = profileState.status === "ready" && profileState.profile.consentGivenAt !== null;
  const [family, setFamily] = useState<Person[] | null>(null);
  const [familyError, setFamilyError] = useState(false);

  const loadFamily = useCallback(async () => {
    if (userId === undefined || !consent) {
      setFamily([]);
      return;
    }
    try {
      setFamily((await getFamily(userId)).members);
      setFamilyError(false);
    } catch {
      // Sin la familia se sigue filtrando para «Yo»: nunca se pierde el perfil propio.
      setFamily([]);
      setFamilyError(true);
    }
  }, [userId, consent]);

  useFocusEffect(
    useCallback(() => {
      void loadFamily();
    }, [loadFamily]),
  );

  const people: Person[] | null = useMemo(() => {
    if (profileState.status !== "ready" || !consent || family === null) return null;
    return [{ id: ME, name: t.people.me, allergens: profileState.profile.allergens }, ...family];
  }, [profileState, consent, family, t]);

  const [selected, setSelected] = useState<string[] | null>(null);
  // Al cargar (o si cambia la familia), todas las personas quedan elegidas.
  const peopleKey = people?.map((p) => p.id).join(",") ?? "";
  useEffect(() => {
    setSelected(people?.map((p) => p.id) ?? null);
    // Solo cuando cambian las personas (no en cada recarga del perfil).
  }, [peopleKey]);

  const chosen = people?.filter((p) => selected?.includes(p.id)) ?? [];
  const allergens: Allergen[] = combineProfiles(chosen.map((p) => p.allergens));

  function toggle(id: string) {
    setSelected((current) => {
      if (current === null) return current;
      // Siempre queda al menos una persona elegida.
      if (current.includes(id))
        return current.length === 1 ? current : current.filter((x) => x !== id);
      return [...current, id];
    });
  }

  return {
    profileState,
    userId,
    consent,
    people,
    selected: selected ?? [],
    toggle,
    allergens,
    chosenNames: chosen.map((p) => p.name),
    familyError,
    reload: async () => {
      await reloadProfile();
      await loadFamily();
    },
  };
}
