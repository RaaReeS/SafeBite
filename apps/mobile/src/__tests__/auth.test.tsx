import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { emitSession, fakeSession, mockAuth, resetSupabaseMock } from "@/test-utils/supabase-mock";

jest.mock(
  "@/lib/supabase",
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/test-utils/supabase-mock").supabaseModule,
);

// Navegación real de la app (src/app), con Supabase simulado.
async function renderApp(initialUrl = "/") {
  await renderRouter("./src/app", { initialUrl });
}

async function press(label: string | RegExp) {
  await fireEvent.press(screen.getByRole("button", { name: label }));
}

beforeEach(() => {
  resetSupabaseMock();
});

describe("acceso a la app", () => {
  it("sin sesión empieza en la bienvenida", async () => {
    await renderApp();
    expect(await screen.findByRole("button", { name: "Crear cuenta" })).toBeTruthy();
    expect(screen).toHavePathname("/bienvenida");
  });

  it("con una sesión guardada entra directamente y puede cerrar sesión", async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
    await renderApp();
    expect(await screen.findByText("Hola, comensal@safebite.test")).toBeTruthy();

    await press("Cerrar sesión");
    await waitFor(() => expect(mockAuth.signOut).toHaveBeenCalled());
    await act(async () => emitSession(null));
    expect(await screen.findByRole("button", { name: "Crear cuenta" })).toBeTruthy();
  });
});

describe("registro", () => {
  it("valida los datos antes de llamar a Supabase", async () => {
    await renderApp("/registro");
    await fireEvent.changeText(await screen.findByLabelText("Email"), "no-es-email");
    await fireEvent.changeText(screen.getByLabelText("Contraseña"), "corta");
    await press("Crear cuenta");

    expect(await screen.findByText("Introduce un email válido.")).toBeTruthy();
    expect(screen.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeTruthy();
    expect(
      screen.getByText("Debes aceptar los términos de uso y la política de privacidad."),
    ).toBeTruthy();
    expect(mockAuth.signUp).not.toHaveBeenCalled();
  });

  it("crea una cuenta de comensal (sin rol de restaurante) y pide el código", async () => {
    mockAuth.signUp.mockResolvedValue({ data: { session: null, user: {} }, error: null });
    await renderApp("/registro");
    await fireEvent.changeText(await screen.findByLabelText("Email"), "  Nueva@Correo.ES ");
    await fireEvent.changeText(screen.getByLabelText("Contraseña"), "contraseña-larga");
    await fireEvent.press(screen.getByRole("checkbox"));
    await press("Crear cuenta");

    await waitFor(() =>
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: "nueva@correo.es",
        password: "contraseña-larga",
        options: { data: { accepted_terms: true } },
      }),
    );
    expect(await screen.findByLabelText("Código")).toBeTruthy();
    expect(screen).toHavePathnameWithParams("/verificar?email=nueva%40correo.es");
  });
});

describe("verificación con código", () => {
  it("rechaza un código mal escrito sin llamar a Supabase", async () => {
    await renderApp("/verificar?email=a%40b.es");
    await fireEvent.changeText(await screen.findByLabelText("Código"), "12a4");
    await press("Confirmar");
    expect(await screen.findByText(/Escribe el código de 6 a 8 cifras/)).toBeTruthy();
    expect(mockAuth.verifyOtp).not.toHaveBeenCalled();
  });

  it("verifica el código (quitando espacios) y entra en la app", async () => {
    mockAuth.verifyOtp.mockResolvedValue({ data: {}, error: null });
    await renderApp("/verificar?email=a%40b.es");
    await fireEvent.changeText(await screen.findByLabelText("Código"), "123 456");
    await press("Confirmar");

    await waitFor(() =>
      expect(mockAuth.verifyOtp).toHaveBeenCalledWith({
        email: "a@b.es",
        token: "123456",
        type: "email",
      }),
    );
    await act(async () => emitSession(fakeSession("a@b.es")));
    expect(await screen.findByText("Hola, a@b.es")).toBeTruthy();
  });

  it("un código incorrecto muestra un error", async () => {
    mockAuth.verifyOtp.mockResolvedValue({ data: {}, error: { code: "otp_expired" } });
    await renderApp("/verificar?email=a%40b.es");
    await fireEvent.changeText(await screen.findByLabelText("Código"), "123456");
    await press("Confirmar");
    expect(await screen.findByText(/El código no es válido o ha caducado/)).toBeTruthy();
  });

  it("puede pedir que se reenvíe el código", async () => {
    mockAuth.resend.mockResolvedValue({ data: {}, error: null });
    await renderApp("/verificar?email=a%40b.es");
    await press("Reenviar el código");
    await waitFor(() =>
      expect(mockAuth.resend).toHaveBeenCalledWith({ type: "signup", email: "a@b.es" }),
    );
    expect(await screen.findByText(/te hemos enviado un código nuevo/)).toBeTruthy();
  });

  it("si se pide demasiado pronto, avisa de que hay que esperar", async () => {
    mockAuth.resend.mockResolvedValue({ data: {}, error: { code: "over_email_send_rate_limit" } });
    await renderApp("/verificar?email=a%40b.es");
    await press("Reenviar el código");
    expect(await screen.findByText(/Demasiados intentos/)).toBeTruthy();
  });
});

describe("inicio de sesión", () => {
  it("con credenciales incorrectas muestra un error genérico", async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: "invalid_credentials" },
    });
    await renderApp("/login");
    await fireEvent.changeText(await screen.findByLabelText("Email"), "a@b.es");
    await fireEvent.changeText(screen.getByLabelText("Contraseña"), "mala");
    await press("Entrar");
    expect(await screen.findByText("Email o contraseña incorrectos.")).toBeTruthy();
  });

  it("si el email no está confirmado, lleva a escribir el código", async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: {},
      error: { code: "email_not_confirmed" },
    });
    await renderApp("/login");
    await fireEvent.changeText(await screen.findByLabelText("Email"), "a@b.es");
    await fireEvent.changeText(screen.getByLabelText("Contraseña"), "contraseña-larga");
    await press("Entrar");
    expect(await screen.findByText(/Aún no has confirmado tu email/)).toBeTruthy();
    expect(screen).toHavePathnameWithParams("/verificar?email=a%40b.es&motivo=sin-confirmar");
  });
});

describe("recuperación de contraseña", () => {
  it("con el código y la contraseña nueva, la guarda antes de entrar en la app", async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    mockAuth.verifyOtp.mockImplementation(async () => {
      // Supabase abre la sesión en cuanto el código es válido...
      emitSession(fakeSession("a@b.es"));
      return { data: {}, error: null };
    });
    let resolveUpdate: (value: unknown) => void = () => undefined;
    mockAuth.updateUser.mockImplementation(
      () => new Promise((resolve) => (resolveUpdate = resolve)),
    );

    await renderApp("/recuperar");
    await fireEvent.changeText(await screen.findByLabelText("Email"), "a@b.es");
    await press("Enviar código");
    await waitFor(() => expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith("a@b.es"));

    await fireEvent.changeText(await screen.findByLabelText("Código"), "12345678");
    await fireEvent.changeText(screen.getByLabelText("Contraseña nueva"), "otra-contraseña");
    await fireEvent.changeText(screen.getByLabelText("Repite la contraseña"), "otra-contraseña");
    await press("Guardar contraseña");

    await waitFor(() =>
      expect(mockAuth.verifyOtp).toHaveBeenCalledWith({
        email: "a@b.es",
        token: "12345678",
        type: "recovery",
      }),
    );
    // ...pero no se entra en la app hasta haber guardado la contraseña nueva.
    expect(screen).toHavePathname("/nueva-contrasena");
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: "otra-contraseña" });

    await act(async () => resolveUpdate({ data: {}, error: null }));
    expect(await screen.findByText("Hola, a@b.es")).toBeTruthy();
  });

  it("valida que las contraseñas coincidan antes de usar el código", async () => {
    await renderApp("/nueva-contrasena?email=a%40b.es");
    await fireEvent.changeText(await screen.findByLabelText("Código"), "123456");
    await fireEvent.changeText(screen.getByLabelText("Contraseña nueva"), "otra-contraseña");
    await fireEvent.changeText(
      screen.getByLabelText("Repite la contraseña"),
      "distinta-contraseña",
    );
    await press("Guardar contraseña");
    expect(await screen.findByText("Las contraseñas no coinciden.")).toBeTruthy();
    expect(mockAuth.verifyOtp).not.toHaveBeenCalled();
  });
});
