import AsyncStorage from "@react-native-async-storage/async-storage";
import { OFF_INGREDIENTS_COMPLETED, type OffProduct } from "@safebite/core";
import {
  HISTORY_LIMIT,
  addToHistory,
  clearHistory,
  getHistory,
  historyProduct,
} from "./product-history";

const USER = "user-1";
const KEY = `safebite.product-history.${USER}`;
const NOW = new Date("2026-11-12T10:00:00Z");

function product(code: string, overrides: Partial<OffProduct> = {}): OffProduct {
  return {
    code,
    name: "Galletas",
    brands: "Marca",
    imageUrl: "https://images.openfoodfacts.org/a.jpg",
    ingredientsText: "harina de trigo",
    allergensTags: ["en:gluten"],
    tracesTags: ["en:nuts"],
    statesTags: [OFF_INGREDIENTS_COMPLETED],
    ...overrides,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("historial de productos", () => {
  it("guarda los datos del producto, pero no los ingredientes ni el resultado del semáforo", async () => {
    expect(await getHistory(USER)).toEqual([]);
    await addToHistory(USER, product("4006381333931"), NOW);

    expect(await getHistory(USER)).toEqual([
      {
        code: "4006381333931",
        name: "Galletas",
        brands: "Marca",
        imageUrl: "https://images.openfoodfacts.org/a.jpg",
        allergensTags: ["en:gluten"],
        tracesTags: ["en:nuts"],
        statesTags: [OFF_INGREDIENTS_COMPLETED],
        scannedAt: NOW.toISOString(),
      },
    ]);
    const stored = (await AsyncStorage.getItem(KEY)) ?? "";
    expect(stored).not.toMatch(/harina|apto|status/);
  });

  it("devuelve el producto para evaluarlo con el filtro", async () => {
    const [entry] = await addToHistory(USER, product("4006381333931"), NOW);
    expect(entry && historyProduct(entry)).toEqual({
      ...product("4006381333931"),
      ingredientsText: null,
    });
  });

  it("el último escaneado va primero y un producto repetido no se duplica", async () => {
    await addToHistory(USER, product("4006381333931"), NOW);
    await addToHistory(USER, product("96385074"), NOW);
    const history = await addToHistory(USER, product("4006381333931"), NOW);
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
    for (const code of codes) history = await addToHistory(USER, product(code));
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0]?.code).toBe(codes.at(-1));
  });

  it("cada usuario tiene su propio historial", async () => {
    await addToHistory(USER, product("4006381333931"), NOW);
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

  it("entradas sin datos de alérgenos o con datos raros se leen sin ellos (semáforo sin datos)", async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify([
        {
          code: "4006381333931",
          name: "Antigua",
          brands: null,
          scannedAt: "x",
          imageUrl: "http://inseguro.test/a.jpg",
          allergensTags: "en:gluten",
          tracesTags: [1],
        },
      ]),
    );
    expect(await getHistory(USER)).toEqual([
      {
        code: "4006381333931",
        name: "Antigua",
        brands: null,
        imageUrl: null,
        allergensTags: null,
        tracesTags: null,
        statesTags: null,
        scannedAt: "x",
      },
    ]);
  });

  it("si no se puede guardar, no rompe el escaneo", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("lleno"));
    const history = await addToHistory(USER, product("96385074"), NOW);
    expect(history).toHaveLength(1);
  });

  it("se puede borrar", async () => {
    await addToHistory(USER, product("96385074"), NOW);
    await clearHistory(USER);
    expect(await getHistory(USER)).toEqual([]);
  });
});
