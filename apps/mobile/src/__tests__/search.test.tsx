import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { Linking } from "react-native";
import * as location from "@/lib/location";
import * as restaurants from "@/lib/restaurants";
import type { RestaurantSummary } from "@/lib/restaurants";
import { fakeSession, mockAuth, resetSupabaseMock } from "@/test-utils/supabase-mock";

jest.mock(
  "@/lib/supabase",
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/test-utils/supabase-mock").supabaseModule,
);
jest.mock("@/lib/profile", () => ({
  getHealthProfile: jest.fn(async () => ({ consentGivenAt: null, allergens: [] })),
}));
jest.mock("@/lib/restaurants", () => ({
  listPublishedRestaurants: jest.fn(async () => []),
  searchRestaurantsByCity: jest.fn(),
  listRestaurantsWithLocation: jest.fn(),
  requestRestaurant: jest.fn(async () => undefined),
}));
jest.mock("@/lib/location", () => ({
  getCurrentCoordinates: jest.fn(),
  // Por defecto, el usuario aún no ha dado permiso de ubicación.
  getCoordinatesIfAllowed: jest.fn(async () => null),
}));

const mockRestaurants = jest.mocked(restaurants);
const mockLocation = jest.mocked(location);

// Puerta del Sol (Madrid) como posición del usuario.
const SOL = { latitude: 40.4169, longitude: -3.7035 };

function restaurant(name: string, latitude: number | null, longitude: number | null) {
  return {
    id: name,
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    city: "Madrid",
    address: `Calle de ${name}`,
    latitude,
    longitude,
  } satisfies RestaurantSummary;
}

const NEAR = restaurant("Cerca", 40.4203, -3.7058); // 0,43 km
const MID = restaurant("Media", 40.4318, -3.6877); // ~2,1 km
const FAR = restaurant("Barcelona", 41.3874, 2.1686); // ~500 km
const NO_LOCATION = restaurant("Sin ubicacion", null, null);

async function renderSearch() {
  mockAuth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
  await renderRouter("./src/app", { initialUrl: "/buscar" });
}

async function press(label: string) {
  await fireEvent.press(screen.getByRole("button", { name: label }));
}

function resultNames() {
  return screen
    .getAllByText(/^(Cerca|Media|Barcelona|Sin ubicacion|Bar Pepe)$/)
    .map((n) => n.props.children);
}

beforeEach(() => {
  resetSupabaseMock();
  jest.clearAllMocks();
});

describe("búsqueda por ciudad", () => {
  it("busca por la ciudad escrita y muestra los resultados", async () => {
    mockRestaurants.searchRestaurantsByCity.mockResolvedValue([NO_LOCATION, NEAR]);
    await renderSearch();
    await fireEvent.changeText(await screen.findByLabelText("Ciudad"), "  Madrid ");
    await press("Buscar");
    await waitFor(() =>
      expect(mockRestaurants.searchRestaurantsByCity).toHaveBeenCalledWith("Madrid"),
    );
    expect(await screen.findByText("2 restaurantes")).toBeTruthy();
    expect(resultNames()).toEqual(["Sin ubicacion", "Cerca"]);
  });

  it("si no hay resultados, lo dice y ofrece pedir el restaurante", async () => {
    mockRestaurants.searchRestaurantsByCity.mockResolvedValue([]);
    await renderSearch();
    await fireEvent.changeText(await screen.findByLabelText("Ciudad"), "Teruel");
    await press("Buscar");
    expect(await screen.findByText("No hemos encontrado restaurantes en «Teruel».")).toBeTruthy();
    await press("Pide que se dé de alta");
    expect(await screen.findByLabelText("Nombre del restaurante")).toBeTruthy();
  });

  it("al abrir la búsqueda muestra todos los restaurantes publicados", async () => {
    mockRestaurants.listPublishedRestaurants.mockResolvedValueOnce([MID, NEAR]);
    await renderSearch();
    expect(await screen.findByText("Todos los restaurantes (2)")).toBeTruthy();
    expect(resultNames()).toEqual(["Media", "Cerca"]);
    expect(screen.queryByRole("button", { name: "Ver todos los restaurantes" })).toBeNull();
  });

  it("si aún no hay restaurantes publicados, lo dice", async () => {
    await renderSearch();
    expect(await screen.findByText("Todavía no hay restaurantes publicados.")).toBeTruthy();
  });

  it("buscar con la ciudad vacía vuelve a mostrar todos, y tras filtrar se puede volver", async () => {
    mockRestaurants.listPublishedRestaurants.mockResolvedValue([MID, NEAR]);
    mockRestaurants.searchRestaurantsByCity.mockResolvedValue([NEAR]);
    await renderSearch();
    await screen.findByText("Todos los restaurantes (2)");

    await fireEvent.changeText(screen.getByLabelText("Ciudad"), "Madrid");
    await press("Buscar");
    expect(await screen.findByText("1 restaurante")).toBeTruthy();

    await press("Ver todos los restaurantes");
    expect(await screen.findByText("Todos los restaurantes (2)")).toBeTruthy();
    expect(screen.getByLabelText("Ciudad").props.value).toBe("");

    await press("Buscar");
    expect(mockRestaurants.searchRestaurantsByCity).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Todos los restaurantes (2)")).toBeTruthy();
  });

  it("privacidad: abrir la búsqueda no pide la ubicación (solo al pulsar «Cerca de mí»)", async () => {
    await renderSearch();
    await screen.findByLabelText("Ciudad");
    expect(mockLocation.getCurrentCoordinates).not.toHaveBeenCalled();
  });

  it("si falla la conexión, lo avisa", async () => {
    mockRestaurants.searchRestaurantsByCity.mockRejectedValue(new Error("sin red"));
    await renderSearch();
    await fireEvent.changeText(await screen.findByLabelText("Ciudad"), "Madrid");
    await press("Buscar");
    expect(await screen.findByText(/No se ha podido completar la búsqueda/)).toBeTruthy();
  });
});

describe("lista inicial ordenada por cercanía", () => {
  it("si ya dio permiso antes, al abrir ordena de más cerca a más lejos sin pedir nada", async () => {
    mockLocation.getCoordinatesIfAllowed.mockResolvedValueOnce(SOL);
    mockRestaurants.listPublishedRestaurants.mockResolvedValueOnce([FAR, NO_LOCATION, MID, NEAR]);
    await renderSearch();
    expect(
      await screen.findByText("Todos los restaurantes (4) · de más cerca a más lejos"),
    ).toBeTruthy();
    // Sin radio: todos, por distancia, y al final los que no tienen ubicación.
    expect(resultNames()).toEqual(["Cerca", "Media", "Barcelona", "Sin ubicacion"]);
    expect(screen.getByText("a 430 m")).toBeTruthy();
    expect(mockLocation.getCurrentCoordinates).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Ordenar por cercanía" })).toBeNull();
  });

  it("si no ha dado permiso, sale por nombre y puede ordenar por cercanía al pulsar", async () => {
    mockRestaurants.listPublishedRestaurants.mockResolvedValueOnce([MID, NEAR]);
    mockLocation.getCurrentCoordinates.mockResolvedValueOnce({
      status: "granted",
      coordinates: SOL,
    });
    await renderSearch();
    expect(await screen.findByText("Todos los restaurantes (2)")).toBeTruthy();
    expect(resultNames()).toEqual(["Media", "Cerca"]);

    await press("Ordenar por cercanía");
    expect(
      await screen.findByText("Todos los restaurantes (2) · de más cerca a más lejos"),
    ).toBeTruthy();
    expect(resultNames()).toEqual(["Cerca", "Media"]);
    expect(mockLocation.getCurrentCoordinates).toHaveBeenCalledTimes(1);
  });

  it("si deniega el permiso, la lista sigue visible con el aviso", async () => {
    mockRestaurants.listPublishedRestaurants.mockResolvedValueOnce([MID, NEAR]);
    mockLocation.getCurrentCoordinates.mockResolvedValueOnce({ status: "denied" });
    await renderSearch();
    await screen.findByText("Todos los restaurantes (2)");
    await press("Ordenar por cercanía");
    expect(await screen.findByText(/Sin permiso de ubicación/)).toBeTruthy();
    expect(screen.getByText("Todos los restaurantes (2)")).toBeTruthy();
    expect(resultNames()).toEqual(["Media", "Cerca"]);
  });
});

describe("cerca de mí", () => {
  it("ordena por distancia, muestra cuánto falta y deja fuera lo lejano", async () => {
    mockLocation.getCurrentCoordinates.mockResolvedValue({ status: "granted", coordinates: SOL });
    mockRestaurants.listRestaurantsWithLocation.mockResolvedValue([FAR, MID, NEAR]);
    await renderSearch();
    await press("Cerca de mí");

    expect(await screen.findByText("2 restaurantes · de más cerca a más lejos")).toBeTruthy();
    expect(resultNames()).toEqual(["Cerca", "Media"]);
    expect(screen.getByText("a 430 m")).toBeTruthy();
    expect(screen.getByText("a 2,1 km")).toBeTruthy();
  });

  it("privacidad: la ubicación no se envía al pedir los restaurantes", async () => {
    mockLocation.getCurrentCoordinates.mockResolvedValue({ status: "granted", coordinates: SOL });
    mockRestaurants.listRestaurantsWithLocation.mockResolvedValue([NEAR]);
    await renderSearch();
    await press("Cerca de mí");
    await screen.findByText("1 restaurante · de más cerca a más lejos");
    expect(mockRestaurants.listRestaurantsWithLocation).toHaveBeenCalledWith();
    expect(screen.getByText(/no se guarda ni se envía/)).toBeTruthy();
  });

  it("sin permiso de ubicación lo explica y ofrece abrir Ajustes", async () => {
    mockLocation.getCurrentCoordinates.mockResolvedValue({ status: "denied" });
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    await renderSearch();
    await press("Cerca de mí");
    expect(await screen.findByText(/Sin permiso de ubicación/)).toBeTruthy();
    expect(mockRestaurants.listRestaurantsWithLocation).not.toHaveBeenCalled();
    await press("Abrir Ajustes");
    expect(openSettings).toHaveBeenCalled();
  });

  it("después de usar la ubicación, la búsqueda por ciudad también ordena por distancia", async () => {
    mockLocation.getCurrentCoordinates.mockResolvedValue({ status: "granted", coordinates: SOL });
    mockRestaurants.listRestaurantsWithLocation.mockResolvedValue([NEAR]);
    mockRestaurants.searchRestaurantsByCity.mockResolvedValue([NO_LOCATION, MID, NEAR]);
    await renderSearch();
    await press("Cerca de mí");
    await screen.findByText("1 restaurante · de más cerca a más lejos");

    await fireEvent.changeText(screen.getByLabelText("Ciudad"), "Madrid");
    await press("Buscar");
    expect(await screen.findByText("3 restaurantes · de más cerca a más lejos")).toBeTruthy();
    // Primero los que tienen ubicación, por distancia; al final, los que no.
    expect(resultNames()).toEqual(["Cerca", "Media", "Sin ubicacion"]);
  });
});

describe("pide un restaurante", () => {
  it("valida y envía la solicitud", async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
    await renderRouter("./src/app", { initialUrl: "/pedir-restaurante" });
    await screen.findByLabelText("Nombre del restaurante");
    await press("Enviar solicitud");
    expect((await screen.findAllByText("Este campo es obligatorio.")).length).toBe(2);
    expect(mockRestaurants.requestRestaurant).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText("Nombre del restaurante"), " Bar Pepe ");
    await fireEvent.changeText(screen.getByLabelText("Ciudad"), "Madrid");
    await press("Enviar solicitud");
    await waitFor(() =>
      expect(mockRestaurants.requestRestaurant).toHaveBeenCalledWith({
        restaurant_name: "Bar Pepe",
        city: "Madrid",
      }),
    );
    expect(await screen.findByText("¡Gracias! Hemos recibido tu solicitud.")).toBeTruthy();
  });
});
