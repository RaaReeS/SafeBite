import { hostFromHostUri, isLocalHost, withDevHost } from "@/lib/dev-host";

describe("isLocalHost", () => {
  it.each([
    "localhost",
    "127.0.0.1",
    "10.0.0.5",
    "192.168.1.137",
    "172.16.0.1",
    "172.20.10.12",
    "172.31.255.255",
  ])("%s es local", (host) => expect(isLocalHost(host)).toBe(true));

  it.each([
    "172.15.0.1",
    "172.32.0.1",
    "8.8.8.8",
    "abc.supabase.co",
    "1.2.3",
    "300.1.1.1",
    "u.exp.direct",
  ])("%s no es local", (host) => expect(isLocalHost(host)).toBe(false));
});

describe("hostFromHostUri", () => {
  it("quita el puerto y la ruta", () => {
    expect(hostFromHostUri("172.20.10.12:8081")).toBe("172.20.10.12");
    expect(hostFromHostUri("192.168.1.137:8081/--/inicio")).toBe("192.168.1.137");
  });

  it("sin hostUri devuelve null", () => {
    expect(hostFromHostUri(undefined)).toBeNull();
    expect(hostFromHostUri(null)).toBeNull();
    expect(hostFromHostUri("")).toBeNull();
  });
});

describe("withDevHost", () => {
  it("cambia una dirección local por la IP del PC, con el mismo puerto", () => {
    expect(withDevHost("http://127.0.0.1:54321", "172.20.10.12")).toBe("http://172.20.10.12:54321");
    expect(withDevHost("http://192.168.1.137:3000", "172.20.10.12")).toBe(
      "http://172.20.10.12:3000",
    );
    expect(withDevHost("http://localhost:54321/", "10.0.0.2")).toBe("http://10.0.0.2:54321/");
  });

  it("nunca toca una dirección de producción", () => {
    expect(withDevHost("https://abc.supabase.co", "172.20.10.12")).toBe("https://abc.supabase.co");
    expect(withDevHost("https://safebitee.vercel.app", "192.168.1.137")).toBe(
      "https://safebitee.vercel.app",
    );
  });

  it("no cambia nada con un túnel de Expo o sin IP del PC", () => {
    expect(withDevHost("http://127.0.0.1:54321", "u.exp.direct")).toBe("http://127.0.0.1:54321");
    expect(withDevHost("http://127.0.0.1:54321", null)).toBe("http://127.0.0.1:54321");
  });

  it("una dirección mal escrita se deja como está", () => {
    expect(withDevHost("no es una url", "172.20.10.12")).toBe("no es una url");
  });
});
