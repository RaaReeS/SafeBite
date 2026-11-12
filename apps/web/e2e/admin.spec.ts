import { expect, test } from "@playwright/test";
import {
  SEED_DINER,
  SEED_OWNER,
  login,
  loginAsAdmin,
  requestRestaurantAsSeedDiner,
} from "./helpers";

/** Nombre único (sin tildes) para que los tests no dependan de ejecuciones anteriores. */
function uniqueRestaurant(): string {
  return `Bar Prueba ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

test.describe("solicitudes de restaurantes (administración)", () => {
  test("el admin ve las solicitudes agrupadas, sin datos de quién las pidió, y las marca como añadidas", async ({
    page,
  }) => {
    const name = uniqueRestaurant();
    // Mismo restaurante escrito de dos formas: cuenta como uno.
    await requestRestaurantAsSeedDiner(name, "Zaragoza");
    await requestRestaurantAsSeedDiner(`  ${name.toUpperCase()} `, "zaragoza");

    // Al entrar (con la verificación en dos pasos), el admin llega a la verificación de restaurantes.
    await loginAsAdmin(page);
    await page
      .getByRole("navigation", { name: "Secciones de administración" })
      .getByRole("link", { name: "Solicitudes" })
      .click();
    await expect(page).toHaveURL(/\/admin\/solicitudes$/);
    await expect(page.getByRole("heading", { name: "Solicitudes de restaurantes" })).toBeVisible();

    const row = page.getByRole("row", { name: new RegExp(name, "i") });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("cell").nth(1)).toHaveText("2");
    await expect(row).toContainText("Pendiente");
    await expect(page.getByText(SEED_DINER.email)).toHaveCount(0);

    await row.getByRole("button", { name: /Marcar como añadido/ }).click();
    await expect(page.getByRole("row", { name: new RegExp(name, "i") })).toHaveCount(0);

    await page.getByRole("link", { name: "Añadidos" }).click();
    const added = page.getByRole("row", { name: new RegExp(name, "i") });
    await expect(added).toContainText("Añadido");

    // Si alguien vuelve a pedirlo, reaparece como pendiente.
    await requestRestaurantAsSeedDiner(name, "Zaragoza");
    await page.goto("/admin/solicitudes");
    const again = page.getByRole("row", { name: new RegExp(name, "i") });
    await expect(again).toContainText("Pendiente");
    await expect(again).toContainText("1 nueva");
  });

  test("sin sesión, /admin pide entrar", async ({ page }) => {
    await page.goto("/admin/solicitudes");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fsolicitudes$/);
  });

  test("un dueño de restaurante no entra: vuelve a su panel", async ({ page }) => {
    await login(page, SEED_OWNER.email, SEED_OWNER.password);
    await expect(page).toHaveURL(/\/panel$/);
    await page.goto("/admin/solicitudes");
    await expect(page).toHaveURL(/\/panel$/);
    await expect(page.getByRole("heading", { name: "Mis restaurantes" })).toBeVisible();
  });

  test("un comensal no entra", async ({ page }) => {
    await login(page, SEED_DINER.email, SEED_DINER.password);
    await expect(page).toHaveURL(/\/sin-acceso$/);
    await page.goto("/admin/solicitudes");
    await expect(page).toHaveURL(/\/sin-acceso$/);
  });
});
