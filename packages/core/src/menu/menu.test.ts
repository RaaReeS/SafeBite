import { describe, expect, it } from "vitest";
import { ALLERGENS } from "../allergens/allergens";
import type { AllergenDeclaration } from "../filter/evaluate";
import {
  buildAllergenTable,
  buildMenu,
  countByStatus,
  groupDeclarationsByDish,
  restaurantSuitability,
  suitabilityByRestaurant,
  type MenuDishInput,
} from "./menu";

type TestDish = MenuDishInput & { id: string; name: string };

function dish(
  id: string,
  category: string | null,
  sortOrder: number,
  allergens: AllergenDeclaration[] = [],
): TestDish {
  return { id, name: `Plato ${id}`, category, sort_order: sortOrder, allergens };
}

const allFreeFrom = (): AllergenDeclaration[] =>
  ALLERGENS.map((allergen) => ({ allergen, level: "free_from" }));

describe("buildMenu: agrupación", () => {
  it("agrupa por categoría en el orden en que aparecen según sort_order", () => {
    const menu = buildMenu(
      [
        dish("postre", "Postres", 3),
        dish("ensalada", "Entrantes", 1),
        dish("filete", "Principales", 2),
        dish("croquetas", "Entrantes", 4),
      ],
      [],
    );
    expect(menu.map((section) => section.category)).toEqual([
      "Entrantes",
      "Principales",
      "Postres",
    ]);
    expect(menu[0]?.dishes.map((d) => d.dish.id)).toEqual(["ensalada", "croquetas"]);
  });

  it("ordena los platos de cada sección por sort_order aunque lleguen desordenados", () => {
    const menu = buildMenu(
      [dish("c", "Entrantes", 30), dish("a", "Entrantes", 10), dish("b", "Entrantes", 20)],
      [],
    );
    expect(menu[0]?.dishes.map((d) => d.dish.id)).toEqual(["a", "b", "c"]);
  });

  it("pone los platos sin categoría en una sección al final", () => {
    const menu = buildMenu(
      [dish("suelto", null, 1), dish("ensalada", "Entrantes", 2), dish("otro", "  ", 3)],
      [],
    );
    expect(menu.map((section) => section.category)).toEqual(["Entrantes", null]);
    expect(menu[1]?.dishes.map((d) => d.dish.id)).toEqual(["suelto", "otro"]);
  });

  it("une categorías que solo difieren en mayúsculas o espacios y usa el primer nombre", () => {
    const menu = buildMenu(
      [dish("a", "Entrantes", 1), dish("b", " entrantes ", 2), dish("c", "ENTRANTES", 3)],
      [],
    );
    expect(menu).toHaveLength(1);
    expect(menu[0]?.category).toBe("Entrantes");
    expect(menu[0]?.dishes).toHaveLength(3);
  });

  it("muestra el nombre de la categoría sin espacios sobrantes", () => {
    const menu = buildMenu(
      [dish("a", "  Postres caseros ", 1), dish("b", "postres caseros", 2)],
      [],
    );
    expect(menu.map((section) => section.category)).toEqual(["Postres caseros"]);
  });

  it("una categoría de solo espacios cuenta como «sin categoría» aunque sea la primera", () => {
    const menu = buildMenu([dish("a", "   ", 1), dish("b", null, 2)], []);
    expect(menu).toHaveLength(1);
    expect(menu[0]?.category).toBeNull();
    expect(menu[0]?.dishes).toHaveLength(2);
  });

  it("una carta sin platos no tiene secciones", () => {
    expect(buildMenu([], ["gluten"])).toEqual([]);
  });

  it("no modifica la lista de entrada", () => {
    const dishes = Object.freeze([dish("b", "X", 2), dish("a", "X", 1)]);
    buildMenu(dishes, ["gluten"]);
    expect(dishes.map((d) => d.id)).toEqual(["b", "a"]);
  });
});

describe("buildMenu: evaluación de cada plato", () => {
  const dishes = [
    dish("pan", "Entrantes", 1, [
      ...allFreeFrom().filter((d) => d.allergen !== "gluten"),
      { allergen: "gluten", level: "contains" },
    ]),
    dish("ensalada", "Entrantes", 2, allFreeFrom()),
    dish("brownie", "Postres", 3, [
      ...allFreeFrom().filter((d) => d.allergen !== "nuts"),
      { allergen: "nuts", level: "may_contain" },
    ]),
    dish("croquetas", "Entrantes", 4),
  ];

  it("evalúa cada plato con el perfil del usuario", () => {
    const menu = buildMenu(dishes, ["gluten", "nuts"]);
    const statuses = Object.fromEntries(
      menu.flatMap((s) => s.dishes).map((d) => [d.dish.id, d.evaluation.status]),
    );
    expect(statuses).toEqual({
      pan: "no_apto",
      ensalada: "apto",
      brownie: "posibles_trazas",
      croquetas: "sin_datos",
    });
  });

  it("incluye los motivos de cada estado", () => {
    const croquetas = buildMenu(dishes, ["gluten", "nuts"])
      .flatMap((s) => s.dishes)
      .find((d) => d.dish.id === "croquetas");
    expect(croquetas?.evaluation.missing).toEqual(["gluten", "nuts"]);
  });

  it("con el perfil vacío todos los platos son apto (la interfaz no muestra etiquetas)", () => {
    const statuses = buildMenu(dishes, [])
      .flatMap((s) => s.dishes)
      .map((d) => d.evaluation.status);
    expect(statuses).toEqual(["apto", "apto", "apto", "apto"]);
  });

  it("conserva los datos originales del plato", () => {
    const menu = buildMenu(dishes, []);
    expect(menu[0]?.dishes[0]?.dish).toBe(dishes[0]);
  });
});

describe("countByStatus", () => {
  it("cuenta los platos de cada estado", () => {
    const menu = buildMenu(
      [
        dish("a", null, 1, allFreeFrom()),
        dish("b", null, 2, allFreeFrom()),
        dish("c", null, 3),
        dish("d", null, 4, [{ allergen: "milk", level: "contains" }]),
      ],
      ["milk"],
    );
    expect(countByStatus(menu)).toEqual({ apto: 2, no_apto: 1, posibles_trazas: 0, sin_datos: 1 });
  });

  it("una carta vacía tiene todos los contadores a cero", () => {
    expect(countByStatus([])).toEqual({ apto: 0, no_apto: 0, posibles_trazas: 0, sin_datos: 0 });
  });
});

describe("groupDeclarationsByDish", () => {
  it("agrupa las filas de dish_allergens por plato", () => {
    const grouped = groupDeclarationsByDish([
      { dish_id: "a", allergen: "gluten", level: "contains" },
      { dish_id: "b", allergen: "milk", level: "free_from" },
      { dish_id: "a", allergen: "eggs", level: "may_contain" },
    ]);
    expect(grouped.get("a")).toEqual([
      { allergen: "gluten", level: "contains" },
      { allergen: "eggs", level: "may_contain" },
    ]);
    expect(grouped.get("b")).toEqual([{ allergen: "milk", level: "free_from" }]);
  });

  it("un plato sin filas no aparece (sus alérgenos quedarán sin datos)", () => {
    expect(groupDeclarationsByDish([]).get("a")).toBeUndefined();
  });
});

describe("restaurantSuitability: ¿puedo comer en este restaurante?", () => {
  const celiac = ["gluten"] as const;
  const glutenFree = () => dish("apto", null, 1, allFreeFrom());
  const withGluten = () =>
    dish("no", null, 2, [
      ...allFreeFrom().filter((d) => d.allergen !== "gluten"),
      { allergen: "gluten", level: "contains" },
    ]);
  const glutenTraces = () =>
    dish("trazas", null, 3, [
      ...allFreeFrom().filter((d) => d.allergen !== "gluten"),
      { allergen: "gluten", level: "may_contain" },
    ]);
  const noData = () => dish("sin", null, 4);

  it("con un solo plato apto, el restaurante es apto (y cuenta cada estado)", () => {
    expect(
      restaurantSuitability([withGluten(), glutenTraces(), noData(), glutenFree()], celiac),
    ).toEqual({
      status: "apto",
      counts: { apto: 1, posibles_trazas: 1, sin_datos: 1, no_apto: 1 },
    });
  });

  it("sin platos aptos, nunca es apto: gana el mejor de los demás", () => {
    expect(restaurantSuitability([withGluten(), noData(), glutenTraces()], celiac).status).toBe(
      "posibles_trazas",
    );
    expect(restaurantSuitability([withGluten(), noData()], celiac).status).toBe("sin_datos");
    expect(restaurantSuitability([withGluten()], celiac).status).toBe("no_apto");
  });

  it("un restaurante sin platos queda sin datos", () => {
    expect(restaurantSuitability([], celiac)).toEqual({
      status: "sin_datos",
      counts: { apto: 0, posibles_trazas: 0, sin_datos: 0, no_apto: 0 },
    });
  });

  it("usa el mismo filtro que la carta: con varias alergias, todas cuentan", () => {
    // Sin gluten pero con trazas de frutos de cáscara: no es apto para quien evita ambos.
    const nutTraces = dish("nueces", null, 1, [
      ...allFreeFrom().filter((d) => d.allergen !== "nuts"),
      { allergen: "nuts", level: "may_contain" },
    ]);
    expect(restaurantSuitability([nutTraces], ["gluten", "nuts"]).status).toBe("posibles_trazas");
    expect(restaurantSuitability([nutTraces], ["gluten"]).status).toBe("apto");
  });
});

describe("suitabilityByRestaurant: el mapa de restaurantes", () => {
  const free = (dishId: string) =>
    ALLERGENS.map((allergen) => ({ dish_id: dishId, allergen, level: "free_from" as const }));

  it("agrupa los platos por restaurante y resume cada uno con el perfil", () => {
    const dishes = [
      { id: "a1", restaurant_id: "A", category: null, sort_order: 1 },
      { id: "a2", restaurant_id: "A", category: "Postres", sort_order: 2 },
      { id: "b1", restaurant_id: "B", category: null, sort_order: 1 },
    ];
    const declarations = [
      ...free("a1"),
      ...free("a2"),
      // El plato de B contiene gluten.
      ...free("b1").map((d) =>
        d.allergen === "gluten" ? { ...d, level: "contains" as const } : d,
      ),
    ];
    expect(suitabilityByRestaurant(dishes, declarations, ["gluten"])).toEqual({
      A: { status: "apto", suitableDishes: 2 },
      B: { status: "no_apto", suitableDishes: 0 },
    });
  });

  it("un plato sin declaraciones cuenta como sin datos, nunca como apto", () => {
    expect(
      suitabilityByRestaurant(
        [{ id: "c1", restaurant_id: "C", category: null, sort_order: 1 }],
        [],
        ["milk"],
      ),
    ).toEqual({ C: { status: "sin_datos", suitableDishes: 0 } });
  });

  it("los restaurantes sin platos no aparecen", () => {
    expect(suitabilityByRestaurant([], free("x"), ["milk"])).toEqual({});
  });
});

describe("buildAllergenTable: tabla imprimible de la carta", () => {
  it("una fila por plato con los 14 alérgenos, en el orden y las categorías de la carta", () => {
    const table = buildAllergenTable([
      dish("postre", "Postres", 2, [{ allergen: "milk", level: "contains" }]),
      dish("ensalada", "Entrantes", 1, allFreeFrom()),
      dish("pan", null, 3),
    ]);
    expect(table.map((s) => s.category)).toEqual(["Entrantes", "Postres", null]);
    const [ensalada] = table[0]?.rows ?? [];
    expect(ensalada?.dish.id).toBe("ensalada");
    expect(Object.keys(ensalada?.levels ?? {})).toEqual([...ALLERGENS]);
    expect(Object.values(ensalada?.levels ?? {}).every((l) => l === "free_from")).toBe(true);

    const postre = table[1]?.rows[0];
    expect(postre?.levels.milk).toBe("contains");
    expect(postre?.levels.gluten).toBeNull();
  });

  it("un plato sin declaraciones queda todo sin declarar, nunca «no contiene»", () => {
    const [section] = buildAllergenTable([dish("pan", null, 1)]);
    expect(Object.values(section?.rows[0]?.levels ?? {})).toEqual(ALLERGENS.map(() => null));
  });

  it("con varias declaraciones del mismo alérgeno, gana la más grave", () => {
    const [section] = buildAllergenTable([
      dish("x", null, 1, [
        { allergen: "eggs", level: "free_from" },
        { allergen: "eggs", level: "contains" },
        { allergen: "eggs", level: "may_contain" },
        { allergen: "fish", level: "may_contain" },
        { allergen: "fish", level: "free_from" },
        { allergen: "soybeans", level: "free_from" },
        { allergen: "soybeans", level: "may_contain" },
      ]),
    ]);
    const levels = section?.rows[0]?.levels;
    expect(levels?.eggs).toBe("contains");
    expect(levels?.fish).toBe("may_contain");
    expect(levels?.soybeans).toBe("may_contain");
  });

  it("ignora declaraciones inválidas: el alérgeno queda sin declarar", () => {
    const [section] = buildAllergenTable([
      dish("x", null, 1, [
        { allergen: "inventado", level: "contains" } as unknown as AllergenDeclaration,
        { allergen: "milk", level: "quizas" } as unknown as AllergenDeclaration,
      ]),
    ]);
    expect(Object.values(section?.rows[0]?.levels ?? {}).every((l) => l === null)).toBe(true);
  });

  it("una carta sin platos da una tabla vacía", () => {
    expect(buildAllergenTable([])).toEqual([]);
  });
});
