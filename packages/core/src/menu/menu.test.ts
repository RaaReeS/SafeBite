import { describe, expect, it } from "vitest";
import { ALLERGENS } from "../allergens/allergens";
import type { AllergenDeclaration } from "../filter/evaluate";
import {
  buildMenu,
  countByStatus,
  groupDeclarationsByDish,
  restaurantSuitability,
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
