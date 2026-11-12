import AsyncStorage from "@react-native-async-storage/async-storage";
import { HISTORY_LIMIT, addToHistory, clearHistory, getHistory } from "./product-history";

const USER = "user-1";
const KEY = `safebite.product-history.${USER}`;
const NOW = new Date("2026-11-12T10:00:00Z");

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("historial de productos", () => {
  it("empieza vacío y guarda lo escaneado, sin el resultado del semáforo", async () => {
    expect(await getHistory(USER)).toEqual([]);
    await addToHistory(USER, { code: "4006381333931", name: "Galletas", brands: "Marca" }, NOW);

    expect(await getHistory(USER)).toEqual([
      { code: "4006381333931", name: "Galletas", brands: "Marca", scannedAt: NOW.toISOString() },
    ]);
    expect(await AsyncStorage.getItem(KEY)).not.toMatch(/apto|status/);
  });

  it("el último escaneado va primero y un producto repetido no se duplica", async () => {
    await addToHistory(USER, { code: "4006381333931", name: "A", brands: null }, NOW);
    await addToHistory(USER, { code: "96385074", name: "B", brands: null }, NOW);
    const history = await addToHistory(
      USER,
      { code: "4006381333931", name: "A", brands: null },
      NOW,
    );
    expect(history.map((entry) => entry.code)).toEqual(["4006381333931", "96385074"]);
  });

  it(`guarda como mucho ${HISTORY_LIMIT} productos`, async () => {
    // EAN-8 válidos distintos: 7 cifras + dígito de control.
    const codes = Array.from({ length: HISTORY_LIMIT + 5 }, (_, i) => {
      const base = String(1000000 + i);
      let sum = 0;
      for (let j = 0; j < 7; j++) sum += Number(base[6 - j]) * (j % 2 === 0 ? 3 : 1);
      return base + String((10 - (sum % 10)) % 10);
    });
    let history: Awaited<ReturnType<typeof getHistory>> = [];
    for (const code of codes)
      history = await addToHistory(USER, { code, name: null, brands: null });
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0]?.code).toBe(codes.at(-1));
  });

  it("cada usuario tiene su propio historial", async () => {
    await addToHistory(USER, { code: "4006381333931", name: "A", brands: null }, NOW);
    expect(await getHistory("otro-usuario")).toEqual([]);
  });

  it("descarta datos dañados o manipulados", async () => {
    await AsyncStorage.setItem(KEY, "{no es json");
    expect(await getHistory(USER)).toEqual([]);

    await AsyncStorage.setItem(KEY, JSON.stringify({ code: "4006381333931" }));
    expect(await getHistory(USER)).toEqual([]);

    await AsyncStorage.setItem(
      KEY,
      JSON.stringify([
        { code: "4006381333931", name: "Bien", brands: null, scannedAt: "x" },
        { code: "1234", name: "Código inválido", brands: null, scannedAt: "x" },
        { code: "96385074", name: 3, brands: null, scannedAt: "x" },
        { code: "96385074", name: null, brands: [], scannedAt: "x" },
        { code: "96385074", name: null, brands: null },
        null,
      ]),
    );
    expect((await getHistory(USER)).map((entry) => entry.name)).toEqual(["Bien"]);
  });

  it("si no se puede guardar, no rompe el escaneo", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("lleno"));
    const history = await addToHistory(USER, { code: "96385074", name: null, brands: null }, NOW);
    expect(history).toHaveLength(1);
  });

  it("se puede borrar", async () => {
    await addToHistory(USER, { code: "96385074", name: null, brands: null }, NOW);
    await clearHistory(USER);
    expect(await getHistory(USER)).toEqual([]);
  });
});
