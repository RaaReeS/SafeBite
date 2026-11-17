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
import { Card, EmptyState, IconBadge } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status";
import { getMessages } from "@/i18n";
import type { Person } from "@/lib/data/health-profile";
import type { PublicMenus, PublishedRestaurant } from "@/lib/data/published-restaurants";

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
    <div className="flex flex-col gap-5">
      {/* Buscador: ciudad y «Cerca de mí». */}
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
        <Button
          variant="secondary"
          icon="navigate"
          onClick={locate}
          disabled={location.status === "locating"}
        >
          {location.status === "locating" ? t.diner.search.locating : t.diner.search.nearMe}
        </Button>
      </div>
      <p className="text-sm text-muted">{t.diner.search.privacy}</p>
      {location.status === "denied" ? <Alert tone="info">{t.diner.search.denied}</Alert> : null}
      {location.status === "unavailable" ? (
        <Alert tone="info">{t.diner.search.unavailable}</Alert>
      ) : null}

      {people !== null && people.length > 1 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold text-muted">
            {t.diner.search.forWhom}
          </legend>
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <label
                key={person.id}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium has-checked:bg-primary has-checked:text-on-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-text"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(person.id)}
                  onChange={() => togglePerson(person.id)}
                  className="size-4 accent-primary-dark"
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
          <Link href="/comensal/alergias" className="font-semibold underline">
            {t.diner.search.configureProfile}
          </Link>
        </Alert>
      ) : (
        <Card>
          <div className="flex items-center gap-3">
            <IconBadge icon="restaurant" size="lg" />
            <p className="text-lg font-semibold">
              {t.diner.search.canEatIn(suitableCount, restaurants.length)}
            </p>
          </div>
          <p className="text-sm text-muted">{t.diner.search.declaredNotice}</p>
          <div className="flex items-center gap-3 border-t border-line pt-3">
            <input
              id={showAllId}
              type="checkbox"
              checked={showAll}
              onChange={(event) => setShowAll(event.target.checked)}
              className="size-5 accent-primary"
            />
            <label htmlFor={showAllId} className="text-sm">
              {t.diner.search.showAll}
            </label>
          </div>
        </Card>
      )}

      <div className="overflow-hidden rounded-2xl shadow-card">
        <RestaurantMap
          restaurants={results.map(({ restaurant }) => ({
            ...restaurant,
            status: suitability === null ? null : statusOf(restaurant.id),
            statusLabel: suitability === null ? null : statusLabel(restaurant.id),
          }))}
          origin={origin}
        />
      </div>

      <p className="text-sm font-semibold text-muted" aria-live="polite">
        {origin === null
          ? t.diner.search.results(results.length)
          : `${t.diner.search.results(results.length)} · ${t.diner.search.byProximity}`}
      </p>
      {results.length === 0 ? (
        <EmptyState
          icon="restaurant"
          title={
            restaurants.length === 0
              ? t.diner.search.noRestaurants
              : city.trim() !== ""
                ? t.diner.search.noResultsCity(city.trim())
                : t.diner.search.noneSuitable
          }
        />
      ) : (
        <ul aria-label={t.diner.search.listLabel} className="grid gap-3 md:grid-cols-2">
          {results.map(({ restaurant, distanceKm }) => (
            <li key={restaurant.id}>
              <Link
                href={`/r/${restaurant.slug}`}
                className="flex h-full items-center gap-4 rounded-2xl bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
              >
                <IconBadge icon="restaurant" />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="font-semibold">{restaurant.name}</span>
                  <span className="text-sm text-muted">
                    {[restaurant.address, restaurant.city].filter(Boolean).join(" · ")}
                  </span>
                  {suitability !== null ? (
                    <StatusBadge
                      status={statusOf(restaurant.id)}
                      label={statusLabel(restaurant.id)}
                    />
                  ) : null}
                  {distanceKm !== null ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-text">
                      <Icon name="location" className="size-4" />
                      {formatDistance(distanceKm)}
                    </span>
                  ) : null}
                </span>
                <Icon name="chevron-forward" className="size-5 text-subtle" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
