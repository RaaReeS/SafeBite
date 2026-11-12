import AsyncStorage from "@react-native-async-storage/async-storage";
import { OFF_INGREDIENTS_COMPLETED, type OffProduct } from "@safebite/core";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as Camera from "expo-camera";
import { renderRouter } from "expo-router/testing-library";
import { Alert, Linking } from "react-native";
import * as profile from "@/lib/profile";
import { addToHistory, getHistory } from "@/lib/product-history";
import * as products from "@/lib/products";
import { fakeSession, mockAuth, resetSupabaseMock } from "@/test-utils/supabase-mock";

jest.mock(
  "@/lib/supabase",
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("@/test-utils/supabase-mock").supabaseModule,
);

jest.mock("@/lib/profile", () => ({ getHealthProfile: jest.fn() }));
jest.mock("@/lib/products", () => ({ lookupProduct: jest.fn() }));

// La cámara real no existe en jest: CameraView es una vista que guarda sus props
// para poder simular la lectura de un código.
jest.mock("expo-camera", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  const state: { props: Record<string, unknown> | null } = { props: null };
  return {
    __state: state,
    useCameraPermissions: jest.fn(),
    CameraView: (props: Record<string, unknown>) => {
      state.props = props;
      return <View testID="camera" />;
    },
  };
});

type CameraMock = typeof Camera & { __state: { props: Record<string, unknown> | null } };
const mockCamera = Camera as CameraMock;
const mockProfile = jest.mocked(profile);
const mockProducts = jest.mocked(products);
const USER_ID = fakeSession().user.id;
const CODE = "4006381333931";
const requestPermission = jest.fn();

function setPermission(permission: { granted: boolean; canAskAgain: boolean } | null) {
  jest
    .mocked(Camera.useCameraPermissions)
    .mockReturnValue([permission as never, requestPermission, jest.fn()]);
}

function setProfile(consentGivenAt: string | null, allergens: profile.HealthProfile["allergens"]) {
  mockProfile.getHealthProfile.mockResolvedValue({ consentGivenAt, allergens });
}

function offProduct(overrides: Partial<OffProduct> = {}): OffProduct {
  return {
    code: CODE,
    name: "Galletas María",
    brands: "Marca",
    imageUrl: null,
    ingredientsText: "harina de trigo, azúcar",
    allergensTags: [],
    tracesTags: [],
    statesTags: [OFF_INGREDIENTS_COMPLETED],
    ...overrides,
  };
}

function setLookup(result: products.ProductLookup) {
  mockProducts.lookupProduct.mockResolvedValue(result);
}

async function renderSignedIn(initialUrl: string) {
  mockAuth.getSession.mockResolvedValue({ data: { session: fakeSession() }, error: null });
  await renderRouter("./src/app", { initialUrl });
}

async function press(label: string | RegExp) {
  await fireEvent.press(screen.getByRole("button", { name: label }));
}

async function scan(data: string) {
  const onScanned = mockCamera.__state.props?.onBarcodeScanned as (r: { data: string }) => void;
  await act(async () => onScanned({ data }));
}

beforeEach(async () => {
  resetSupabaseMock();
  jest.clearAllMocks();
  mockCamera.__state.props = null;
  await AsyncStorage.clear();
  setPermission({ granted: true, canAskAgain: true });
  setProfile("2026-11-12T10:00:00Z", ["gluten"]);
});

describe("escáner", () => {
  it("se abre desde el inicio", async () => {
    await renderSignedIn("/inicio");
    await screen.findByText("Tus alergias: Cereales con gluten.");
    await press("Escanear producto");
    expect(await screen.findByTestId("camera")).toBeTruthy();
    expect(screen).toHavePathname("/escanear");
  });

  it("lee solo códigos de supermercado y abre el producto una sola vez", async () => {
    setLookup({ status: "found", product: offProduct() });
    await renderSignedIn("/escanear");
    await screen.findByTestId("camera");
    expect(mockCamera.__state.props?.barcodeScannerSettings).toEqual({
      barcodeTypes: ["ean13", "ean8", "upc_a"],
    });

    await scan("4006381333932"); // dígito de control incorrecto: se ignora
    expect(screen).toHavePathname("/escanear");

    await scan(CODE);
    await scan("96385074"); // la cámara sigue leyendo: no abre otro producto
    expect(await screen.findByText("Galletas María")).toBeTruthy();
    expect(screen).toHavePathname(`/producto/${CODE}`);
    expect(mockProducts.lookupProduct).toHaveBeenCalledTimes(1);
    expect(mockProducts.lookupProduct).toHaveBeenCalledWith(CODE);
  });

  it("explica para qué es la cámara antes de pedir permiso", async () => {
    setPermission({ granted: false, canAskAgain: true });
    await renderSignedIn("/escanear");
    expect(await screen.findByText(/solo para leer códigos de barras/)).toBeTruthy();
    expect(screen.queryByTestId("camera")).toBeNull();
    await press("Permitir la cámara");
    expect(requestPermission).toHaveBeenCalled();
  });

  it("sin permiso, ofrece Ajustes y escribir el código", async () => {
    setPermission({ granted: false, canAskAgain: false });
    const openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    await renderSignedIn("/escanear");
    await press("Abrir Ajustes");
    expect(openSettings).toHaveBeenCalled();
    expect(screen.getByLabelText("Código de barras")).toBeTruthy();
  });

  it("valida el código escrito a mano y acepta espacios", async () => {
    setLookup({ status: "found", product: offProduct() });
    await renderSignedIn("/escanear");
    await fireEvent.changeText(await screen.findByLabelText("Código de barras"), "1234");
    await press("Buscar producto");
    expect(await screen.findByText(/no es un código de barras válido/)).toBeTruthy();
    expect(mockProducts.lookupProduct).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText("Código de barras"), "4006 3813 33931");
    await press("Buscar producto");
    expect(await screen.findByText("Galletas María")).toBeTruthy();
    expect(mockProducts.lookupProduct).toHaveBeenCalledWith(CODE);
  });

  it("tiene un botón para ir al historial", async () => {
    await renderSignedIn("/escanear");
    await press("Historial de productos");
    expect(await screen.findByText("Aún no has escaneado ningún producto.")).toBeTruthy();
    expect(screen).toHavePathname("/historial");
  });
});

describe("historial", () => {
  const GLUTEN = "96385074";
  const MILK = "036000291452";

  async function fillHistory() {
    await addToHistory(
      USER_ID,
      offProduct({ code: MILK, name: "Leche", brands: null, allergensTags: ["en:milk"] }),
    );
    await addToHistory(
      USER_ID,
      offProduct({
        code: GLUTEN,
        name: "Pan de molde",
        imageUrl: "https://images.openfoodfacts.org/pan.jpg",
        allergensTags: ["en:gluten"],
      }),
    );
  }

  it("muestra foto, nombre y si es apto o no sin abrir el producto", async () => {
    await fillHistory();
    await renderSignedIn("/historial");

    expect(
      await screen.findByRole("button", { name: "Pan de molde, Marca, No apto" }),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Leche, Apto según lo declarado" })).toBeTruthy();
    expect(screen.getByTestId(`history-image-${GLUTEN}`).props.source).toEqual({
      uri: "https://images.openfoodfacts.org/pan.jpg",
    });
    // El historial no consulta Open Food Facts.
    expect(mockProducts.lookupProduct).not.toHaveBeenCalled();
  });

  it("el semáforo se calcula con el perfil actual", async () => {
    setProfile("2026-11-12T10:00:00Z", ["milk"]);
    await fillHistory();
    await renderSignedIn("/historial");
    expect(await screen.findByRole("button", { name: "Leche, No apto" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Pan de molde, Marca, Apto según lo declarado" }),
    ).toBeTruthy();
  });

  it("sin perfil no muestra semáforo", async () => {
    setProfile(null, []);
    await fillHistory();
    await renderSignedIn("/historial");
    expect(await screen.findByRole("button", { name: "Pan de molde, Marca" })).toBeTruthy();
    expect(screen.getByText(/Configura tus alergias para ver aquí/)).toBeTruthy();
  });

  it("al tocar un producto abre su ficha", async () => {
    await fillHistory();
    setLookup({ status: "found", product: offProduct({ code: GLUTEN, name: "Pan de molde" }) });
    await renderSignedIn("/historial");
    await press(/^Pan de molde/);
    expect(screen).toHavePathname(`/producto/${GLUTEN}`);
    expect(mockProducts.lookupProduct).toHaveBeenCalledWith(GLUTEN);
  });

  it("borrar el historial pide confirmación", async () => {
    await fillHistory();
    await renderSignedIn("/historial");
    await screen.findByRole("button", { name: /^Leche/ });

    jest.spyOn(Alert, "alert").mockImplementationOnce(() => undefined); // Cancelar.
    await press("Borrar historial");
    expect(await getHistory(USER_ID)).toHaveLength(2);

    jest.spyOn(Alert, "alert").mockImplementationOnce((_title, _message, buttons) => {
      buttons?.find((button) => button.style === "destructive")?.onPress?.();
    });
    await press("Borrar historial");
    expect(await screen.findByText("Historial borrado.")).toBeTruthy();
    expect(screen.getByText("Aún no has escaneado ningún producto.")).toBeTruthy();
    expect(await getHistory(USER_ID)).toEqual([]);
  });
});

describe("resultado del producto", () => {
  it("contiene un alérgeno del perfil: no apto, con el motivo", async () => {
    setLookup({ status: "found", product: offProduct({ allergensTags: ["en:gluten"] }) });
    await renderSignedIn(`/producto/${CODE}`);
    expect(await screen.findByLabelText("No apto")).toBeTruthy();
    expect(screen.getByLabelText("Contiene: Cereales con gluten")).toBeTruthy();
    expect(screen.getByText(/revisa siempre la etiqueta física/)).toBeTruthy();
  });

  it("puede contener trazas: posibles trazas", async () => {
    setLookup({ status: "found", product: offProduct({ tracesTags: ["en:gluten"] }) });
    await renderSignedIn(`/producto/${CODE}`);
    expect(await screen.findByLabelText("Puede contener trazas")).toBeTruthy();
  });

  it("ingredientes completos y sin alérgenos del perfil: apto, y se guarda en el historial", async () => {
    setLookup({ status: "found", product: offProduct({ allergensTags: ["en:milk"] }) });
    await renderSignedIn(`/producto/${CODE}`);
    expect(await screen.findByLabelText("Apto según lo declarado")).toBeTruthy();
    expect(screen.getByText(/la lista de ingredientes está completa/)).toBeTruthy();
    await waitFor(() =>
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        `safebite.product-history.${USER_ID}`,
        expect.stringContaining(CODE),
      ),
    );
  });

  it("con los ingredientes incompletos nunca es apto: sin datos", async () => {
    setLookup({ status: "found", product: offProduct({ statesTags: [] }) });
    await renderSignedIn(`/producto/${CODE}`);
    expect(await screen.findByLabelText("Sin datos suficientes")).toBeTruthy();
    expect(screen.getByLabelText("Sin datos sobre: Cereales con gluten")).toBeTruthy();
    expect(screen.queryByLabelText("Apto según lo declarado")).toBeNull();
  });

  it("sin perfil de alergias no muestra semáforo e invita a configurarlo", async () => {
    setProfile(null, []);
    setLookup({ status: "found", product: offProduct() });
    await renderSignedIn(`/producto/${CODE}`);
    expect(await screen.findByText(/Configura tus alergias/)).toBeTruthy();
    expect(screen.queryByLabelText("Apto según lo declarado")).toBeNull();
  });

  it("si no está en Open Food Facts, lo dice y permite añadirlo", async () => {
    setLookup({ status: "not_found" });
    const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue();
    await renderSignedIn(`/producto/${CODE}`);
    expect(await screen.findByText(/No hemos encontrado este producto/)).toBeTruthy();
    await press("Añadir este producto a Open Food Facts");
    expect(openURL).toHaveBeenCalledWith(
      `https://world.openfoodfacts.org/cgi/product.pl?type=add&code=${CODE}`,
    );
    expect(await getHistory(USER_ID)).toEqual([]);
  });

  it("sin conexión permite reintentar", async () => {
    setLookup({ status: "network_error" });
    await renderSignedIn(`/producto/${CODE}`);
    expect(await screen.findByText(/No hay conexión/)).toBeTruthy();
    setLookup({ status: "found", product: offProduct() });
    await press("Reintentar");
    expect(await screen.findByText("Galletas María")).toBeTruthy();
  });

  it("Open Food Facts no disponible", async () => {
    setLookup({ status: "unavailable" });
    await renderSignedIn(`/producto/${CODE}`);
    expect(await screen.findByText(/no responde ahora mismo/)).toBeTruthy();
  });

  it("un código manipulado en la ruta no se consulta", async () => {
    await renderSignedIn("/producto/1234");
    expect(await screen.findByText(/No hemos podido leer los datos/)).toBeTruthy();
    expect(mockProducts.lookupProduct).not.toHaveBeenCalled();
  });
});
