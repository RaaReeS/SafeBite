import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { secureSessionStorage } from "./secure-session-storage";

const secureStore = (SecureStore as unknown as { __store: Map<string, string> }).__store;

const SESSION = JSON.stringify({
  access_token: "token-de-acceso-muy-secreto",
  refresh_token: "token-de-refresco-secreto",
  user: { email: "comensal@safebite.test" },
});
const KEY = "sb-127-auth-token";

beforeEach(async () => {
  await AsyncStorage.clear();
  secureStore.clear();
  jest.clearAllMocks();
});

describe("secureSessionStorage", () => {
  it("guarda y recupera la sesión", async () => {
    await secureSessionStorage.setItem(KEY, SESSION);
    expect(await secureSessionStorage.getItem(KEY)).toBe(SESSION);
  });

  it("lo que queda en AsyncStorage está cifrado: no contiene los tokens ni el email", async () => {
    await secureSessionStorage.setItem(KEY, SESSION);
    const stored = await AsyncStorage.getItem(KEY);
    expect(stored).not.toBeNull();
    expect(stored).not.toContain("token-de-acceso");
    expect(stored).not.toContain("comensal@safebite.test");
    expect(stored).toMatch(/^[0-9a-f]+$/);
  });

  it("la clave va en SecureStore, solo accesible con el dispositivo desbloqueado y sin copiarse", async () => {
    await secureSessionStorage.setItem(KEY, SESSION);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      expect.stringMatching(/^[A-Za-z0-9._-]+$/),
      expect.stringMatching(/^[0-9a-f]{64}$/),
      { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
    );
    expect(secureStore.size).toBe(1);
  });

  it("cada escritura usa una clave nueva (no se reutiliza el flujo de cifrado)", async () => {
    await secureSessionStorage.setItem(KEY, SESSION);
    const firstKey = [...secureStore.values()][0];
    const firstCipher = await AsyncStorage.getItem(KEY);

    await secureSessionStorage.setItem(KEY, SESSION);
    const secondKey = [...secureStore.values()][0];
    const secondCipher = await AsyncStorage.getItem(KEY);

    expect(secondKey).not.toBe(firstKey);
    expect(secondCipher).not.toBe(firstCipher);
    expect(await secureSessionStorage.getItem(KEY)).toBe(SESSION);
  });

  it("sin la clave (p. ej. tras reinstalar), la sesión no se puede leer", async () => {
    await secureSessionStorage.setItem(KEY, SESSION);
    secureStore.clear();
    expect(await secureSessionStorage.getItem(KEY)).toBeNull();
  });

  it("si no hay sesión guardada devuelve null", async () => {
    expect(await secureSessionStorage.getItem(KEY)).toBeNull();
  });

  it("al cerrar sesión se borran los datos y la clave", async () => {
    await secureSessionStorage.setItem(KEY, SESSION);
    await secureSessionStorage.removeItem(KEY);
    expect(await AsyncStorage.getItem(KEY)).toBeNull();
    expect(secureStore.size).toBe(0);
  });

  it("acepta nombres de clave con caracteres que SecureStore no admite", async () => {
    await secureSessionStorage.setItem("sb:auth/token code", SESSION);
    expect(await secureSessionStorage.getItem("sb:auth/token code")).toBe(SESSION);
  });
});
