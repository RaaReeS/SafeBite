import { createFetchWithTimeout } from "@/lib/fetch-timeout";

/** fetch simulado que no responde nunca, salvo que se cancele. */
function hangingFetch(): typeof fetch {
  return (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    });
}

describe("createFetchWithTimeout", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("devuelve la respuesta si llega a tiempo", async () => {
    const response = { ok: true } as Response;
    const base: typeof fetch = async () => response;
    await expect(createFetchWithTimeout(base, 1000)("https://x")).resolves.toBe(response);
  });

  it("corta la petición si el servidor no responde a tiempo", async () => {
    let settled = false;
    const result = createFetchWithTimeout(hangingFetch(), 1000)("https://x");
    result.catch(() => (settled = true));
    jest.advanceTimersByTime(999);
    await Promise.resolve();
    expect(settled).toBe(false);
    jest.advanceTimersByTime(1);
    await expect(result).rejects.toThrow("aborted");
  });

  it("respeta la cancelación de quien llama", async () => {
    const outer = new AbortController();
    const result = createFetchWithTimeout(hangingFetch(), 60_000)("https://x", {
      signal: outer.signal,
    });
    outer.abort();
    await expect(result).rejects.toThrow("aborted");
  });

  it("si ya venía cancelada, falla al momento sin enviar la petición", async () => {
    const outer = new AbortController();
    outer.abort(new Error("cancelada"));
    let calls = 0;
    const hanging = hangingFetch();
    const base: typeof fetch = (input, init) => {
      calls += 1;
      return hanging(input, init);
    };
    await expect(
      createFetchWithTimeout(base, 60_000)("https://x", { signal: outer.signal }),
    ).rejects.toThrow("cancelada");
    expect(calls).toBe(0);
  });
});
