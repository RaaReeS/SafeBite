import "server-only";
import { readFile } from "node:fs/promises";
import { MenuFetchError, type FetchedMenu } from "./fetch-menu-errors";

/** Error del descargador simulado (mismos motivos que el real). */
function fail(reason: "unreachable" | "tooLarge" | "unsupported"): never {
  throw new MenuFetchError(reason);
}

const FIXTURES = "e2e/fixtures";

/**
 * Descargador simulado para los tests (MENU_URL_FETCH=fake): no sale a
 * internet. Las direcciones ya han pasado checkMenuUrl (las privadas se
 * rechazan antes, también en los tests). Contenido según la ruta de
 * https://carta.test/…
 */
export async function fakeFetchMenuUrl(url: string): Promise<FetchedMenu> {
  const { hostname, pathname } = new URL(url);
  if (hostname !== "carta.test") return fail("unreachable");
  switch (pathname) {
    case "/carta":
      return {
        kind: "html",
        html: `<html><head><title>Bar Prueba</title><script>analytics()</script></head><body>
          <h1>Nuestra carta</h1><h2>Entrantes</h2><ul><li>Gambas al ajillo &ndash; 12,50&nbsp;&euro;</li>
          <li>Croquetas caseras &ndash; 9 &euro;</li></ul><h2>Postres</h2><p>Flan casero 5,50 &euro;</p>
          </body></html>`,
      };
    case "/web-con-javascript":
      return {
        kind: "html",
        html: `<html><body><div id="root"></div><script src="/app.js"></script></body></html>`,
      };
    case "/carta.pdf":
      return {
        kind: "pdf",
        data: new Uint8Array(await readFile(`${FIXTURES}/carta-con-texto.pdf`)),
      };
    case "/escaneo.pdf":
      return {
        kind: "pdf",
        data: new Uint8Array(await readFile(`${FIXTURES}/carta-2-paginas.pdf`)),
      };
    case "/foto.png":
      return {
        kind: "image",
        dataUrl: `data:image/png;base64,${(await readFile(`${FIXTURES}/carta.png`)).toString("base64")}`,
      };
    case "/enorme":
      return fail("tooLarge");
    case "/video":
      return fail("unsupported");
    default:
      return fail("unreachable");
  }
}
