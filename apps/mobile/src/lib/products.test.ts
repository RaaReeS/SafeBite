import { LOOKUP_TIMEOUT_MS, OFF_USER_AGENT, lookupProduct, productUrl } from "./products";

const CODE = "4006381333931";

function mockFetch(status: number, body: unknown) {
  return jest.spyOn(globalThis, "fetch").mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("productUrl", () => {
  it("pide solo los campos que usa el traductor", () => {
    expect(productUrl(CODE)).toBe(
      "https://world.openfoodfacts.org/api/v2/product/4006381333931?fields=code,product_name,product_name_es,brands,image_front_small_url,ingredients_text,ingredients_text_es,allergens_tags,traces_tags,states_tags",
    );
  });
});

describe("lookupProduct", () => {
  it("envía solo el código e identifica la app ante Open Food Facts", async () => {
    const fetchMock = mockFetch(200, { status: 1, product: { code: CODE, product_name: "X" } });
    const result = await lookupProduct(CODE);

    expect(result).toMatchObject({ status: "found", product: { code: CODE, name: "X" } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(productUrl(CODE));
    expect(init.method).toBeUndefined(); // GET, sin cuerpo
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ Accept: "application/json", "User-Agent": OFF_USER_AGENT });
  });

  it("un 404 de OFF es «no encontrado»", async () => {
    mockFetch(404, { status: 0, status_verbose: "product not found" });
    expect(await lookupProduct(CODE)).toEqual({ status: "not_found" });
  });

  it("otros errores HTTP son «no disponible»", async () => {
    mockFetch(503, {});
    expect(await lookupProduct(CODE)).toEqual({ status: "unavailable" });
  });

  it("una respuesta rara es inválida", async () => {
    mockFetch(200, { status: 1, product: { code: "96385074" } });
    expect(await lookupProduct(CODE)).toEqual({ status: "invalid" });
  });

  it("sin conexión no lanza: devuelve un error de red", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Network request failed"));
    expect(await lookupProduct(CODE)).toEqual({ status: "network_error" });
  });

  it("si OFF tarda demasiado, cancela la petición", async () => {
    jest.useFakeTimers();
    jest.spyOn(globalThis, "fetch").mockImplementation(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    const pending = lookupProduct(CODE);
    jest.advanceTimersByTime(LOOKUP_TIMEOUT_MS);
    expect(await pending).toEqual({ status: "network_error" });
  });
});
