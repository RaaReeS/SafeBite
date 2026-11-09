import "react-native-get-random-values";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as aesjs from "aes-js";
import * as SecureStore from "expo-secure-store";

/**
 * Almacenamiento cifrado de la sesión de Supabase (patrón recomendado por
 * Supabase para Expo).
 *
 * - SecureStore (Keychain en iOS, Keystore en Android) solo admite ~2 KB, y la
 *   sesión ocupa más. Por eso la sesión se cifra con AES-256 y se guarda en
 *   AsyncStorage, y SOLO la clave va en SecureStore.
 * - Cada escritura genera una clave nueva: con AES-CTR nunca se reutiliza el
 *   mismo par clave/contador para dos valores distintos.
 * - La clave solo es accesible con el dispositivo desbloqueado y no se copia a
 *   otros dispositivos ni a copias de seguridad.
 */

const KEY_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// SecureStore solo admite claves con [A-Za-z0-9._-].
function secureStoreKey(key: string): string {
  return `sb-key.${key.replace(/[^A-Za-z0-9._-]/g, "_")}`;
}

function newEncryptionKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(256 / 8));
}

function encrypt(key: Uint8Array, value: string): string {
  const cipher = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(1));
  return aesjs.utils.hex.fromBytes(cipher.encrypt(aesjs.utils.utf8.toBytes(value)));
}

function decrypt(key: Uint8Array, value: string): string {
  const cipher = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(1));
  return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (encrypted === null) return null;
    const hexKey = await SecureStore.getItemAsync(secureStoreKey(key), KEY_OPTIONS);
    // Sin clave (p. ej. tras reinstalar la app) los datos no se pueden leer:
    // se tratan como inexistentes y el usuario vuelve a iniciar sesión.
    if (hexKey === null) return null;
    return decrypt(aesjs.utils.hex.toBytes(hexKey), encrypted);
  },

  async setItem(key: string, value: string): Promise<void> {
    const encryptionKey = newEncryptionKey();
    await SecureStore.setItemAsync(
      secureStoreKey(key),
      aesjs.utils.hex.fromBytes(encryptionKey),
      KEY_OPTIONS,
    );
    await AsyncStorage.setItem(key, encrypt(encryptionKey, value));
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(secureStoreKey(key), KEY_OPTIONS);
  },
};
