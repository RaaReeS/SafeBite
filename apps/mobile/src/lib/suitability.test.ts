import { ALLERGENS } from "@safebite/core";
import { PAGE_SIZE, fetchAllPages, getSuitability } from "./suitability";

const tables: Record<string, unknown[]> = {};
const requests: { table: string; from: number; to: number }[] = [];

jest.mock("./supabase", () => ({
  supabase: {
    from: (table: string) => {
      const query = {
        select: () => query,
        order: () => query,
        range: async (from: number, to: number) => {
          requests.push({ table, from, to });
          return { data: (tables[table] ?? []).slice(from, to + 1), error: null };
        },
      };
      return query;
    },
  },
}));

beforeEach(() => {
  requests.length = 0;
  for (const key of Object.keys(tables)) delete tables[key];
});

describe("fetchAllPages", () => {
  it("pide páginas de 1000 hasta que una llega incompleta", async () => {
    const rows = Array.from({ length: PAGE_SIZE * 2 + 5 }, (_, i) => i);
    const result = await fetchAllPages(async (from, to) => ({
      data: rows.slice(from, to + 1),
      error: null,
    }));
    expect(result).toEqual(rows);
  });

  it("con una página exactamente llena, pide la siguiente (vacía) y para", async () => {
    const pages: number[] = [];
    const rows = Array.from({ length: PAGE_SIZE }, (_, i) => i);
    await fetchAllPages(async (from, to) => {
      pages.push(from);
      return { data: rows.slice(from, to + 1), error: null };
    });
    expect(pages).toEqual([0, PAGE_SIZE]);
  });

  it("un error de Supabase se propaga", async () => {
    await expect(
      fetchAllPages(async () => ({ data: null, error: new Error("sin red") })),
    ).rejects.toThrow("sin red");
  });

  it("sin datos devuelve una lista vacía", async () => {
    expect(await fetchAllPages(async () => ({ data: null, error: null }))).toEqual([]);
  });
});

describe("getSuitability", () => {
  it("evalúa las cartas públicas con el perfil, en el móvil", async () => {
    tables.public_dishes = [
      { id: "a1", restaurant_id: "A", category: null, sort_order: 1 },
      { id: "b1", restaurant_id: "B", category: null, sort_order: 1 },
    ];
    tables.public_dish_allergens = [
      ...ALLERGENS.map((allergen) => ({ dish_id: "a1", allergen, level: "free_from" })),
      { dish_id: "b1", allergen: "gluten", level: "contains" },
    ];
    expect(await getSuitability(["gluten"])).toEqual({
      A: { status: "apto", suitableDishes: 1 },
      B: { status: "no_apto", suitableDishes: 0 },
    });
    // Solo se leen las vistas públicas: nunca el perfil ni tablas privadas.
    expect(new Set(requests.map((r) => r.table))).toEqual(
      new Set(["public_dishes", "public_dish_allergens"]),
    );
  });
});
