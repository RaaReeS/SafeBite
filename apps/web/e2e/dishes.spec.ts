import { expect, test, type Page } from "@playwright/test";
import { createRestaurant, registerOwner, uniqueName } from "./helpers";

function dishForm(page: Page) {
  return page.getByRole("form", { name: "Datos del plato" });
}

type DishInput = { name: string; price?: string; category?: string; ingredients?: string };

/** Crea un plato desde la ficha del restaurante y deja la página en la ficha del plato. */
async function createDish(page: Page, restaurantUrl: string, dish: DishInput) {
  await page.goto(`${restaurantUrl}/platos/nuevo`);
  const form = dishForm(page);
  await form.getByLabel("Nombre del plato").fill(dish.name);
  if (dish.price !== undefined) await form.getByLabel(/^Precio/).fill(dish.price);
  if (dish.category !== undefined) await form.getByLabel(/^Categoría/).fill(dish.category);
  if (dish.ingredients !== undefined) {
    await form.getByLabel(/^Ingredientes/).fill(dish.ingredients);
  }
  await form.getByRole("button", { name: "Crear plato" }).click();
  await expect(page).toHaveURL(/\/platos\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: dish.name })).toBeVisible();
  return page.url();
}

function dishList(page: Page) {
  return page.getByRole("list", { name: "Platos" });
}

test.describe("platos", () => {
  test("crear un plato con precio, categoría e ingredientes", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await createDish(page, url, {
      name: "Ensalada de la huerta",
      price: "9,5",
      category: "Entrantes",
      ingredients: "Lechuga, tomate",
    });

    const form = dishForm(page);
    await expect(form.getByLabel(/^Precio/)).toHaveValue("9,50");
    await expect(form.getByLabel(/^Categoría/)).toHaveValue("Entrantes");

    await page.getByRole("link", { name: "← Platos" }).click();
    const item = dishList(page).getByRole("listitem").filter({ hasText: "Ensalada de la huerta" });
    await expect(item).toContainText("Entrantes");
    await expect(item).toContainText("9,50 €");
  });

  test("el servidor rechaza un precio inválido y conserva lo escrito", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await page.goto(`${url}/platos/nuevo`);
    const form = dishForm(page);
    await form.getByLabel("Nombre del plato").fill("Croquetas");
    await form.getByLabel(/^Precio/).fill("nueve euros");
    await form.getByRole("button", { name: "Crear plato" }).click();
    await expect(form.getByText("Introduce un precio válido")).toBeVisible();
    await expect(form.getByLabel("Nombre del plato")).toHaveValue("Croquetas");
  });

  test("editar un plato y ocultarlo de la carta", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await createDish(page, url, { name: "Brownie", price: "6" });

    const form = dishForm(page);
    await form.getByLabel(/^Precio/).fill("6,50");
    await form.getByLabel("Mostrar este plato en la carta").uncheck();
    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(form.getByRole("status")).toHaveText("Cambios guardados.");

    await page.reload();
    await expect(dishForm(page).getByLabel(/^Precio/)).toHaveValue("6,50");
    await expect(dishForm(page).getByLabel("Mostrar este plato en la carta")).not.toBeChecked();

    await page.goto(`${url}/platos`);
    await expect(dishList(page).getByRole("listitem").filter({ hasText: "Brownie" })).toContainText(
      "Oculto",
    );
  });

  test("los platos se pueden reordenar", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    for (const name of ["Primero", "Segundo", "Tercero"]) {
      await createDish(page, url, { name });
    }

    await page.goto(`${url}/platos`);
    const names = dishList(page).getByRole("listitem").getByRole("link");
    await expect(names).toHaveText([/^Primero/, /^Segundo/, /^Tercero/]);
    await expect(page.getByRole("button", { name: "Subir «Primero»" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Bajar «Tercero»" })).toBeDisabled();

    await page.getByRole("button", { name: "Bajar «Primero»" }).click();
    await expect(names).toHaveText([/^Segundo/, /^Primero/, /^Tercero/]);

    await page.getByRole("button", { name: "Subir «Tercero»" }).click();
    await expect(names).toHaveText([/^Segundo/, /^Tercero/, /^Primero/]);

    await page.reload();
    await expect(names).toHaveText([/^Segundo/, /^Tercero/, /^Primero/]);
  });

  test("eliminar un plato pide confirmación", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await createDish(page, url, { name: "Plato a borrar" });

    await page.getByRole("button", { name: "Eliminar plato" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Eliminar este plato?" });
    await dialog.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page).toHaveURL(/\/platos$/);
    await expect(page.getByText("Aún no has añadido platos a esta carta.")).toBeVisible();
  });
});

test.describe("aislamiento de platos entre restaurantes", () => {
  test("un dueño no puede ver, editar ni añadir platos en el restaurante de otro", async ({
    browser,
  }) => {
    const ownerA = await browser.newPage();
    await registerOwner(ownerA);
    const { url: restaurantUrl } = await createRestaurant(ownerA);
    const secretDish = uniqueName("Plato secreto");
    const dishUrl = await createDish(ownerA, restaurantUrl, { name: secretDish });

    const ownerB = await browser.newPage();
    await registerOwner(ownerB);
    for (const url of [`${restaurantUrl}/platos`, `${restaurantUrl}/platos/nuevo`, dishUrl]) {
      await ownerB.goto(url);
      await expect(ownerB.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
      await expect(ownerB.getByText(secretDish)).toHaveCount(0);
      await expect(dishForm(ownerB)).toHaveCount(0);
    }

    await ownerA.close();
    await ownerB.close();
  });
});
