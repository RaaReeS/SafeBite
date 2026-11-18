import { expect, test, type Page } from "@playwright/test";
import {
  SEED_DINER,
  SEED_OWNER,
  createRestaurant,
  formAlert,
  login,
  loginAsAdmin,
  registerOwner,
} from "./helpers";

function card(page: Page, name: string) {
  return page.getByRole("listitem", { name });
}

test.describe("verificación de restaurantes (administración)", () => {
  test("el admin ve los datos para comprobar al dueño, rechaza con motivo y verifica", async ({
    browser,
  }) => {
    const owner = await browser.newPage();
    const ownerEmail = await registerOwner(owner);
    const { name, url } = await createRestaurant(owner);

    const admin = await browser.newPage();
    await loginAsAdmin(admin);
    await expect(card(admin, name)).toContainText("Pendiente de verificación");
    await expect(card(admin, name)).toContainText(ownerEmail);
    await expect(card(admin, name)).toContainText("Madrid");

    // Solo hay dos botones: «Verificar» y «Rechazar».
    await expect(card(admin, name).getByRole("button")).toHaveText(["Verificar", "Rechazar"]);

    // Rechazar abre una ventana que exige el motivo.
    await card(admin, name).getByRole("button", { name: "Rechazar" }).click();
    const dialog = admin.getByRole("dialog", { name: `Rechazar ${name}` });
    await expect(dialog).toBeVisible();
    const reject = dialog.getByRole("form", { name: `Rechazar ${name}` });
    await reject.getByRole("button", { name: "Rechazar" }).click();
    await expect(reject.getByText(/Escribe el motivo/)).toBeVisible();
    await expect(dialog).toBeVisible();

    // Cancelar cierra sin rechazar.
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();
    await expect(card(admin, name)).toContainText("Pendiente de verificación");

    await card(admin, name).getByRole("button", { name: "Rechazar" }).click();

    await reject
      .getByLabel("Motivo del rechazo")
      .fill("No contesta nadie en el teléfono del local.");
    await reject.getByRole("button", { name: "Rechazar" }).click();
    await expect(card(admin, name)).toHaveCount(0);

    await admin.getByRole("link", { name: "Rechazados" }).click();
    await expect(card(admin, name)).toContainText("No contesta nadie en el teléfono del local.");

    // El dueño ve el motivo.
    await owner.goto(url);
    await expect(formAlert(owner)).toContainText("No contesta nadie en el teléfono");

    // Verificar (p. ej. tras volver a llamar).
    await card(admin, name).getByRole("button", { name: "Verificar" }).click();
    await expect(card(admin, name)).toHaveCount(0);
    await admin.getByRole("link", { name: "Verificados" }).click();
    await expect(card(admin, name)).toContainText("Verificado");

    await owner.reload();
    await expect(owner.getByText("Verificado", { exact: true })).toBeVisible();

    // Y se puede deshacer.
    await card(admin, name).getByRole("button", { name: "Volver a pendiente" }).click();
    await expect(card(admin, name)).toHaveCount(0);
    await admin.getByRole("link", { name: "Pendientes" }).click();
    await expect(card(admin, name)).toBeVisible();
  });

  test("un dueño no entra en la verificación: vuelve a su panel", async ({ page }) => {
    await login(page, SEED_OWNER.email, SEED_OWNER.password);
    await expect(page).toHaveURL(/\/panel$/);
    await page.goto("/admin/restaurantes");
    await expect(page).toHaveURL(/\/panel$/);
  });

  test("un comensal no entra en la verificación", async ({ page }) => {
    await login(page, SEED_DINER.email, SEED_DINER.password);
    await expect(page).toHaveURL(/\/comensal$/);
    await page.goto("/admin/restaurantes");
    await expect(page).toHaveURL(/\/comensal$/);
  });
});
