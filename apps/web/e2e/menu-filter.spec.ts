import { expect, test, type Page } from "@playwright/test";

// Restaurante del seed: Ensalada (14 declarados "no contiene"), Pan con tomate
// (contiene gluten), Brownie (trazas de frutos de cáscara), Croquetas (sin datos).
const SEED_MENU = "/r/la-huerta-demo";

function dishCard(page: Page, name: string) {
  return page.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) });
}

async function select(page: Page, ...allergens: string[]) {
  for (const allergen of allergens) {
    await page.getByRole("button", { name: allergen, exact: true }).click();
  }
}

test.describe("filtro de la carta pública", () => {
  test("sin alergias seleccionadas no hay etiquetas de estado", async ({ page }) => {
    await page.goto(SEED_MENU);
    await expect(page.getByText("Selecciona tus alergias para filtrar la carta.")).toBeVisible();
    await expect(page.locator("[data-status]")).toHaveCount(0);
  });

  test("con gluten y frutos de cáscara, cada plato muestra su estado y sus motivos", async ({
    page,
  }) => {
    await page.goto(SEED_MENU);
    await select(page, "Cereales con gluten", "Frutos de cáscara");
    await expect(page.getByRole("button", { name: "Cereales con gluten" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await expect(dishCard(page, "Ensalada de la huerta")).toContainText("Apto según lo declarado");

    const bread = dishCard(page, "Pan con tomate");
    await expect(bread).toContainText("No apto");
    await expect(bread).toContainText("Contiene: Cereales con gluten");
    await expect(bread.getByRole("heading")).toHaveClass(/line-through/);

    const brownie = dishCard(page, "Brownie sin gluten");
    await expect(brownie).toContainText("Puede contener trazas");
    await expect(brownie).toContainText("Puede contener trazas de: Frutos de cáscara");
    await expect(brownie).toContainText("Otros alérgenos declarados:");

    const croquetas = dishCard(page, "Croquetas caseras");
    await expect(croquetas).toContainText("Sin datos suficientes");
    await expect(croquetas).toContainText(
      "Sin datos sobre: Cereales con gluten, Frutos de cáscara",
    );

    await expect(
      page.getByText("1 apto · 1 con posibles trazas · 1 sin datos suficientes · 1 no apto"),
    ).toBeVisible();
  });

  test("un plato sin declaraciones nunca sale como apto", async ({ page }) => {
    await page.goto(SEED_MENU);
    // Un alérgeno que ningún plato del seed contiene.
    await select(page, "Altramuces");
    await expect(dishCard(page, "Croquetas caseras")).toContainText("Sin datos suficientes");
    await expect(dishCard(page, "Ensalada de la huerta")).toContainText("Apto según lo declarado");
  });

  test("ocultar los no aptos y borrar la selección", async ({ page }) => {
    await page.goto(SEED_MENU);
    await select(page, "Cereales con gluten");
    await page.getByLabel("Ocultar platos no aptos").check();
    await expect(dishCard(page, "Pan con tomate")).toHaveCount(0);
    await expect(page.getByText("1 plato no apto oculto.")).toBeVisible();
    await expect(dishCard(page, "Croquetas caseras")).toBeVisible(); // sin datos: no se oculta

    await page.getByRole("button", { name: "Borrar selección" }).click();
    await expect(dishCard(page, "Pan con tomate")).toBeVisible();
    await expect(page.locator("[data-status]")).toHaveCount(0);
  });

  test("privacidad: las alergias marcadas no salen del navegador ni se guardan", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      requests.push(`${request.url()} ${request.postData() ?? ""}`);
    });

    await page.goto(SEED_MENU);
    const urlBefore = page.url();
    requests.length = 0;

    await select(page, "Cereales con gluten", "Leche y lácteos", "Sésamo");
    await page.getByLabel("Ocultar platos no aptos").check();
    await expect(dishCard(page, "Croquetas caseras")).toContainText("Sin datos suficientes");

    expect(page.url()).toBe(urlBefore);
    const leaked = requests.filter((entry) => /gluten|milk|sesame|leche|s[eé]samo/i.test(entry));
    expect(leaked).toEqual([]);
    const stored = await page.evaluate(() => ({
      local: Object.keys(localStorage).length,
      session: Object.keys(sessionStorage).length,
    }));
    expect(stored).toEqual({ local: 0, session: 0 });
  });

  test("lenguaje responsable: la carta nunca dice «seguro», «garantizado» ni «100 %»", async ({
    page,
  }) => {
    await page.goto(SEED_MENU);
    await select(page, "Cereales con gluten", "Frutos de cáscara");
    const text = (await page.locator("body").innerText())
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
    for (const forbidden of ["seguro", "segura", "garantiz", "100 %", "100%", "sin riesgo"]) {
      expect(text, forbidden).not.toContain(forbidden);
    }
  });
});
