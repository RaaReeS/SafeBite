import { expect, test } from "@playwright/test";
import {
  createRestaurant,
  registerOwner,
  restaurantForm,
  setVerificationAsAdmin,
  verifyRestaurantAsAdmin,
} from "./helpers";

test.describe("verificación del restaurante (panel del dueño)", () => {
  test("un restaurante nuevo está pendiente y, aunque se publique, no se ve hasta verificarlo", async ({
    page,
  }) => {
    await registerOwner(page);
    const { url, name } = await createRestaurant(page);
    const slug = await restaurantForm(page).getByLabel("Dirección de la carta").inputValue();

    await expect(
      page.getByText("Pendiente de verificación", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("status").filter({ hasText: "comprueba que cada restaurante" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Publicar carta" }).click();
    await expect(page.getByText("Publicado", { exact: true })).toBeVisible();

    await page.goto(`${url}/qr`);
    await expect(
      page.getByText(/pendiente de verificación por el equipo de SafeBite/),
    ).toBeVisible();
    await page.goto(`/r/${slug}`);
    await expect(page.getByRole("heading", { name })).toHaveCount(0);

    await verifyRestaurantAsAdmin(url);
    await page.goto(url);
    await expect(page.getByText("Verificado", { exact: true })).toBeVisible();
    await expect(page.getByText("Pendiente de verificación", { exact: true })).toHaveCount(0);
    await page.goto(`/r/${slug}`);
    await expect(page.getByRole("heading", { name })).toBeVisible();
  });

  test("si se rechaza, el dueño ve el motivo", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await setVerificationAsAdmin(url, "rejected", "El teléfono del local no responde.");
    await page.reload();
    await expect(page.getByText("Rechazado", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("alert").filter({ hasText: "No hemos podido verificar" }),
    ).toContainText("Motivo: El teléfono del local no responde.");
  });

  test("cambiar el nombre de un restaurante verificado lo deja pendiente otra vez", async ({
    page,
  }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await verifyRestaurantAsAdmin(url);
    await page.reload();

    const form = restaurantForm(page);
    await expect(form.getByText(/tendremos que verificar el restaurante de nuevo/)).toBeVisible();
    // El teléfono no afecta a la verificación...
    await form.getByLabel(/^Teléfono/).fill("+34 600 111 222");
    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(form.getByRole("status")).toHaveText("Cambios guardados.");
    await page.reload();
    await expect(page.getByText("Verificado", { exact: true })).toBeVisible();

    // ...el nombre, sí.
    await restaurantForm(page).getByLabel("Nombre del establecimiento").fill("Nombre Nuevo");
    await restaurantForm(page).getByRole("button", { name: "Guardar cambios" }).click();
    await expect(restaurantForm(page).getByRole("status")).toHaveText("Cambios guardados.");
    await page.reload();
    await expect(
      page.getByText("Pendiente de verificación", { exact: true }).first(),
    ).toBeVisible();
  });

  test("la lista de restaurantes muestra el estado de la verificación", async ({ page }) => {
    await registerOwner(page);
    const { name } = await createRestaurant(page);
    await page.goto("/panel");
    await expect(page.getByRole("link", { name: new RegExp(name) })).toContainText(
      "Pendiente de verificación",
    );
  });
});
