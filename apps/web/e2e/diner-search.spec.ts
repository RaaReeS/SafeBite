import { expect, test, type Page } from "@playwright/test";
import { SEED_DINER, login } from "./helpers";

// Los tests no descargan trozos del mapa de OpenStreetMap.
test.beforeEach(async ({ page }) => {
  await page.route("https://tile.openstreetmap.org/**", (route) => route.abort());
});

async function openSearch(page: Page) {
  await login(page, SEED_DINER.email, SEED_DINER.password);
  await expect(page).toHaveURL(/\/comensal$/);
  await page.getByRole("link", { name: "Buscar restaurantes" }).click();
  await expect(page).toHaveURL(/\/comensal\/restaurantes$/);
  // El mapa solo se pinta en el navegador: cuando está, la página ya responde a los clics.
  await expect(page.locator(".leaflet-container")).toBeVisible();
}

function restaurantList(page: Page) {
  return page.getByRole("list", { name: "Lista de restaurantes" });
}

test.describe("buscar restaurantes en la web (comensal)", () => {
  test("muestra los restaurantes en lista y en el mapa, y filtra por ciudad", async ({ page }) => {
    await openSearch(page);
    await expect(restaurantList(page).getByRole("link", { name: /La Huerta Demo/ })).toBeVisible();
    const map = page.getByRole("region", { name: "Mapa de restaurantes" });
    await expect(map.locator(".leaflet-interactive").first()).toBeVisible();
    await expect(map).toContainText("OpenStreetMap");

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

  test("la ubicación solo se permite a la propia web", async ({ request }) => {
    const response = await request.get("/comensal/restaurantes", { maxRedirects: 0 });
    expect(response.headers()["permissions-policy"]).toBe(
      "camera=(), microphone=(), geolocation=(self), payment=()",
    );
  });
});
