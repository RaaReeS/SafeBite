// Simulaciones de módulos nativos para los tests (jest no ejecuta código nativo).

jest.mock("@react-native-async-storage/async-storage", () =>
  // jest.mock se eleva al principio del archivo: aquí solo se puede usar require().
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      if (!/^[A-Za-z0-9._-]+$/.test(key)) throw new Error(`Clave de SecureStore no válida: ${key}`);
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    __store: store,
  };
});

// Variables de entorno de prueba (el cliente de Supabase se simula en cada test).
process.env.EXPO_PUBLIC_SUPABASE_URL = "http://supabase.test";
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
process.env.EXPO_PUBLIC_SITE_URL = "https://safebite.test";

// El mapa nativo no existe en jest: MapView y Marker son vistas que muestran su
// contenido, y el Callout es un botón (pulsarlo = tocar la ficha del marcador).
jest.mock("react-native-maps", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pressable, View } = require("react-native");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  type MockProps = Record<string, unknown> & { children?: unknown };
  const MapView = (props: MockProps) =>
    React.createElement(
      View,
      { testID: props.testID, accessibilityLabel: props.accessibilityLabel },
      props.children,
    );
  const Marker = (props: MockProps) =>
    React.createElement(View, { testID: `marker-${String(props.title)}` }, props.children);
  const Callout = (props: MockProps) =>
    React.createElement(
      Pressable,
      { accessibilityRole: "button", onPress: props.onPress },
      props.children,
    );
  return { __esModule: true, default: MapView, Marker, Callout };
});
