import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  distanceKm,
  formatDistance,
  isValidCoordinates,
  sortByDistance,
  type Coordinates,
} from "./distance";

const MADRID: Coordinates = { latitude: 40.4168, longitude: -3.7038 };
const BARCELONA: Coordinates = { latitude: 41.3874, longitude: 2.1686 };
const SEVILLA: Coordinates = { latitude: 37.3891, longitude: -5.9845 };

describe("distanceKm", () => {
  it("calcula distancias reales conocidas (en línea recta, ±1 %)", () => {
    expect(distanceKm(MADRID, BARCELONA)).toBeCloseTo(505, -1);
    expect(distanceKm(MADRID, SEVILLA)).toBeCloseTo(390, -1);
  });

  it("es 0 entre un punto y sí mismo", () => {
    expect(distanceKm(MADRID, MADRID)).toBe(0);
  });

  it("distingue distancias cortas dentro de una ciudad", () => {
    const solToGranVia = distanceKm(
      { latitude: 40.4169, longitude: -3.7035 },
      { latitude: 40.4203, longitude: -3.7058 },
    );
    expect(solToGranVia).toBeGreaterThan(0.3);
    expect(solToGranVia).toBeLessThan(0.5);
  });

  const coordinatesArb = fc.record({
    latitude: fc.double({ min: -90, max: 90, noNaN: true }),
    longitude: fc.double({ min: -180, max: 180, noNaN: true }),
  });

  it("propiedades: simétrica, no negativa y nunca mayor que media vuelta a la Tierra", () => {
    fc.assert(
      fc.property(coordinatesArb, coordinatesArb, (a, b) => {
        const d = distanceKm(a, b);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(20_016);
        expect(d).toBeCloseTo(distanceKm(b, a), 6);
      }),
      { numRuns: 1000 },
    );
  });
});

describe("isValidCoordinates", () => {
  it.each([
    [{ latitude: 40.4, longitude: -3.7 }, true],
    [{ latitude: 90, longitude: 180 }, true],
    [{ latitude: 91, longitude: 0 }, false],
    [{ latitude: 0, longitude: -181 }, false],
    [{ latitude: null, longitude: -3.7 }, false],
    [{ latitude: 40.4, longitude: null }, false],
    [{ latitude: Number.NaN, longitude: 0 }, false],
  ])("%j -> %s", (value, expected) => {
    expect(isValidCoordinates(value)).toBe(expected);
  });
});

describe("sortByDistance", () => {
  const places = [
    { name: "Barcelona", latitude: BARCELONA.latitude, longitude: BARCELONA.longitude },
    { name: "Sin ubicación", latitude: null, longitude: null },
    { name: "Sevilla", latitude: SEVILLA.latitude, longitude: SEVILLA.longitude },
    { name: "Madrid", latitude: MADRID.latitude, longitude: MADRID.longitude },
  ];

  it("ordena de más cerca a más lejos y añade la distancia", () => {
    const sorted = sortByDistance(places, MADRID);
    expect(sorted.map((p) => p.item.name)).toEqual(["Madrid", "Sevilla", "Barcelona"]);
    expect(sorted[0]?.distanceKm).toBe(0);
  });

  it("deja fuera los lugares sin coordenadas", () => {
    expect(sortByDistance(places, MADRID).map((p) => p.item.name)).not.toContain("Sin ubicación");
  });

  it("puede limitar el radio en kilómetros", () => {
    expect(sortByDistance(places, MADRID, 400).map((p) => p.item.name)).toEqual([
      "Madrid",
      "Sevilla",
    ]);
  });

  it("no modifica la lista original", () => {
    const copy = places.map((p) => p.name);
    sortByDistance(places, MADRID);
    expect(places.map((p) => p.name)).toEqual(copy);
  });
});

describe("formatDistance", () => {
  it.each([
    [0, "a menos de 50 m"],
    [0.04, "a menos de 50 m"],
    [0.35, "a 350 m"],
    [0.999, "a 1 km"],
    [1.26, "a 1,3 km"],
    [12.4, "a 12 km"],
    [505, "a 505 km"],
  ])("%d km -> %j", (km, expected) => {
    expect(formatDistance(km)).toBe(expected);
  });
});
