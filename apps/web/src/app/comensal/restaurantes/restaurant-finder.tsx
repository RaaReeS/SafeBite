"use client";

import {
  combineProfiles,
  formatDistance,
  sortByDistance,
  suitabilityByRestaurant,
  type Coordinates,
  type FilterStatus,
} from "@safebite/core";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import type { Person } from "@/lib/data/health-profile";
import type { PublicMenus, PublishedRestaurant } from "@/lib/data/published-restaurants";
import { SUITABILITY_STYLES } from "./suitability";

// MapLibre usa `window` y WebGL: el mapa solo se carga en el navegador.
const RestaurantMap = dynamic(() => import("./restaurant-map"), { ssr: false });

type LocationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ready"; origin: Coordinates }
  | { status: "denied" | "unavailable" };

/** Compara sin mayúsculas ni tildes: «Zaragoza», «zaragoza» y «ZARAGOZA» coinciden. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function RestaurantFinder({
  restaurants,
  people,
  menus,
}: {
  restaurants: PublishedRestaurant[];
  /** «Yo» y su familia, con sus alergias; null si no ha dado el consentimiento. */
  people: Person[] | null;
  /** Cartas públicas, para calcular aquí dónde puede comer el grupo elegido. */
  menus: PublicMenus;
}) {
  const t = getMessages();
  // Por defecto, para todas las personas: un sitio apto lo es para toda la familia.
  const [selected, setSelected] = useState<string[]>(() => people?.map((p) => p.id) ?? []);
  const allergens = useMemo(
    () =>
      combineProfiles(
        (people ?? []).filter((p) => selected.includes(p.id)).map((p) => p.allergens),
      ),
    [people, selected],
  );
  // Sin alergias que evitar no hay semáforo. El cálculo es el de core, en el navegador:
  // las alergias no salen de aquí.
  const suitability = useMemo(
    () =>
      allergens.length === 0
        ? null
        : suitabilityByRestaurant(menus.dishes, menus.declarations, allergens),
    [menus, allergens],
  );

  function togglePerson(id: string) {
    // Siempre queda al menos una persona seleccionada.
    setSelected((current) =>
      current.includes(id)
        ? current.length === 1
          ? current
          : current.filter((other) => other !== id)
        : [...current, id],
    );
  }
  const showAllId = useId();
  const [city, setCity] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const origin = location.status === "ready" ? location.origin : null;

  // Un restaurante sin platos evaluados (sin carta) queda "sin datos", nunca apto.
  const statusOf = (id: string): FilterStatus => suitability?.[id]?.status ?? "sin_datos";
  const suitableCount = restaurants.filter((r) => statusOf(r.id) === "apto").length;

  const results = useMemo(() => {
    const query = normalize(city);
    const byCity =
      query === "" ? restaurants : restaurants.filter((r) => normalize(r.city).includes(query));
    // Por defecto, solo donde hay algún plato apto según lo declarado.
    const shown =
      suitability === null || showAll
        ? byCity
        : byCity.filter((r) => (suitability[r.id]?.status ?? "sin_datos") === "apto");
    if (origin === null) return shown.map((restaurant) => ({ restaurant, distanceKm: null }));
    // Primero los que tienen ubicación, de más cerca a más lejos; después el resto.
    const located = sortByDistance(shown, origin).map(({ item, distanceKm }) => ({
      restaurant: item,
      distanceKm,
    }));
    const placed = new Set(located.map(({ restaurant }) => restaurant.id));
    const unplaced = shown
      .filter((r) => !placed.has(r.id))
      .map((restaurant) => ({ restaurant, distanceKm: null }));
    return [...located, ...unplaced];
  }, [restaurants, suitability, showAll, city, origin]);

  function locate() {
    if (!("geolocation" in navigator)) {
      setLocation({ status: "unavailable" });
      return;
    }
    setLocation({ status: "locating" });
    // La posición se usa solo aquí, para ordenar: no se guarda ni se envía.
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setLocation({
          status: "ready",
          origin: { latitude: position.coords.latitude, longitude: position.coords.longitude },
        }),
      (error) =>
        setLocation({ status: error.code === error.PERMISSION_DENIED ? "denied" : "unavailable" }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  function statusLabel(id: string): string {
    const status = statusOf(id);
    if (status === "apto")
      return t.diner.search.suitableDishes(suitability?.[id]?.suitableDishes ?? 0);
    return t.diner.search.statuses[status];
  }

  return (
    <div className="flex flex-col gap-4">
      {people !== null && people.length > 1 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">{t.diner.search.forWhom}</legend>
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <label
                key={person.id}
                className="flex min-h-11 items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm has-checked:border-emerald-700 has-checked:bg-emerald-50 dark:border-zinc-700 dark:has-checked:bg-emerald-950"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(person.id)}
                  onChange={() => togglePerson(person.id)}
                  className="size-4 accent-emerald-700"
                />
                {person.name}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      {suitability === null ? (
        <Alert tone="info">
          {t.diner.search.noProfile}{" "}
          <Link href="/comensal/alergias" className="underline">
            {t.diner.search.configureProfile}
          </Link>
        </Alert>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="font-medium">
            {t.diner.search.canEatIn(suitableCount, restaurants.length)}
          </p>
          <div className="flex items-center gap-2">
            <input
              id={showAllId}
              type="checkbox"
              checked={showAll}
              onChange={(event) => setShowAll(event.target.checked)}
              className="size-4 accent-emerald-700"
            />
            <label htmlFor={showAllId} className="text-sm">
              {t.diner.search.showAll}
            </label>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {t.diner.search.declaredNotice}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <TextField
            label={t.diner.search.city}
            name="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            autoComplete="address-level2"
          />
        </div>
        <Button variant="secondary" onClick={locate} disabled={location.status === "locating"}>
          {location.status === "locating" ? t.diner.search.locating : t.diner.search.nearMe}
        </Button>
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">{t.diner.search.privacy}</p>
      {location.status === "denied" ? <Alert tone="info">{t.diner.search.denied}</Alert> : null}
      {location.status === "unavailable" ? (
        <Alert tone="info">{t.diner.search.unavailable}</Alert>
      ) : null}

      <RestaurantMap
        restaurants={results.map(({ restaurant }) => ({
          ...restaurant,
          status: suitability === null ? null : statusOf(restaurant.id),
          statusLabel: suitability === null ? null : statusLabel(restaurant.id),
        }))}
        origin={origin}
      />

      <p className="text-sm font-medium" aria-live="polite">
        {origin === null
          ? t.diner.search.results(results.length)
          : `${t.diner.search.results(results.length)} · ${t.diner.search.byProximity}`}
      </p>
      {results.length === 0 ? (
        <p className="text-zinc-700 dark:text-zinc-300">
          {restaurants.length === 0
            ? t.diner.search.noRestaurants
            : city.trim() !== ""
              ? t.diner.search.noResultsCity(city.trim())
              : t.diner.search.noneSuitable}
        </p>
      ) : (
        <ul
          aria-label={t.diner.search.listLabel}
          className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
        >
          {results.map(({ restaurant, distanceKm }) => (
            <li key={restaurant.id}>
              <Link
                href={`/r/${restaurant.slug}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-medium">{restaurant.name}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {[restaurant.address, restaurant.city].filter(Boolean).join(" · ")}
                  </span>
                  {suitability !== null ? (
                    <span
                      className={`self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${SUITABILITY_STYLES[statusOf(restaurant.id)].badge}`}
                    >
                      {`${SUITABILITY_STYLES[statusOf(restaurant.id)].symbol} ${statusLabel(restaurant.id)}`}
                    </span>
                  ) : null}
                </span>
                {distanceKm !== null ? (
                  <span className="text-sm whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                    {formatDistance(distanceKm)}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
