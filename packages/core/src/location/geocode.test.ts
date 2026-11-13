import { describe, expect, it } from "vitest";
import { pickGeocodeMatch } from "./geocode";

// Respuesta real (resumida) de Nominatim para «Calle de Alfonso I 5», city=Zaragoza.
const ALFONSO_I = [
  { lat: "42.1245046", lon: "-1.1377136", address: { town: "Ejea de los Caballeros" } },
  { lat: "41.1146665", lon: "-1.4142957", address: { town: "Daroca" } },
  { lat: "41.6536840", lon: "-0.8831369", address: { city: "Zaragoza", state: "Aragón" } },
];

describe("pickGeocodeMatch", () => {
  it("elige el resultado de la ciudad escrita, no otro pueblo de la provincia", () => {
    expect(pickGeocodeMatch(ALFONSO_I, "Zaragoza")).toEqual({
      latitude: 41.653684,
      longitude: -0.8831369,
    });
  });

  it("no distingue mayúsculas, tildes ni espacios", () => {
    expect(pickGeocodeMatch(ALFONSO_I, "  ZARAGOZA ")).not.toBeNull();
    expect(
      pickGeocodeMatch([{ lat: "37.38", lon: "-5.98", address: { city: "Sevilla" } }], "sevílla"),
    ).toEqual({ latitude: 37.38, longitude: -5.98 });
    expect(
      pickGeocodeMatch(
        [{ lat: "41.1", lon: "-1.1", address: { town: "Ejea de los  Caballeros" } }],
        "ejea de los caballeros",
      ),
    ).not.toBeNull();
  });

  it.each(["town", "village", "municipality", "hamlet"])(
    "acepta el municipio en el campo %s",
    (field) => {
      expect(
        pickGeocodeMatch([{ lat: "41.1", lon: "-1.4", address: { [field]: "Daroca" } }], "Daroca"),
      ).toEqual({ latitude: 41.1, longitude: -1.4 });
    },
  );

  it("si ningún resultado está en esa ciudad, no ubica nada", () => {
    expect(pickGeocodeMatch(ALFONSO_I.slice(0, 2), "Zaragoza")).toBeNull();
    // La provincia no basta: tiene que ser el municipio.
    expect(
      pickGeocodeMatch(
        [
          {
            lat: "42.1",
            lon: "-1.1",
            address: { town: "Ejea", county: "Zaragoza", state: "Zaragoza" },
          },
        ],
        "Zaragoza",
      ),
    ).toBeNull();
    expect(pickGeocodeMatch([], "Zaragoza")).toBeNull();
  });

  it.each([
    ["no es una lista", { lat: "41", lon: "-1" }],
    ["null", null],
    ["un elemento que no es un objeto", [null, "x", 3]],
    ["sin address", [{ lat: "41", lon: "-1" }]],
    ["coordenadas que no son texto", [{ lat: 41, lon: -1, address: { city: "Zaragoza" } }]],
    ["coordenadas fuera de rango", [{ lat: "123", lon: "-1", address: { city: "Zaragoza" } }]],
    ["coordenadas no numéricas", [{ lat: "x", lon: "-1", address: { city: "Zaragoza" } }]],
    ["municipio que no es texto", [{ lat: "41", lon: "-1", address: { city: 3 } }]],
  ])("una respuesta con %s no ubica nada", (_, results) => {
    expect(pickGeocodeMatch(results, "Zaragoza")).toBeNull();
  });

  it("salta resultados con datos rotos y sigue buscando", () => {
    expect(
      pickGeocodeMatch(
        [
          { lat: "x", lon: "-1", address: { city: "Zaragoza" } },
          { lat: "41.65", lon: "-0.88", address: { city: "Zaragoza" } },
        ],
        "Zaragoza",
      ),
    ).toEqual({ latitude: 41.65, longitude: -0.88 });
  });

  it("una ciudad vacía no ubica nada", () => {
    expect(pickGeocodeMatch(ALFONSO_I, "   ")).toBeNull();
  });
});
