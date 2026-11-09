import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { Alert } from "react-native";
import * as profile from "@/lib/profile";
import { emitSession, fakeSession, mockAuth, resetSupabaseMock } from "@/test-utils/supabase-mock";

jest.mock(
  "@/lib/supabase",
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/test-utils/supabase-mock").supabaseModule,
);

jest.mock("@/lib/profile", () => ({
  getHealthProfile: jest.fn(),
  giveHealthConsent: jest.fn(async () => undefined),
  withdrawHealthConsent: jest.fn(async () => undefined),
  saveMyAllergens: jest.fn(async () => undefined),
  deleteMyAccount: jest.fn(async () => undefined),
}));

const mockProfile = jest.mocked(profile);
const USER_ID = fakeSession().user.id;

function setProfile(consentGivenAt: string | null, allergens: profile.HealthProfile["allergens"]) {
  mockProfile.getHealthProfile.mockResolvedValue({ consentGivenAt, allergens });
}

async function renderSignedIn(initialUrl: string) {
  mockAuth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
  await renderRouter("./src/app", { initialUrl });
}

async function press(label: string) {
  await fireEvent.press(screen.getByRole("button", { name: label }));
}

/** Simula pulsar el botón destructivo de un diálogo nativo de confirmación. */
function confirmNextAlert() {
  jest.spyOn(Alert, "alert").mockImplementationOnce((_title, _message, buttons) => {
    buttons?.find((button) => button.style === "destructive")?.onPress?.();
  });
}

beforeEach(() => {
  resetSupabaseMock();
  jest.clearAllMocks();
});

describe("inicio", () => {
  it("sin consentimiento invita a configurar las alergias", async () => {
    setProfile(null, []);
    await renderSignedIn("/inicio");
    expect(await screen.findByText("Aún no has configurado tus alergias.")).toBeTruthy();
    await press("Configurar mis alergias");
    expect(await screen.findByText("Tus datos de salud")).toBeTruthy();
  });

  it("con perfil muestra las alergias guardadas", async () => {
    setProfile("2026-11-10T10:00:00Z", ["gluten", "milk"]);
    await renderSignedIn("/inicio");
    expect(
      await screen.findByText("Tus alergias: Cereales con gluten, Leche y lácteos."),
    ).toBeTruthy();
  });
});

describe("consentimiento para datos de salud", () => {
  it("explica qué se guarda y no deja continuar sin marcar el consentimiento", async () => {
    setProfile(null, []);
    await renderSignedIn("/alergias");
    expect(await screen.findByText(/Nunca se comparte con los restaurantes/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    await press("Continuar");
    expect(mockProfile.giveHealthConsent).not.toHaveBeenCalled();
  });

  it("al aceptar registra el consentimiento y muestra los alérgenos para elegir", async () => {
    setProfile(null, []);
    await renderSignedIn("/alergias");
    await fireEvent.press(await screen.findByRole("checkbox", { name: /Doy mi consentimiento/ }));
    setProfile("2026-11-10T10:00:00Z", []);
    await press("Continuar");
    await waitFor(() => expect(mockProfile.giveHealthConsent).toHaveBeenCalledWith(USER_ID));
    expect(await screen.findByRole("checkbox", { name: "Cereales con gluten" })).toBeTruthy();
    expect(screen.getAllByRole("checkbox")).toHaveLength(14);
  });
});

describe("perfil de alergias", () => {
  it("parte de lo guardado y guarda la nueva selección de una vez", async () => {
    setProfile("2026-11-10T10:00:00Z", ["gluten"]);
    await renderSignedIn("/alergias");
    const gluten = await screen.findByRole("checkbox", { name: "Cereales con gluten" });
    await waitFor(() => expect(gluten).toBeChecked());

    await fireEvent.press(gluten);
    await fireEvent.press(screen.getByRole("checkbox", { name: "Frutos de cáscara" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Sésamo" }));
    await press("Guardar");
    await waitFor(() =>
      expect(mockProfile.saveMyAllergens).toHaveBeenCalledWith(["nuts", "sesame"]),
    );
  });

  it("si el guardado falla, avisa de que no se ha cambiado nada", async () => {
    setProfile("2026-11-10T10:00:00Z", ["gluten"]);
    mockProfile.saveMyAllergens.mockRejectedValueOnce(new Error("sin red"));
    await renderSignedIn("/alergias");
    await screen.findByRole("checkbox", { name: "Cereales con gluten" });
    await press("Guardar");
    expect(await screen.findByText(/No se ha cambiado nada/)).toBeTruthy();
  });
});

describe("mi cuenta", () => {
  it("retirar el consentimiento pide confirmación y borra las alergias", async () => {
    setProfile("2026-11-10T10:00:00Z", ["gluten"]);
    await renderSignedIn("/cuenta");
    await screen.findByRole("button", { name: "Retirar consentimiento y borrar mis alergias" });

    jest.spyOn(Alert, "alert").mockImplementationOnce(() => undefined); // Cancelar.
    await press("Retirar consentimiento y borrar mis alergias");
    expect(mockProfile.withdrawHealthConsent).not.toHaveBeenCalled();

    confirmNextAlert();
    setProfile(null, []);
    await press("Retirar consentimiento y borrar mis alergias");
    await waitFor(() => expect(mockProfile.withdrawHealthConsent).toHaveBeenCalledWith(USER_ID));
    expect(await screen.findByText(/tus alergias se han borrado/)).toBeTruthy();
  });

  it("borrar la cuenta pide confirmación, la borra y vuelve a la bienvenida", async () => {
    setProfile(null, []);
    await renderSignedIn("/cuenta");
    await screen.findByRole("button", { name: "Borrar mi cuenta" });

    confirmNextAlert();
    await press("Borrar mi cuenta");
    await waitFor(() => expect(mockProfile.deleteMyAccount).toHaveBeenCalled());
    await act(async () => emitSession(null));
    expect(await screen.findByRole("button", { name: "Crear cuenta" })).toBeTruthy();
  });
});
