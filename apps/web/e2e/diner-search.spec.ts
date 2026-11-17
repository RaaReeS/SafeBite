import { expect, test, type Page } from "@playwright/test";
import {
  SEED_DINER,
  createRestaurant,
  login,
  registerDiner,
  useOfflineMap,
  registerOwner,
  restaurantForm,
  verifyRestaurantAsAdmin,
} from "./helpers";

test.beforeEach(async ({ page }) => {
  await useOfflineMap(page);
});

async function openSearch(page: Page) {
  await login(page, SEED_DINER.email, SEED_DINER.password);
  await expect(page).toHaveURL(/\/comensal$/);
  await page.getByRole("link", { name: "Buscar restaurantes" }).click();
  await expect(page).toHaveURL(/\/comensal\/restaurantes$/);
  // El mapa solo se pinta en el navegador: cuando está, la página ya responde a los clics.
  await expect(page.locator(".maplibregl-map")).toBeVisible();
}

function restaurantList(page: Page) {
  return page.getByRole("list", { name: "Lista de restaurantes" });
}

test.describe("buscar restaurantes en la web (comensal)", () => {
  test("muestra los restaurantes en lista y en el mapa, y filtra por ciudad", async ({ page }) => {
    await openSearch(page);
    // El comensal del seed (celíaco, frutos de cáscara) puede comer en La Huerta Demo.
    await expect(restaurantList(page).getByRole("link", { name: /La Huerta Demo/ })).toContainText(
      /platos? aptos? según lo declarado/,
    );
    const map = page.getByRole("region", { name: "Mapa de restaurantes" });
    // Marcador de La Huerta Demo: al pulsarlo, su ficha con el enlace a la carta.
    await map.getByRole("button", { name: "La Huerta Demo" }).click();
    await expect(page.locator(".maplibregl-popup")).toContainText("Ver la carta");
    await expect(page.locator(".maplibregl-popup")).toContainText(/según lo declarado/);

    await page.getByLabel("Ciudad").fill("MADRÍD");
    await expect(restaurantList(page).getByRole("link", { name: /La Huerta Demo/ })).toBeVisible();
    await page.getByLabel("Ciudad").fill("Ciudad que no existe");
    await expect(
      page.getByText("No hemos encontrado restaurantes en «Ciudad que no existe»."),
    ).toBeVisible();

    await page.getByLabel("Ciudad").fill("madrid");
    await restaurantList(page)
      .getByRole("link", { name: /La Huerta Demo/ })
      .click();
    await expect(page).toHaveURL(/\/r\/la-huerta-demo$/);
  });

  test.describe("con permiso de ubicación", () => {
    test.use({
      geolocation: { latitude: 40.4169, longitude: -3.7035 },
      permissions: ["geolocation"],
    });

    test("«Cerca de mí» ordena por distancia sin enviar la ubicación", async ({ page }) => {
      const sentLocation: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (url.includes("40.41") || (request.postData() ?? "").includes("40.41")) {
          sentLocation.push(url);
        }
      });
      await openSearch(page);
      await page.getByRole("button", { name: "Cerca de mí" }).click();
      await expect(page.getByText(/de más cerca a más lejos/)).toBeVisible();
      await expect(
        restaurantList(page).getByRole("link", { name: /La Huerta Demo/ }),
      ).toContainText(/a (menos de )?\d/);
      expect(sentLocation).toEqual([]);
    });
  });

  test("sin permiso de ubicación lo explica y se puede buscar por ciudad", async ({ page }) => {
    await page.context().clearPermissions();
    await openSearch(page);
    await page.evaluate(() => {
      // Simula que el usuario rechaza el permiso.
      navigator.geolocation.getCurrentPosition = (_ok, fail) =>
        fail?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError);
    });
    await page.getByRole("button", { name: "Cerca de mí" }).click();
    await expect(page.getByText(/Sin permiso de ubicación/)).toBeVisible();
  });

  test("por defecto solo salen los restaurantes donde puedo comer", async ({ browser }) => {
    // Un restaurante publicado y verificado pero sin carta: «sin datos», nunca apto.
    const owner = await browser.newPage();
    await useOfflineMap(owner);
    await registerOwner(owner);
    const { name, url } = await createRestaurant(owner);
    const form = restaurantForm(owner);
    await form.getByLabel(/^Dirección \(opcional\)/).fill("Calle Mayor 7");
    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(form.getByRole("status")).toHaveText("Cambios guardados.");
    await owner.getByRole("button", { name: "Publicar carta" }).click();
    await expect(owner.getByText("Publicado", { exact: true })).toBeVisible();
    await verifyRestaurantAsAdmin(url);

    const page = await browser.newPage();
    await useOfflineMap(page);
    await openSearch(page);
    await expect(
      page.getByText(/Puedes comer en \d+ de \d+ restaurantes, según lo declarado/),
    ).toBeVisible();
    await expect(restaurantList(page).getByRole("link", { name: /La Huerta Demo/ })).toBeVisible();
    await expect(restaurantList(page).getByRole("link", { name: new RegExp(name) })).toHaveCount(0);

    await page.getByLabel("Mostrar también los demás restaurantes").check();
    await expect(restaurantList(page).getByRole("link", { name: new RegExp(name) })).toContainText(
      "Sin datos suficientes",
    );
  });

  test("sin alergias guardadas no hay semáforo e invita a configurarlas", async ({ page }) => {
    await registerDiner(page);
    await page.goto("/comensal/restaurantes");
    await expect(page.locator(".maplibregl-map")).toBeVisible();
    await expect(
      page.getByText(/Guarda tus alergias para ver en el mapa dónde puedes comer/),
    ).toBeVisible();
    await expect(
      restaurantList(page).getByRole("link", { name: /La Huerta Demo/ }),
    ).not.toContainText(/según lo declarado|Sin datos/);
  });

  test.describe("en modo oscuro", () => {
    test.use({ colorScheme: "dark" });

    test("la ficha de un restaurante en el mapa usa los colores oscuros del tema", async ({
      page,
    }) => {
      await openSearch(page);
      const map = page.getByRole("region", { name: "Mapa de restaurantes" });
      await map.getByRole("button", { name: "La Huerta Demo" }).click();
      const popup = page.locator(".safebite-popup .maplibregl-popup-content");
      await expect(popup).toContainText("La Huerta Demo");
      // --fg y --card del modo oscuro (contraste comprobado en theme.spec.ts).
      await expect(popup).toHaveCSS("color", "rgb(238, 242, 240)");
      await expect(popup).toHaveCSS("background-color", "rgb(20, 28, 25)");
      if (process.env.CAPTURA) await popup.screenshot({ path: process.env.CAPTURA });
    });
  });

  test("el worker de MapLibre se sirve (sin él no se dibujan las calles)", async ({ request }) => {
    const response = await request.get("/vendor/maplibre-gl-worker.mjs");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/javascript/);
  });

  test("la ubicación solo se permite a la propia web", async ({ request }) => {
    const response = await request.get("/comensal/restaurantes", { maxRedirects: 0 });
    expect(response.headers()["permissions-policy"]).toBe(
      "camera=(), microphone=(), geolocation=(self), payment=()",
    );
  });
});
