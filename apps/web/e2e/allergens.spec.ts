import { expect, test, type Page } from "@playwright/test";
import { createRestaurant, registerOwner } from "./helpers";

const UNDECLARED = "Sin declarar";

function editor(page: Page) {
  return page.getByRole("form", { name: "Alérgenos" });
}

function allergenGroup(page: Page, label: string) {
  return editor(page).getByRole("group", { name: label, exact: true });
}

/** Elige un nivel para un alérgeno (los radios son visualmente botones). */
async function choose(page: Page, allergenLabel: string, level: string) {
  await allergenGroup(page, allergenLabel).getByText(level, { exact: true }).click();
}

async function expectChoice(page: Page, allergenLabel: string, level: string) {
  await expect(
    allergenGroup(page, allergenLabel).getByRole("radio", { name: level, exact: true }),
  ).toBeChecked();
}

async function save(page: Page) {
  await editor(page).getByRole("button", { name: "Guardar alérgenos" }).click();
  await expect(editor(page).getByRole("status").first()).toHaveText("Alérgenos guardados.");
}

/** Registra un dueño, crea restaurante y plato, y deja la página en la ficha del plato. */
async function setupDish(page: Page) {
  await registerOwner(page);
  const { url } = await createRestaurant(page);
  await page.goto(`${url}/platos/nuevo`);
  const form = page.getByRole("form", { name: "Datos del plato" });
  await form.getByLabel("Nombre del plato").fill("Plato de prueba");
  await form.getByRole("button", { name: "Crear plato" }).click();
  await expect(page).toHaveURL(/\/platos\/[0-9a-f-]{36}$/);
  return { restaurantUrl: url, dishUrl: page.url() };
}

test.describe("editor de alérgenos", () => {
  test("un plato nuevo empieza con los 14 alérgenos sin declarar", async ({ page }) => {
    const { restaurantUrl } = await setupDish(page);
    await expect(editor(page).getByRole("group")).toHaveCount(14);
    await expect(editor(page).getByRole("radio", { name: UNDECLARED, checked: true })).toHaveCount(
      14,
    );
    await expect(
      editor(page).getByRole("radio", { name: "No contiene", checked: true }),
    ).toHaveCount(0);
    await expect(editor(page)).toContainText(
      "0 de 14 alérgenos declarados · Faltan 14 alérgenos por declarar",
    );

    await page.goto(`${restaurantUrl}/platos`);
    await expect(page.getByText("Faltan 14 alérgenos por declarar")).toBeVisible();
    await expect(page.getByText("1 plato tiene alérgenos sin declarar.")).toBeVisible();
  });

  test("lo declarado se guarda y lo no marcado sigue sin declarar", async ({ page }) => {
    await setupDish(page);
    await choose(page, "Cereales con gluten", "Contiene");
    await choose(page, "Leche y lácteos", "Trazas");
    await choose(page, "Huevos", "No contiene");
    await expect(page.getByText("Tienes cambios sin guardar.")).toBeVisible();
    await save(page);
    await expect(page.getByText("Tienes cambios sin guardar.")).toBeHidden();

    await page.reload();
    await expectChoice(page, "Cereales con gluten", "Contiene");
    await expectChoice(page, "Leche y lácteos", "Trazas");
    await expectChoice(page, "Huevos", "No contiene");
    await expectChoice(page, "Pescado", UNDECLARED);
    await expect(editor(page)).toContainText("3 de 14 alérgenos declarados");
  });

  test("volver a «Sin declarar» borra la declaración", async ({ page }) => {
    await setupDish(page);
    await choose(page, "Sésamo", "No contiene");
    await save(page);
    await choose(page, "Sésamo", UNDECLARED);
    await save(page);

    await page.reload();
    await expectChoice(page, "Sésamo", UNDECLARED);
    await expect(editor(page)).toContainText("0 de 14 alérgenos declarados");
  });

  test("marcar en bloque como «No contiene» pide confirmación y respeta lo ya declarado", async ({
    page,
  }) => {
    const { restaurantUrl } = await setupDish(page);
    await choose(page, "Cereales con gluten", "Contiene");

    const bulk = editor(page).getByRole("button", {
      name: "Marcar los no declarados como «No contiene»",
    });
    const dialog = page.getByRole("dialog", { name: "¿Marcar como «No contiene»?" });

    await bulk.click();
    await expect(dialog.getByRole("listitem")).toHaveCount(13);
    await expect(
      dialog.getByRole("listitem").filter({ hasText: "Cereales con gluten" }),
    ).toHaveCount(0);
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expectChoice(page, "Pescado", UNDECLARED);

    await bulk.click();
    await dialog.getByRole("button", { name: "Sí, no contiene ninguno" }).click();
    await expectChoice(page, "Cereales con gluten", "Contiene");
    await expectChoice(page, "Pescado", "No contiene");
    await expect(bulk).toBeDisabled();
    // Solo cambia la selección: no se guarda hasta pulsar «Guardar alérgenos».
    await expect(page.getByText("Tienes cambios sin guardar.")).toBeVisible();
    await page.reload();
    await expectChoice(page, "Pescado", UNDECLARED);

    await choose(page, "Cereales con gluten", "Contiene");
    await bulk.click();
    await dialog.getByRole("button", { name: "Sí, no contiene ninguno" }).click();
    await save(page);
    await expect(editor(page)).toContainText("14 de 14 alérgenos declarados");

    await page.goto(`${restaurantUrl}/platos`);
    await expect(page.getByText("Alérgenos completos")).toBeVisible();
    await expect(page.getByText(/tiene alérgenos sin declarar/)).toHaveCount(0);
  });

  test("un nivel inválido hace fallar todo el guardado", async ({ page }) => {
    await setupDish(page);
    await choose(page, "Cereales con gluten", "Contiene");
    await save(page);

    await choose(page, "Cereales con gluten", "No contiene");
    await choose(page, "Leche y lácteos", "Trazas");
    // Simula un formulario manipulado: un valor que no es ningún nivel válido.
    // Se cambia justo antes de enviar (React restaura el valor en cada repintado).
    await allergenGroup(page, "Leche y lácteos")
      .getByRole("radio", { name: "Trazas" })
      .evaluate((input) => {
        (input as HTMLInputElement).value = "none";
      });
    await editor(page).getByRole("button", { name: "Guardar alérgenos" }).click();
    await expect(editor(page).getByRole("alert")).toHaveText(
      "Hay un valor no válido. Recarga la página e inténtalo de nuevo.",
    );

    await page.reload();
    await expectChoice(page, "Cereales con gluten", "Contiene");
    await expectChoice(page, "Leche y lácteos", UNDECLARED);
  });

  test("un alérgeno que falta del formulario queda sin declarar, nunca como «No contiene»", async ({
    page,
  }) => {
    await setupDish(page);
    await editor(page)
      .getByRole("button", { name: "Marcar los no declarados como «No contiene»" })
      .click();
    await page
      .getByRole("dialog", { name: "¿Marcar como «No contiene»?" })
      .getByRole("button", { name: "Sí, no contiene ninguno" })
      .click();
    // Simula un envío manipulado en el que el gluten no llega al servidor.
    await allergenGroup(page, "Cereales con gluten").evaluate((group) => group.remove());
    await save(page);

    await page.reload();
    await expectChoice(page, "Cereales con gluten", UNDECLARED);
    await expectChoice(page, "Pescado", "No contiene");
    await expect(editor(page)).toContainText("13 de 14 alérgenos declarados");
  });
});
