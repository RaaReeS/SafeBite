"use client";

import { isValidCoordinates, type Coordinates } from "@safebite/core";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { getMessages } from "@/i18n";
import type { PublishedRestaurant } from "@/lib/data/published-restaurants";

/** Centro de España, si no hay nada que mostrar. */
const DEFAULT_CENTER: L.LatLngTuple = [40.2, -3.7];

/** Los textos vienen de los restaurantes: se escapan antes de ir al HTML del popup. */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * Mapa de OpenStreetMap con los restaurantes. Es un complemento visual: la
 * lista de debajo tiene la misma información y es la versión accesible.
 * Los trozos del mapa se descargan de los servidores de OpenStreetMap.
 */
export default function RestaurantMap({
  restaurants,
  origin,
}: {
  restaurants: PublishedRestaurant[];
  origin: Coordinates | null;
}) {
  const t = getMessages();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (containerRef.current === null) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (map === null || layer === null) return;
    layer.clearLayers();
    const points: L.LatLngTuple[] = [];

    for (const restaurant of restaurants) {
      if (!isValidCoordinates(restaurant)) continue;
      const point: L.LatLngTuple = [restaurant.latitude, restaurant.longitude];
      points.push(point);
      const href = `/r/${encodeURIComponent(restaurant.slug)}`;
      L.circleMarker(point, {
        radius: 9,
        color: "#047857",
        fillColor: "#10b981",
        fillOpacity: 0.9,
        weight: 2,
      })
        .bindPopup(
          `<strong>${escapeHtml(restaurant.name)}</strong><br>${escapeHtml(restaurant.city)}<br><a href="${href}">${escapeHtml(t.diner.search.openMenu)}</a>`,
        )
        .addTo(layer);
    }

    if (origin !== null) {
      const here: L.LatLngTuple = [origin.latitude, origin.longitude];
      points.push(here);
      L.circleMarker(here, { radius: 7, color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 1 })
        .bindPopup(escapeHtml(t.diner.search.youAreHere))
        .addTo(layer);
    }

    const [first] = points;
    if (points.length === 1 && first !== undefined) map.setView(first, 14);
    else if (points.length > 1) map.fitBounds(points, { padding: [30, 30], maxZoom: 15 });
  }, [restaurants, origin, t]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={t.diner.search.mapLabel}
      className="z-0 h-80 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
      data-testid="restaurant-map"
    />
  );
}
