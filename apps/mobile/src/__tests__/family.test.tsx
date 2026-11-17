import { ALLERGENS, type AllergenDeclaration } from "@safebite/core";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { Alert } from "react-native";
import * as family from "@/lib/family";
import type { Family } from "@/lib/family";
import * as menu from "@/lib/menu";
import * as profile from "@/lib/profile";
import { fakeSession, mockAuth, resetSupabaseMock } from "@/test-utils/supabase-mock";

jest.mock(
  "@/lib/supabase",
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/test-utils/supabase-mock").supabaseModule,
);
jest.mock("@/lib/profile", () => ({ getHealthProfile: jest.fn() }));
jest.mock("@/lib/menu", () => ({ getMenu: jest.fn() }));
jest.mock("@/lib/family", () => ({
  // La detección del error de límite es la real.
  isFamilyLimitError: jest.requireActual("@/lib/family").isFamilyLimitError,
  getFamily: jest.fn(),
  addFamilyMember: jest.fn(),
  setFamilyMemberAllergens: jest.fn(async () => undefined),
  renameFamilyMember: jest.fn(async () => undefined),
  deleteFamilyMember: jest.fn(async () => undefined),
}));

const mockProfile = jest.mocked(profile);
const mockFamily = jest.mocked(family);
const mockMenu = jest.mocked(menu);

const LUCIA = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Lucía",
  allergens: ["milk" as const],
};

function setFamily(value: Partial<Family>) {
  mockFamily.getFamily.mockResolvedValue({ members: [], plan: "free", limit: 1, ...value });
}

async function renderSignedIn(initialUrl: string) {
  mockAuth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
  await renderRouter("./src/app", { initialUrl });
}

async function press(label: string | RegExp) {
  await fireEvent.press(screen.getByRole("button", { name: label }));
}

beforeEach(() => {
  resetSupabaseMock();
  jest.clearAllMocks();
  // Yo: celíaco, con consentimiento.
  mockProfile.getHealthProfile.mockResolvedValue({
    consentGivenAt: "2026-11-17T10:00:00Z",
    allergens: ["gluten"],
  });
  setFamily({});
});

describe("Mi familia", () => {
  it("se abre desde el perfil y añade a alguien con la declaración de tutor", async () => {
    mockFamily.addFamilyMember.mockResolvedValue(LUCIA.id);
    await renderSignedIn("/inicio");
    await screen.findByLabelText("Tus alergias: Cereales con gluten.");
    await press("Perfil, pestaña 4 de 4");
    await press("Mi familia");
    expect(await screen.findByText("Aún no has añadido a nadie.")).toBeTruthy();
    expect(screen.getByText("0 de 1 familiares en tu plan.")).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText("Nombre o apodo"), "  Lucía ");
    await press("Añadir");
    expect(await screen.findByText(/necesitas su permiso o ser su tutor/)).toBeTruthy();
    expect(mockFamily.addFamilyMember).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByRole("checkbox", { name: /Soy su madre, padre o tutor/ }));
    setFamily({ members: [{ ...LUCIA, allergens: [] }] });
    await press("Añadir");
    await waitFor(() => expect(mockFamily.addFamilyMember).toHaveBeenCalledWith("Lucía"));
    expect(screen).toHavePathname(`/familiar/${LUCIA.id}`);
  });

  it("con el plan gratis lleno, avisa del premium y no deja añadir", async () => {
    setFamily({ members: [LUCIA] });
    await renderSignedIn("/familia");
    expect(await screen.findByText("1 de 1 familiares en tu plan.")).toBeTruthy();
    expect(screen.getByText(/El plan premium, con hasta 10/)).toBeTruthy();
    expect(screen.queryByLabelText("Nombre o apodo")).toBeNull();
  });

  it("si la base de datos rechaza por el límite, lo explica", async () => {
    mockFamily.addFamilyMember.mockRejectedValue({ code: "SB402" });
    await renderSignedIn("/familia");
    await fireEvent.changeText(await screen.findByLabelText("Nombre o apodo"), "Pablo");
    await fireEvent.press(screen.getByRole("checkbox", { name: /Soy su madre, padre o tutor/ }));
    await press("Añadir");
    expect(await screen.findByText(/Has llegado al número de familiares de tu plan/)).toBeTruthy();
  });

  it("sin consentimiento para datos de salud, primero pide configurar las propias", async () => {
    mockProfile.getHealthProfile.mockResolvedValue({ consentGivenAt: null, allergens: [] });
    await renderSignedIn("/familia");
    expect(await screen.findByText(/configura las tuyas y da tu consentimiento/)).toBeTruthy();
    expect(screen.queryByLabelText("Nombre o apodo")).toBeNull();
  });

  it("en su ficha se guardan sus alergias y se puede quitar", async () => {
    setFamily({ members: [LUCIA] });
    await renderSignedIn(`/familiar/${LUCIA.id}`);
    expect(await screen.findByText("Alergias de Lucía")).toBeTruthy();
    await fireEvent.press(screen.getByRole("checkbox", { name: "Huevos" }));
    await press("Guardar");
    await waitFor(() =>
      expect(mockFamily.setFamilyMemberAllergens).toHaveBeenCalledWith(LUCIA.id, ["milk", "eggs"]),
    );
    expect(await screen.findByText("Sus alergias se han guardado.")).toBeTruthy();

    jest.spyOn(Alert, "alert").mockImplementationOnce((_title, _message, buttons) => {
      buttons?.find((button) => button.style === "destructive")?.onPress?.();
    });
    await press("Quitar de mi familia");
    await waitFor(() => expect(mockFamily.deleteFamilyMember).toHaveBeenCalledWith(LUCIA.id));
  });

  it("un familiar que no es suyo no aparece", async () => {
    await renderSignedIn("/familiar/22222222-2222-4222-8222-222222222222");
    expect(await screen.findByText("Este familiar ya no está en tu familia.")).toBeTruthy();
  });
});

describe("¿para quién es? (carta)", () => {
  const free = ALLERGENS.map((allergen) => ({ allergen, level: "free_from" as const }));
  const withMilk: AllergenDeclaration[] = free.map((d) =>
    d.allergen === "milk" ? { ...d, level: "contains" } : d,
  );

  beforeEach(() => {
    setFamily({ members: [LUCIA] });
    mockMenu.getMenu.mockResolvedValue({
      restaurant: {
        id: "r1",
        name: "La Huerta Demo",
        slug: "la-huerta-demo",
        city: "Madrid",
        address: null,
        phone: null,
      },
      dishes: [
        {
          id: "d1",
          name: "Flan",
          description: null,
          price_cents: null,
          category: null,
          ingredients: null,
          sort_order: 1,
          allergens: withMilk,
        },
      ],
    });
  });

  it("por defecto filtra para toda la familia, y se puede quitar a alguien", async () => {
    await renderSignedIn("/restaurante/la-huerta-demo");
    expect(await screen.findByText("Filtrada para: Yo, Lucía.")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "Yo" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Lucía" })).toBeChecked();
    // El flan lleva leche: no es apto para el grupo (Lucía es alérgica).
    expect(screen.getByLabelText("No apto")).toBeTruthy();

    await fireEvent.press(screen.getByRole("checkbox", { name: "Lucía" }));
    expect(await screen.findByText("Filtrada para: Yo.")).toBeTruthy();
    expect(screen.getByLabelText("Apto según lo declarado")).toBeTruthy();

    // Siempre queda al menos una persona.
    await fireEvent.press(screen.getByRole("checkbox", { name: "Yo" }));
    expect(screen.getByRole("checkbox", { name: "Yo" })).toBeChecked();
  });

  it("sin familia no aparece el selector", async () => {
    setFamily({});
    await renderSignedIn("/restaurante/la-huerta-demo");
    expect(await screen.findByText("Filtrada con tu perfil de alergias.")).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "Yo" })).toBeNull();
  });
});
