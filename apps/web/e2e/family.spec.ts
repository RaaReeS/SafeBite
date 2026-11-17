import { expect, test, type Page } from "@playwright/test";
import { registerDiner } from "./helpers";

async function giveConsent(page: Page) {
  await page.goto("/comensal/alergias");
  const consent = page.getByRole("form", { name: "Tus datos de salud" });
  await consent.getByRole("checkbox").check();
  await consent.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("form", { name: "Mis alergias" })).toBeVisible();
}

async function addMember(page: Page, name: string) {
  await page.goto("/comensal/familia");
  const form = page.getByRole("form", { name: "Añadir a alguien" });
  await form.getByLabel("Nombre o apodo").fill(name);
  await form.getByLabel(/Soy su madre, padre o tutor legal/).check();
  await form.getByRole("button", { name: "Añadir" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

test.describe("perfiles de familia (web)", () => {
  test("sin consentimiento para datos de salud, primero pide configurar las propias", async ({
    page,
  }) => {
    await registerDiner(page);
    await page.getByRole("link", { name: "Mi familia" }).click();
    await expect(page.getByText(/configura las tuyas y da tu consentimiento/)).toBeVisible();
    await expect(page.getByRole("form", { name: "Añadir a alguien" })).toHaveCount(0);
  });

  test("añade a un familiar con sus alergias; el plan gratis permite 1", async ({ page }) => {
    await registerDiner(page);
    await giveConsent(page);
    await page.goto("/comensal/familia");
    await expect(page.getByText("0 de 1 familiares en tu plan.")).toBeVisible();

    // La declaración de tutor o permiso es obligatoria, también en el servidor.
    const form = page.getByRole("form", { name: "Añadir a alguien" });
    await form.getByLabel("Nombre o apodo").fill("Lucía");
    await form.evaluate((f) => f.setAttribute("novalidate", ""));
    await form.getByRole("button", { name: "Añadir" }).click();
    await expect(page.getByText(/necesitas su permiso o ser su tutor/)).toBeVisible();

    await addMember(page, "Lucía");
    const allergies = page.getByRole("form", { name: "Alergias de Lucía" });
    await allergies.getByLabel("Leche y lácteos").check();
    await allergies.getByRole("button", { name: "Guardar" }).click();
    await expect(allergies.getByRole("status")).toHaveText("Sus alergias se han guardado.");

    await page.getByRole("link", { name: "← Mi familia" }).click();
    const list = page.getByRole("list", { name: "Mi familia" });
    await expect(list).toContainText("Lucía");
    await expect(list).toContainText("Leche y lácteos");
    await expect(page.getByText("1 de 1 familiares en tu plan.")).toBeVisible();
    await expect(page.getByRole("form", { name: "Añadir a alguien" })).toHaveCount(0);
    await expect(page.getByText(/El plan premium, con hasta 10/)).toBeVisible();
  });

  test("se puede renombrar y quitar a un familiar", async ({ page }) => {
    await registerDiner(page);
    await giveConsent(page);
    await addMember(page, "Pablo");

    const rename = page.getByRole("form", { name: "Cambiar el nombre" });
    await rename.getByLabel("Nombre o apodo").fill("Pablito");
    await rename.getByRole("button", { name: "Guardar nombre" }).click();
    await expect(rename.getByRole("status")).toHaveText("Nombre guardado.");
    await expect(page.getByRole("heading", { level: 1, name: "Pablito" })).toBeVisible();

    await page.getByRole("button", { name: "Quitar de mi familia" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Quitar de mi familia" }).click();
    await expect(page.getByText("Se ha quitado de tu familia")).toBeVisible();
    await expect(page.getByText("Aún no has añadido a nadie.")).toBeVisible();
  });

  test("otro comensal no puede ver a la familia de nadie", async ({ browser }) => {
    const owner = await browser.newPage();
    await registerDiner(owner);
    await giveConsent(owner);
    await addMember(owner, "Secreto");
    const memberUrl = owner.url();

    const other = await browser.newPage();
    await registerDiner(other);
    await other.goto(memberUrl);
    await expect(other.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
    await expect(other.getByText("Secreto")).toHaveCount(0);
  });
});

test.describe("¿para quién? (carta y mapa)", () => {
  test("la carta y el mapa filtran por defecto para toda la familia", async ({ page }) => {
    await page.route("https://tiles.openfreemap.org/**", (route) => route.abort());
    await registerDiner(page);
    await giveConsent(page);
    // Yo: celíaco.
    const mine = page.getByRole("form", { name: "Mis alergias" });
    await mine.getByLabel("Cereales con gluten").check();
    await mine.getByRole("button", { name: "Guardar" }).click();
    await expect(mine.getByRole("status")).toBeVisible();
    // Lucía: alérgica a la leche.
    await addMember(page, "Lucía");
    const hers = page.getByRole("form", { name: "Alergias de Lucía" });
    await hers.getByLabel("Leche y lácteos").check();
    await hers.getByRole("button", { name: "Guardar" }).click();
    await expect(hers.getByRole("status")).toBeVisible();

    await page.goto("/r/la-huerta-demo");
    const forWhom = page.getByRole("group", { name: "¿Para quién es?" });
    await expect(forWhom.getByLabel("Yo")).toBeChecked();
    await expect(forWhom.getByLabel("Lucía")).toBeChecked();
    await expect(page.getByText("Filtrada para: Yo, Lucía.")).toBeVisible();
    const button = (name: string) => page.getByRole("button", { name, exact: true });
    await expect(button("Cereales con gluten")).toHaveAttribute("aria-pressed", "true");
    await expect(button("Leche y lácteos")).toHaveAttribute("aria-pressed", "true");
    // El brownie lleva leche: no es apto para el grupo.
    await expect(page.getByRole("listitem").filter({ hasText: "Brownie" })).toContainText(
      "No apto",
    );

    await forWhom.getByLabel("Lucía").uncheck();
    await expect(page.getByText("Filtrada para: Yo.")).toBeVisible();
    await expect(button("Leche y lácteos")).toHaveAttribute("aria-pressed", "false");
    // Siempre queda al menos una persona.
    await forWhom.getByLabel("Yo").click();
    await expect(forWhom.getByLabel("Yo")).toBeChecked();

    await page.goto("/comensal/restaurantes");
    const mapForWhom = page.getByRole("group", { name: "¿Para quién buscas?" });
    await expect(mapForWhom.getByLabel("Yo")).toBeChecked();
    await expect(mapForWhom.getByLabel("Lucía")).toBeChecked();
    await expect(page.getByText(/Puedes comer en \d+ de \d+ restaurantes/)).toBeVisible();
  });
});
