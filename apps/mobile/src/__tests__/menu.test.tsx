import { ALLERGENS, type AllergenDeclaration } from "@safebite/core";
import { fireEvent, screen, waitFor, within } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import * as menu from "@/lib/menu";
import type { Menu } from "@/lib/menu";
import * as profile from "@/lib/profile";
import * as restaurants from "@/lib/restaurants";
import { fakeSession, mockAuth, resetSupabaseMock } from "@/test-utils/supabase-mock";

jest.mock(
  "@/lib/supabase",
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/test-utils/supabase-mock").supabaseModule,
);
jest.mock("@/lib/menu", () => ({ getMenu: jest.fn() }));
jest.mock("@/lib/profile", () => ({
  getHealthProfile: jest.fn(),
  saveMyAllergens: jest.fn(async () => undefined),
}));
jest.mock("@/lib/restaurants", () => ({
  searchRestaurantsByCity: jest.fn(),
  listRestaurantsWithLocation: jest.fn(),
}));

const mockMenu = jest.mocked(menu);
const mockProfile = jest.mocked(profile);
const mockRestaurants = jest.mocked(restaurants);

const allFreeFrom = (except: AllergenDeclaration[] = []): AllergenDeclaration[] =>
  ALLERGENS.map(
    (allergen) =>
      except.find((d) => d.allergen === allergen) ?? { allergen, level: "free_from" as const },
  );

function dish(id: string, name: string, sortOrder: number, allergens: AllergenDeclaration[]) {
  return {
    id,
    name,
    description: null,
    price_cents: 950,
    category: "Entrantes",
    ingredients: null,
    sort_order: sortOrder,
    allergens,
  };
}

// Mismos casos que el restaurante del seed.
const MENU: Menu = {
  restaurant: {
    id: "r1",
    name: "La Huerta Demo",
    slug: "la-huerta-demo",
    city: "Madrid",
    address: "Calle Ejemplo 1",
    phone: "+34 600 000 000",
  },
  dishes: [
    dish("1", "Ensalada de la huerta", 1, allFreeFrom()),
    dish("2", "Pan con tomate", 2, allFreeFrom([{ allergen: "gluten", level: "contains" }])),
    dish(
      "3",
      "Brownie sin gluten",
      3,
      allFreeFrom([
        { allergen: "eggs", level: "contains" },
        { allergen: "milk", level: "contains" },
        { allergen: "nuts", level: "may_contain" },
      ]),
    ),
    dish("4", "Croquetas caseras", 4, []),
  ],
};

function setProfile(consent: boolean, allergens: profile.HealthProfile["allergens"]) {
  mockProfile.getHealthProfile.mockResolvedValue({
    consentGivenAt: consent ? "2026-11-10T10:00:00Z" : null,
    allergens,
  });
}

async function openMenu() {
  mockAuth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
  mockMenu.getMenu.mockResolvedValue(MENU);
  await renderRouter("./src/app", { initialUrl: "/restaurante/la-huerta-demo" });
  await screen.findByRole("header", { name: "La Huerta Demo" });
}

function card(name: string) {
  const title = screen.getByText(name);
  // Sube hasta la tarjeta del plato (el contenedor con el nombre y su estado).
  let node = title.parent;
  while (node && !within(node).queryAllByText(/apto|trazas|datos|^El establecimiento/).length) {
    node = node.parent;
  }
  if (!node) throw new Error(`No se encuentra la tarjeta de ${name}`);
  return within(node);
}

beforeEach(() => {
  resetSupabaseMock();
  jest.clearAllMocks();
});

describe("carta filtrada con el perfil", () => {
  it("aplica el perfil guardado: estado y motivos de cada plato", async () => {
    setProfile(true, ["gluten", "nuts"]);
    await openMenu();
    expect(await screen.findByText("Filtrada con tu perfil de alergias.")).toBeTruthy();
    expect(
      screen.getByText("1 apto · 1 con posibles trazas · 1 sin datos suficientes · 1 no apto"),
    ).toBeTruthy();

    expect(card("Ensalada de la huerta").getByText(/Apto según lo declarado/)).toBeTruthy();
    expect(card("Pan con tomate").getByText(/No apto/)).toBeTruthy();
    expect(card("Pan con tomate").getByLabelText("Contiene: Cereales con gluten")).toBeTruthy();
    expect(card("Brownie sin gluten").getByText(/Puede contener trazas$/)).toBeTruthy();
    expect(
      card("Croquetas caseras").getByLabelText(
        "Sin datos sobre: Cereales con gluten, Frutos de cáscara",
      ),
    ).toBeTruthy();
    expect(mockMenu.getMenu).toHaveBeenCalledWith("la-huerta-demo");
  });

  it("un plato sin declaraciones nunca sale como apto", async () => {
    setProfile(true, ["lupin"]);
    await openMenu();
    await screen.findByText(/sin datos suficientes/);
    expect(card("Croquetas caseras").getByText(/Sin datos suficientes/)).toBeTruthy();
    expect(card("Croquetas caseras").queryByText(/Apto según lo declarado/)).toBeNull();
  });

  it("puede ocultar los platos no aptos", async () => {
    setProfile(true, ["gluten"]);
    await openMenu();
    await fireEvent(await screen.findByLabelText("Ocultar platos no aptos"), "valueChange", true);
    expect(await screen.findByText("1 plato no apto oculto.")).toBeTruthy();
    expect(screen.queryByText("Pan con tomate")).toBeNull();
    expect(screen.getByText("Croquetas caseras")).toBeTruthy(); // sin datos: no se oculta
  });

  it("se puede ajustar para esta carta sin cambiar el perfil guardado", async () => {
    setProfile(true, ["gluten"]);
    await openMenu();
    await screen.findByText("Filtrada con tu perfil de alergias.");
    expect(card("Brownie sin gluten").getByText(/Apto según lo declarado/)).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Ajustar alergias para esta carta" }));
    await fireEvent.press(screen.getByRole("switch", { name: "Leche y lácteos" }));
    expect(
      await screen.findByText("Ajustada solo para esta carta: tu perfil guardado no cambia."),
    ).toBeTruthy();
    expect(card("Brownie sin gluten").getByText(/No apto/)).toBeTruthy();
    expect(mockProfile.saveMyAllergens).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("button", { name: "Volver a mi perfil" }));
    expect(await screen.findByText("Filtrada con tu perfil de alergias.")).toBeTruthy();
    expect(card("Brownie sin gluten").getByText(/Apto según lo declarado/)).toBeTruthy();
  });

  it("sin perfil no muestra estados e invita a configurar las alergias", async () => {
    setProfile(false, []);
    await openMenu();
    expect(await screen.findByText("Selecciona tus alergias para filtrar la carta.")).toBeTruthy();
    expect(screen.queryByText(/Apto según lo declarado|No apto|Sin datos suficientes/)).toBeNull();
    expect(screen.getByRole("button", { name: "Configurar mis alergias" })).toBeTruthy();
  });

  it("muestra siempre el aviso obligatorio", async () => {
    setProfile(true, ["gluten"]);
    await openMenu();
    expect(
      screen.getAllByText(/Confirma siempre con el establecimiento y revisa la etiqueta física/),
    ).toHaveLength(2);
  });
});

describe("carta no disponible", () => {
  it("si no existe o no está publicada, lo dice", async () => {
    setProfile(true, []);
    mockAuth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
    mockMenu.getMenu.mockResolvedValue(null);
    await renderRouter("./src/app", { initialUrl: "/restaurante/no-existe" });
    expect(await screen.findByText(/Esta carta no existe/)).toBeTruthy();
  });
});

describe("desde la búsqueda", () => {
  it("al pulsar un restaurante se abre su carta", async () => {
    setProfile(true, []);
    mockAuth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
    mockRestaurants.searchRestaurantsByCity.mockResolvedValue([
      {
        id: "r1",
        name: "La Huerta Demo",
        slug: "la-huerta-demo",
        city: "Madrid",
        address: "Calle Ejemplo 1",
        latitude: null,
        longitude: null,
      },
    ]);
    mockMenu.getMenu.mockResolvedValue(MENU);
    await renderRouter("./src/app", { initialUrl: "/buscar" });
    await fireEvent.changeText(await screen.findByLabelText("Ciudad"), "Madrid");
    await fireEvent.press(screen.getByRole("button", { name: "Buscar" }));
    await fireEvent.press(await screen.findByRole("button", { name: /La Huerta Demo/ }));
    await waitFor(() => expect(mockMenu.getMenu).toHaveBeenCalledWith("la-huerta-demo"));
    expect(screen).toHavePathname("/restaurante/la-huerta-demo");
  });
});
