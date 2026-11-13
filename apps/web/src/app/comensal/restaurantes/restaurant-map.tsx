"use client";

import { isValidCoordinates, type Coordinates, type FilterStatus } from "@safebite/core";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { getMessages } from "@/i18n";
import type { PublishedRestaurant } from "@/lib/data/published-restaurants";
import { SUITABILITY_STYLES } from "./suitability";

/** Estilo «Liberty» de OpenFreeMap: mapa vectorial, gratuito y sin claves. */
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

/**
 * El worker de MapLibre (dibuja el mapa en segundo plano) se sirve como archivo
 * estático: scripts/copy-maplibre-worker.mjs lo copia a public/ al compilar.
 */
maplibregl.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");

/** Centro de España, si no hay nada que mostrar. */
const DEFAULT_CENTER: [number, number] = [-3.7, 40.2];

/** Los textos vienen de los restaurantes: se escapan antes de ir al HTML del popup. */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

export type MapRestaurant = PublishedRestaurant & {
  /** Resultado para el perfil del comensal; null si no tiene alergias guardadas. */
  status: FilterStatus | null;
  statusLabel: string | null;
};

/** Punto redondo de color (el estado también va en texto, en la ficha y en la lista). */
function dot(fill: string, stroke: string, size: number, label: string): HTMLElement {
  const element = document.createElement("button");
  element.type = "button";
  element.setAttribute("aria-label", label);
  element.style.cssText = `width:${size}px;height:${size}px;border-radius:9999px;background:${fill};border:3px solid ${stroke};box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:pointer;padding:0`;
  return element;
}

/**
 * Mapa de los restaurantes (MapLibre GL + OpenFreeMap, datos de OpenStreetMap),
 * coloreados según si el comensal puede comer en ellos. Es un complemento
 * visual: la lista de debajo tiene la misma información y es la versión
 * accesible. Los trozos del mapa se descargan de los servidores de OpenFreeMap.
 */
export default function RestaurantMap({
  restaurants,
  origin,
}: {
  restaurants: MapRestaurant[];
  origin: Coordinates | null;
}) {
  const t = getMessages();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (containerRef.current === null) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: 4.5,
      // Los créditos (OpenFreeMap, OpenMapTiles, OpenStreetMap) los pone el propio estilo.
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map === null) return;
    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];
    const bounds = new maplibregl.LngLatBounds();
    let count = 0;

    for (const restaurant of restaurants) {
      if (!isValidCoordinates(restaurant)) continue;
      const lngLat: [number, number] = [restaurant.longitude, restaurant.latitude];
      const style = SUITABILITY_STYLES[restaurant.status ?? "apto"];
      const href = `/r/${encodeURIComponent(restaurant.slug)}`;
      const status =
        restaurant.statusLabel === null
          ? ""
          : `<br>${escapeHtml(`${style.symbol} ${restaurant.statusLabel}`)}`;
      const popup = new maplibregl.Popup({
        offset: 14,
        closeButton: true,
        className: "safebite-popup",
      }).setHTML(
        `<strong>${escapeHtml(restaurant.name)}</strong><br>${escapeHtml(restaurant.city)}${status}<br><a href="${href}" style="color:#047857;font-weight:600">${escapeHtml(t.diner.search.openMenu)}</a>`,
      );
      const marker = new maplibregl.Marker({
        element: dot(style.fill, style.stroke, 22, restaurant.name),
      })
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
      bounds.extend(lngLat);
      count += 1;
    }

    if (origin !== null) {
      const here: [number, number] = [origin.longitude, origin.latitude];
      const marker = new maplibregl.Marker({
        element: dot("#3b82f6", "#ffffff", 18, t.diner.search.youAreHere),
      })
        .setLngLat(here)
        .setPopup(
          new maplibregl.Popup({ offset: 12, className: "safebite-popup" }).setText(
            t.diner.search.youAreHere,
          ),
        )
        .addTo(map);
      markersRef.current.push(marker);
      bounds.extend(here);
      count += 1;
    }

    if (count === 1) map.easeTo({ center: bounds.getCenter(), zoom: 14 });
    else if (count > 1) map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 600 });
  }, [restaurants, origin, t]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={t.diner.search.mapLabel}
      className="h-96 w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
      data-testid="restaurant-map"
    />
  );
}
