"use client";

import { formatDistance, sortByDistance, type Coordinates } from "@safebite/core";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import type { PublishedRestaurant } from "@/lib/data/published-restaurants";

// Leaflet usa `window`: el mapa solo se carga en el navegador.
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

export function RestaurantFinder({ restaurants }: { restaurants: PublishedRestaurant[] }) {
  const t = getMessages();
  const [city, setCity] = useState("");
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const origin = location.status === "ready" ? location.origin : null;

  const results = useMemo(() => {
    const query = normalize(city);
    const byCity =
      query === "" ? restaurants : restaurants.filter((r) => normalize(r.city).includes(query));
    if (origin === null) return byCity.map((restaurant) => ({ restaurant, distanceKm: null }));
    // Primero los que tienen ubicación, de más cerca a más lejos; después el resto.
    const located = sortByDistance(byCity, origin).map(({ item, distanceKm }) => ({
      restaurant: item,
      distanceKm,
    }));
    const placed = new Set(located.map(({ restaurant }) => restaurant.id));
    const unplaced = byCity
      .filter((r) => !placed.has(r.id))
      .map((restaurant) => ({ restaurant, distanceKm: null }));
    return [...located, ...unplaced];
  }, [restaurants, city, origin]);

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

  return (
    <div className="flex flex-col gap-4">
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

      <RestaurantMap restaurants={results.map(({ restaurant }) => restaurant)} origin={origin} />

      <p className="text-sm font-medium" aria-live="polite">
        {origin === null
          ? t.diner.search.results(results.length)
          : `${t.diner.search.results(results.length)} · ${t.diner.search.byProximity}`}
      </p>
      {results.length === 0 ? (
        <p className="text-zinc-700 dark:text-zinc-300">
          {restaurants.length === 0
            ? t.diner.search.noRestaurants
            : t.diner.search.noResultsCity(city.trim())}
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
                <span className="flex flex-col">
                  <span className="font-medium">{restaurant.name}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {[restaurant.address, restaurant.city].filter(Boolean).join(" · ")}
                  </span>
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
