import { expect, test, type Page } from "@playwright/test";
import { createRestaurant, registerOwner } from "./helpers";

// Lector y descargador simulados (MENU_READER=fake, MENU_URL_FETCH=fake): las
// direcciones https://carta.test/… devuelven contenido fijo; nada sale a internet.

function reviewForm(page: Page) {
  return page.getByRole("form", { name: "Platos leídos de la carta" });
}

async function openImport(page: Page) {
  await registerOwner(page);
  const { url } = await createRestaurant(page);
  await page.goto(`${url}/platos/importar`);
  return url;
}

async function readLink(page: Page, link: string) {
  await page.getByRole("tab", { name: "Enlace" }).click();
  await page.getByLabel("Enlace de la carta").fill(link);
  await page.getByRole("button", { name: "Leer la carta" }).click();
}

test.describe("importar la carta desde un enlace", () => {
  test("lee la carta de una página web", async ({ page }) => {
    await openImport(page);
    await readLink(page, "https://carta.test/carta");
    await expect(reviewForm(page)).toBeVisible();
    await expect(reviewForm(page)).toContainText("Gambas al ajillo");
  });

  test("lee el texto de un PDF enlazado", async ({ page }) => {
    await openImport(page);
    await readLink(page, "https://carta.test/carta.pdf");
    await expect(reviewForm(page)).toBeVisible();
  });

  test("lee una imagen enlazada", async ({ page }) => {
    await openImport(page);
    await readLink(page, "https://carta.test/foto.png");
    await expect(reviewForm(page)).toBeVisible();
  });

  test("un PDF escaneado: explica que se suba como archivo", async ({ page }) => {
    await openImport(page);
    await readLink(page, "https://carta.test/escaneo.pdf");
    await expect(page.getByText(/Ese PDF es un escaneo y no tiene texto/)).toBeVisible();
  });

  test("una web sin texto (hecha con JavaScript): propone pegar el texto", async ({ page }) => {
    await openImport(page);
    await readLink(page, "https://carta.test/web-con-javascript");
    await expect(page.getByText(/usa «Pegar texto»/)).toBeVisible();
  });

  test("un enlace que no responde, demasiado grande o que no es una carta", async ({ page }) => {
    await openImport(page);
    await readLink(page, "https://carta.test/no-existe");
    await expect(page.getByText(/No hemos podido abrir ese enlace/)).toBeVisible();
    await readLink(page, "https://carta.test/enorme");
    await expect(page.getByText(/demasiado grande/)).toBeVisible();
    await readLink(page, "https://carta.test/video");
    await expect(page.getByText(/no es una página web, un PDF ni una imagen/)).toBeVisible();
  });

  test("nunca descarga direcciones internas ni enlaces que no son web", async ({ page }) => {
    await openImport(page);
    for (const link of [
      "http://127.0.0.1/panel",
      "http://localhost/",
      "http://169.254.169.254/latest/meta-data/",
      "http://[::1]/",
      "http://192.168.1.1/",
    ]) {
      await readLink(page, link);
      await expect(
        page.getByText("Esa dirección no es una página pública de internet."),
      ).toBeVisible();
    }
    // Puertos que no son de web (como el de esta propia web) tampoco.
    await readLink(page, "http://127.0.0.1:3000/panel");
    await expect(page.getByText(/Escribe una dirección web completa/)).toBeVisible();
    await readLink(page, "ftp://carta.test/carta");
    await expect(page.getByText(/Escribe una dirección web completa/)).toBeVisible();
  });
});

test.describe("importar la carta pegando el texto", () => {
  test("lee el texto pegado", async ({ page }) => {
    await openImport(page);
    await page.getByRole("tab", { name: "Pegar texto" }).click();
    await page
      .getByLabel("Texto de la carta")
      .fill("ENTRANTES\nGambas al ajillo 12,50 €\nCroquetas caseras 9 €");
    await page.getByRole("button", { name: "Leer la carta" }).click();
    await expect(reviewForm(page)).toBeVisible();
  });

  test("un texto demasiado corto o un servicio caído se explican", async ({ page }) => {
    await openImport(page);
    await page.getByRole("tab", { name: "Pegar texto" }).click();
    await page.getByLabel("Texto de la carta").fill("Pan");
    await page.getByRole("button", { name: "Leer la carta" }).click();
    await expect(page.getByText(/Pega el texto de la carta/)).toBeVisible();

    await page
      .getByLabel("Texto de la carta")
      .fill("Texto de prueba que simula un FALLO del servicio");
    await page.getByRole("button", { name: "Leer la carta" }).click();
    await expect(page.getByText(/Ahora mismo no podemos leer la carta/)).toBeVisible();
  });
});
