import "server-only";
import { checkMenuUrl, isPublicAddress } from "@safebite/core";
import { lookup, type LookupAddress } from "node:dns";
import http from "node:http";
import https from "node:https";
import type { LookupFunction } from "node:net";
import { MenuFetchError, type FetchedMenu } from "./fetch-menu-errors";
import { fakeFetchMenuUrl } from "./fetch-menu-url-fake";

export { MenuFetchError, type FetchedMenu, type MenuFetchFailure } from "./fetch-menu-errors";

const MAX_BYTES = 5_000_000;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Resolución de nombres que solo deja conectar a IPs públicas. Va en la propia
 * conexión: aunque el DNS cambie entre la comprobación y la conexión (DNS
 * rebinding), nunca se llega a la red interna.
 */
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { ...options, all: true }, (error, addresses: LookupAddress[]) => {
    if (error) {
      callback(error, "", 4);
      return;
    }
    if (addresses.length === 0 || addresses.some((a) => !isPublicAddress(a.address))) {
      callback(new MenuFetchError("private"), "", 4);
      return;
    }
    if (options.all) {
      (callback as unknown as (e: null, a: LookupAddress[]) => void)(null, addresses);
      return;
    }
    const [first] = addresses;
    callback(null, first?.address ?? "", first?.family ?? 4);
  });
};

type Response =
  | { redirect: string }
  | { redirect?: undefined; status: number; contentType: string; body: Buffer };

function get(url: URL, signal: AbortSignal): Promise<Response> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === "https:" ? https : http;
    const request = client.get(
      url,
      {
        lookup: publicOnlyLookup,
        signal,
        timeout: TIMEOUT_MS,
        headers: {
          "User-Agent": "SafeBite/1.0 (lector de cartas de restaurantes)",
          Accept: "text/html,application/xhtml+xml,application/pdf,image/*;q=0.8",
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const location = response.headers.location;
        if (status >= 300 && status < 400 && location) {
          response.resume();
          resolve({ redirect: location });
          return;
        }
        if (Number(response.headers["content-length"]) > MAX_BYTES) {
          request.destroy(new MenuFetchError("tooLarge"));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_BYTES) request.destroy(new MenuFetchError("tooLarge"));
          else chunks.push(chunk);
        });
        response.on("end", () =>
          resolve({
            status,
            contentType: (response.headers["content-type"] ?? "").toLowerCase(),
            body: Buffer.concat(chunks),
          }),
        );
        response.on("error", (error) => reject(error));
      },
    );
    request.on("timeout", () => request.destroy(new MenuFetchError("unreachable")));
    request.on("error", (error) =>
      reject(error instanceof MenuFetchError ? error : new MenuFetchError("unreachable")),
    );
  });
}

function charsetOf(contentType: string): string {
  const charset = /charset=([\w-]+)/.exec(contentType)?.[1];
  try {
    return new TextDecoder(charset ?? "utf-8").encoding;
  } catch {
    return "utf-8";
  }
}

function classify(response: Exclude<Response, { redirect: string }>): FetchedMenu {
  const { contentType, body } = response;
  if (
    body.subarray(0, 5).toString("latin1") === "%PDF-" ||
    contentType.includes("application/pdf")
  ) {
    return { kind: "pdf", data: new Uint8Array(body) };
  }
  const type = contentType.split(";")[0]?.trim() ?? "";
  if (IMAGE_TYPES.includes(type)) {
    return { kind: "image", dataUrl: `data:${type};base64,${body.toString("base64")}` };
  }
  if (type === "text/html" || type === "application/xhtml+xml" || type === "text/plain") {
    return { kind: "html", html: new TextDecoder(charsetOf(contentType)).decode(body) };
  }
  throw new MenuFetchError("unsupported");
}

/**
 * Descarga la carta de un enlace que ha escrito el restaurante, con las
 * protecciones contra SSRF: solo direcciones públicas (también tras cada
 * redirección y en la propia conexión), 10 s, 5 MB y solo HTML, PDF o imagen.
 */
export async function fetchMenuUrl(input: string): Promise<FetchedMenu> {
  const checked = checkMenuUrl(input);
  if (!checked.ok) {
    throw new MenuFetchError(checked.reason === "private" ? "private" : "invalid");
  }
  if (process.env.MENU_URL_FETCH === "fake") return fakeFetchMenuUrl(checked.url);

  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let url = new URL(checked.url);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await get(url, signal).catch((error: unknown) => {
      throw error instanceof MenuFetchError ? error : new MenuFetchError("unreachable");
    });
    if (response.redirect === undefined) {
      if (response.status < 200 || response.status >= 300) {
        throw new MenuFetchError("unreachable");
      }
      return classify(response);
    }
    const next = checkMenuUrl(new URL(response.redirect, url).toString());
    if (!next.ok) {
      throw new MenuFetchError(next.reason === "private" ? "private" : "invalid");
    }
    url = new URL(next.url);
  }
  throw new MenuFetchError("redirects");
}
