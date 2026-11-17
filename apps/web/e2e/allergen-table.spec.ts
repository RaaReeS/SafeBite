import { writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { SEED_OWNER, createRestaurant, login, registerOwner } from "./helpers";

test.describe("tabla de alérgenos imprimible", () => {
  test("el dueño la descarga en PDF desde la ficha del restaurante", async ({ page }) => {
    // El restaurante del seed tiene platos con todos los casos (contiene, trazas, no contiene, sin datos).
    await login(page, SEED_OWNER.email, SEED_OWNER.password);
    await expect(page).toHaveURL(/\/panel$/);
    await page.getByRole("link", { name: /La Huerta Demo/ }).click();
    await expect(page.getByRole("heading", { name: "Información sobre alérgenos" })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name: "Descargar tabla de alérgenos (PDF)" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("safebite-alergenos-la-huerta-demo.pdf");

    const response = await page.request.get(new URL(download.url()).pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/pdf");
    expect(response.headers()["cache-control"]).toBe("private, no-store");
    const body = await response.body();
    expect(body.subarray(0, 5).toString()).toBe("%PDF-");
    expect(body.length).toBeGreaterThan(5_000);
    // Copia para revisarla a mano, si se pide.
    if (process.env.TABLA_PDF) writeFileSync(process.env.TABLA_PDF, body);
  });

  test("con la carta vacía también se genera (y lo dice)", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    const response = await page.request.get(`${url}/alergenos/pdf`);
    expect(response.status()).toBe(200);
    expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
  });

  test("otro dueño recibe 404 y sin sesión se pide entrar", async ({ browser, playwright }) => {
    const ownerA = await browser.newPage();
    await registerOwner(ownerA);
    const { url } = await createRestaurant(ownerA);

    const ownerB = await browser.newPage();
    await registerOwner(ownerB);
    const other = await ownerB.request.get(`${url}/alergenos/pdf`);
    expect(other.status()).toBe(404);
    expect(other.headers()["content-type"]).not.toContain("pdf");

    const anonymous = await playwright.request.newContext();
    const anon = await anonymous.get(`${url}/alergenos/pdf`, { maxRedirects: 0 });
    expect(anon.status()).toBe(307);
    expect(anon.headers()["location"]).toContain("/login?next=");
    await anonymous.dispose();
  });
});
