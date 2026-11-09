import { expect, test, type APIResponse, type Page } from "@playwright/test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { createRestaurant, registerOwner, restaurantForm } from "./helpers";

/** Decodifica el QR de una respuesta PNG y devuelve el texto que contiene. */
async function decodeQr(response: APIResponse): Promise<string | undefined> {
  const png = PNG.sync.read(await response.body());
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data;
}

async function setupRestaurant(page: Page) {
  await registerOwner(page);
  const { url } = await createRestaurant(page);
  const slug = await restaurantForm(page).getByLabel("Dirección de la carta").inputValue();
  return { restaurantUrl: url, slug };
}

test.describe("código QR", () => {
  test("el PNG descargado contiene la URL pública de la carta", async ({ page }) => {
    const { restaurantUrl, slug } = await setupRestaurant(page);
    await page.goto(`${restaurantUrl}/qr`);
    await expect(page.getByRole("img", { name: /Código QR de la carta de/ })).toBeVisible();
    await expect(page.getByText(`http://localhost:3000/r/${slug}`)).toBeVisible();

    const response = await page.request.get(`${restaurantUrl}/qr/png`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    expect(response.headers()["content-disposition"]).toBe(
      `attachment; filename="safebite-qr-${slug}.png"`,
    );
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await decodeQr(response)).toBe(`http://localhost:3000/r/${slug}`);
  });

  test("el PDF imprimible se descarga como PDF", async ({ page }) => {
    const { restaurantUrl, slug } = await setupRestaurant(page);
    const response = await page.request.get(`${restaurantUrl}/qr/pdf`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/pdf");
    expect(response.headers()["content-disposition"]).toBe(
      `attachment; filename="safebite-qr-${slug}.pdf"`,
    );
    const body = await response.body();
    expect(body.subarray(0, 5).toString()).toBe("%PDF-");
    expect(body.length).toBeGreaterThan(5_000);
  });

  test("avisa si la carta no está publicada", async ({ page }) => {
    const { restaurantUrl } = await setupRestaurant(page);
    await page.goto(`${restaurantUrl}/qr`);
    await expect(page.getByText("Tu carta aún no está publicada")).toBeVisible();

    await page.goto(restaurantUrl);
    await page.getByRole("button", { name: "Publicar carta" }).click();
    await expect(page.getByText("Publicado", { exact: true })).toBeVisible();
    await page.goto(`${restaurantUrl}/qr`);
    await expect(page.getByRole("heading", { name: "Código QR" })).toBeVisible();
    await expect(page.getByText("Tu carta aún no está publicada")).toHaveCount(0);
  });

  test("al cambiar la dirección de la carta, el QR apunta a la nueva", async ({ page }) => {
    const { restaurantUrl, slug } = await setupRestaurant(page);
    const form = restaurantForm(page);
    await form.getByLabel("Dirección de la carta").fill(`${slug}-nueva`);
    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(form.getByRole("status")).toHaveText("Cambios guardados.");

    const response = await page.request.get(`${restaurantUrl}/qr/png`);
    expect(await decodeQr(response)).toBe(`http://localhost:3000/r/${slug}-nueva`);
  });
});

test.describe("aislamiento de las descargas", () => {
  test("otro dueño recibe 404 al pedir el QR de un restaurante ajeno", async ({ browser }) => {
    const ownerA = await browser.newPage();
    const { restaurantUrl } = await setupRestaurant(ownerA);

    const ownerB = await browser.newPage();
    await registerOwner(ownerB);
    for (const format of ["png", "pdf"]) {
      const response = await ownerB.request.get(`${restaurantUrl}/qr/${format}`);
      expect(response.status(), format).toBe(404);
      expect(response.headers()["content-type"], format).not.toContain(format);
    }

    await ownerA.close();
    await ownerB.close();
  });

  test("sin sesión, las descargas redirigen al login", async ({ browser, playwright }) => {
    const owner = await browser.newPage();
    const { restaurantUrl } = await setupRestaurant(owner);

    const anonymous = await playwright.request.newContext();
    for (const format of ["png", "pdf"]) {
      const response = await anonymous.get(`${restaurantUrl}/qr/${format}`, { maxRedirects: 0 });
      expect(response.status(), format).toBe(307);
      expect(response.headers()["location"], format).toContain("/login?next=");
    }

    await anonymous.dispose();
    await owner.close();
  });
});
