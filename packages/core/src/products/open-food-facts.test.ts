import { describe, expect, it } from "vitest";
import { ALLERGENS } from "../allergens/allergens";
import { evaluateAllergens } from "../filter/evaluate";
import {
  OFF_ALLERGEN_TAGS,
  OFF_INGREDIENTS_COMPLETED,
  OFF_PRODUCT_FIELDS,
  offAddProductUrl,
  parseOffResponse,
  productDeclarations,
  type OffProduct,
} from "./open-food-facts";

const CODE = "4006381333931";

function product(overrides: Partial<OffProduct> = {}): OffProduct {
  return {
    code: CODE,
    name: "Galletas",
    brands: null,
    imageUrl: null,
    ingredientsText: null,
    allergensTags: [],
    tracesTags: [],
    statesTags: [OFF_INGREDIENTS_COMPLETED],
    ...overrides,
  };
}

function found(fields: Record<string, unknown>, code = CODE) {
  const result = parseOffResponse({ status: 1, product: { code, ...fields } }, code);
  if (result.status !== "found") throw new Error(`esperaba found, llegó ${result.status}`);
  return result.product;
}

describe("constantes de Open Food Facts", () => {
  it("traduce exactamente las 14 etiquetas de OFF a nuestros alérgenos, una por alérgeno", () => {
    expect(OFF_ALLERGEN_TAGS).toEqual({
      "en:gluten": "gluten",
      "en:crustaceans": "crustaceans",
      "en:eggs": "eggs",
      "en:fish": "fish",
      "en:peanuts": "peanuts",
      "en:soybeans": "soybeans",
      "en:milk": "milk",
      "en:nuts": "nuts",
      "en:celery": "celery",
      "en:mustard": "mustard",
      "en:sesame-seeds": "sesame",
      "en:sulphur-dioxide-and-sulphites": "sulphites",
      "en:lupin": "lupin",
      "en:molluscs": "molluscs",
    });
    expect(new Set(Object.values(OFF_ALLERGEN_TAGS))).toEqual(new Set(ALLERGENS));
  });

  it("pide a la API todos los campos que usa el traductor", () => {
    expect(OFF_INGREDIENTS_COMPLETED).toBe("en:ingredients-completed");
    expect(OFF_PRODUCT_FIELDS).toEqual([
      "code",
      "product_name",
      "product_name_es",
      "brands",
      "image_front_small_url",
      "ingredients_text",
      "ingredients_text_es",
      "allergens_tags",
      "traces_tags",
      "states_tags",
    ]);
  });

  it("construye el enlace para dar de alta un producto en OFF", () => {
    expect(offAddProductUrl(CODE)).toBe(
      `https://world.openfoodfacts.org/cgi/product.pl?type=add&code=${CODE}`,
    );
    expect(offAddProductUrl("1&x=2")).toBe(
      "https://world.openfoodfacts.org/cgi/product.pl?type=add&code=1%26x%3D2",
    );
  });
});

describe("parseOffResponse", () => {
  it.each([
    ["null", null],
    ["un texto", "error"],
    ["una lista", []],
    ["status desconocido", { status: 2, product: { code: CODE } }],
    ["sin status", { product: { code: CODE } }],
    ["sin producto", { status: 1 }],
    ["producto que es una lista", { status: 1, product: [] }],
    ["producto sin código", { status: 1, product: {} }],
    ["código que no es texto", { status: 1, product: { code: 4006381333931 } }],
    ["otro producto", { status: 1, product: { code: "96385074" } }],
  ])("una respuesta con %s es inválida", (_, body) => {
    expect(parseOffResponse(body, CODE)).toEqual({ status: "invalid" });
  });

  it("status 0 significa que el producto no existe en OFF", () => {
    expect(parseOffResponse({ status: 0, status_verbose: "product not found" }, CODE)).toEqual({
      status: "not_found",
    });
  });

  it("acepta el producto aunque OFF quite los ceros iniciales del código", () => {
    expect(found({}, "36000291452").code).toBe("36000291452");
    const result = parseOffResponse(
      { status: 1, product: { code: "36000291452" } },
      "0036000291452",
    );
    expect(result).toMatchObject({ status: "found", product: { code: "0036000291452" } });
  });

  it("no confunde códigos que solo se parecen al quitar ceros intermedios", () => {
    expect(parseOffResponse({ status: 1, product: { code: "46381333931" } }, CODE)).toEqual({
      status: "invalid",
    });
  });

  it("lee el producto completo, prefiriendo los textos en español", () => {
    expect(
      found({
        product_name: "Cookies",
        product_name_es: "  Galletas  ",
        brands: " Marca ",
        image_front_small_url: "https://images.openfoodfacts.org/a.jpg",
        ingredients_text: "wheat flour",
        ingredients_text_es: "harina de trigo",
        allergens_tags: ["en:gluten"],
        traces_tags: ["en:nuts"],
        states_tags: [OFF_INGREDIENTS_COMPLETED],
      }),
    ).toEqual({
      code: CODE,
      name: "Galletas",
      brands: "Marca",
      imageUrl: "https://images.openfoodfacts.org/a.jpg",
      ingredientsText: "harina de trigo",
      allergensTags: ["en:gluten"],
      tracesTags: ["en:nuts"],
      statesTags: [OFF_INGREDIENTS_COMPLETED],
    });
  });

  it("sin textos en español usa los genéricos", () => {
    const p = found({ product_name: "Cookies", ingredients_text: "wheat flour" });
    expect(p.name).toBe("Cookies");
    expect(p.ingredientsText).toBe("wheat flour");
    const blankEs = found({ product_name_es: "   ", product_name: "Cookies" });
    expect(blankEs.name).toBe("Cookies");
  });

  it("los campos ausentes, vacíos o con otro tipo quedan como null", () => {
    expect(found({})).toEqual({
      code: CODE,
      name: null,
      brands: null,
      imageUrl: null,
      ingredientsText: null,
      allergensTags: null,
      tracesTags: null,
      statesTags: null,
    });
    const odd = found({
      product_name: "",
      brands: 3,
      allergens_tags: "en:gluten",
      traces_tags: ["en:nuts", 7],
      states_tags: { 0: OFF_INGREDIENTS_COMPLETED },
    });
    expect(odd).toMatchObject({
      name: null,
      brands: null,
      allergensTags: null,
      tracesTags: null,
      statesTags: null,
    });
  });

  it("solo acepta imágenes por https", () => {
    expect(found({ image_front_small_url: "http://images.openfoodfacts.org/a.jpg" }).imageUrl).toBe(
      null,
    );
    expect(found({ image_front_small_url: "javascript:alert(1)//https://" }).imageUrl).toBe(null);
    expect(found({ image_front_small_url: 42 }).imageUrl).toBe(null);
  });
});

describe("productDeclarations", () => {
  it("traduce alérgenos a 'contiene' y trazas a 'puede contener'", () => {
    const declarations = productDeclarations(
      product({ allergensTags: ["en:milk"], tracesTags: ["en:nuts"], statesTags: [] }),
    );
    expect(declarations).toEqual([
      { allergen: "milk", level: "contains" },
      { allergen: "nuts", level: "may_contain" },
    ]);
  });

  it("con los ingredientes completos, declara 'no contiene' el resto de alérgenos", () => {
    const declarations = productDeclarations(product({ allergensTags: ["en:milk"] }));
    expect(declarations).toContainEqual({ allergen: "milk", level: "contains" });
    for (const allergen of ALLERGENS) {
      expect(declarations).toContainEqual({ allergen, level: "free_from" });
    }
  });

  it.each([
    ["sin estados", { statesTags: null }],
    ["con los ingredientes sin completar", { statesTags: ["en:ingredients-to-be-completed"] }],
    ["sin el campo de alérgenos", { allergensTags: null }],
    ["sin el campo de trazas", { tracesTags: null }],
    ["con un alérgeno desconocido", { allergensTags: ["es:trigo"] }],
    ["con una traza desconocida", { tracesTags: ["en:none"] }],
  ])("%s nunca declara 'no contiene'", (_, overrides) => {
    const declarations = productDeclarations(product(overrides));
    expect(declarations.some((d) => d.level === "free_from")).toBe(false);
  });

  it("las etiquetas desconocidas no impiden usar las conocidas", () => {
    expect(
      productDeclarations(
        product({ allergensTags: ["es:trigo", "en:gluten"], tracesTags: ["xx:algo", "en:eggs"] }),
      ),
    ).toEqual([
      { allergen: "gluten", level: "contains" },
      { allergen: "eggs", level: "may_contain" },
    ]);
  });
});

describe("semáforo de un producto (traductor + filtro de core)", () => {
  const celiac = ["gluten"] as const;

  it("contiene gluten: no apto", () => {
    const declarations = productDeclarations(product({ allergensTags: ["en:gluten"] }));
    expect(evaluateAllergens(celiac, declarations).status).toBe("no_apto");
  });

  it("puede contener trazas de gluten: posibles trazas", () => {
    const declarations = productDeclarations(product({ tracesTags: ["en:gluten"] }));
    expect(evaluateAllergens(celiac, declarations).status).toBe("posibles_trazas");
  });

  it("ingredientes completos y sin gluten: apto", () => {
    const declarations = productDeclarations(product({ allergensTags: ["en:milk"] }));
    expect(evaluateAllergens(celiac, declarations).status).toBe("apto");
  });

  it("sin gluten declarado pero con ingredientes incompletos: sin datos, nunca apto", () => {
    const declarations = productDeclarations(product({ statesTags: [] }));
    expect(evaluateAllergens(celiac, declarations)).toMatchObject({
      status: "sin_datos",
      missing: ["gluten"],
    });
  });

  it("un producto sin ningún dato: sin datos", () => {
    const declarations = productDeclarations(
      product({ allergensTags: null, tracesTags: null, statesTags: null }),
    );
    expect(evaluateAllergens(celiac, declarations).status).toBe("sin_datos");
  });
});
