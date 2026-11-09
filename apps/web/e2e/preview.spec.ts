import { expect, test, type Page } from "@playwright/test";
import { createRestaurant, registerOwner, restaurantForm, uniqueName } from "./helpers";

async function addDish(page: Page, restaurantUrl: string, name: string, active = true) {
  await page.goto(`${restaurantUrl}/platos/nuevo`);
  const form = page.getByRole("form", { name: "Datos del plato" });
  await form.getByLabel("Nombre del plato").fill(name);
  if (!active) await form.getByLabel("Mostrar este plato en la carta").uncheck();
  await form.getByRole("button", { name: "Crear plato" }).click();
  await expect(page).toHaveURL(/\/platos\/[0-9a-f-]{36}$/);
}

async function declareGluten(page: Page) {
  const editor = page.getByRole("form", { name: "Alérgenos" });
  await editor
    .getByRole("group", { name: "Cereales con gluten", exact: true })
    .getByText("Contiene", { exact: true })
    .click();
  await editor.getByRole("button", { name: "Guardar alérgenos" }).click();
  await expect(editor.getByRole("status").first()).toHaveText("Alérgenos guardados.");
}

function dishNames(page: Page) {
  return page.getByRole("listitem").getByRole("heading", { level: 3 });
}

test.describe("vista previa de la carta", () => {
  test("funciona sin publicar, filtra y no muestra los platos ocultos", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await addDish(page, url, "Pan con tomate");
    await declareGluten(page);
    await addDish(page, url, "Plato oculto", false);

    await page.goto(url);
    await page.getByRole("link", { name: "Vista previa" }).click();
    await expect(page).toHaveURL(/\/vista-previa$/);
    await expect(page.getByText("Así verán tu carta tus clientes")).toBeVisible();
    await expect(page.getByText("Tu carta aún no está publicada")).toBeVisible();

    await expect(dishNames(page)).toHaveText(["Pan con tomate"]);
    await page.getByRole("button", { name: "Cereales con gluten", exact: true }).click();
    await expect(page.getByRole("listitem").filter({ hasText: "Pan con tomate" })).toContainText(
      "No apto",
    );
  });

  test("una vez publicada, muestra lo mismo que la carta pública", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    const slug = await restaurantForm(page).getByLabel("Dirección de la carta").inputValue();
    for (const name of ["Primero", "Segundo"]) await addDish(page, url, name);
    await addDish(page, url, "Oculto", false);
    await page.goto(url);
    await page.getByRole("button", { name: "Publicar carta" }).click();
    await expect(page.getByText("Publicado", { exact: true })).toBeVisible();

    await page.goto(`${url}/vista-previa`);
    await expect(page.getByText("Tu carta aún no está publicada")).toHaveCount(0);
    await expect(dishNames(page)).toHaveCount(2);
    const preview = await dishNames(page).allInnerTexts();

    await page.goto(`/r/${slug}`);
    await expect(dishNames(page)).toHaveText(preview);
    expect(preview).toEqual(["Primero", "Segundo"]);
  });

  test("otro dueño no puede ver la vista previa de una carta ajena", async ({ browser }) => {
    const ownerA = await browser.newPage();
    await registerOwner(ownerA);
    const { url } = await createRestaurant(ownerA);
    const secret = uniqueName("Plato secreto");
    await addDish(ownerA, url, secret);

    const ownerB = await browser.newPage();
    await registerOwner(ownerB);
    await ownerB.goto(`${url}/vista-previa`);
    await expect(ownerB.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
    await expect(ownerB.getByText(secret)).toHaveCount(0);

    await ownerA.close();
    await ownerB.close();
  });
});
