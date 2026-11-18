import { expect, test } from "@playwright/test";
import { DEFAULT_PASSWORD, formAlert, login, registerDiner } from "./helpers";

test.describe("perfil de alergias del comensal en la web", () => {
  test("pide el consentimiento explícito y luego guarda las alergias", async ({ page }) => {
    await registerDiner(page);
    await expect(page.getByText("Aún no has configurado tus alergias.")).toBeVisible();
    await page.getByRole("link", { name: "Configurar mis alergias" }).click();

    const consent = page.getByRole("form", { name: "Tus datos de salud" });
    await expect(consent).toContainText("Nunca se comparte con los restaurantes");
    // El servidor también exige la casilla.
    await consent.evaluate((form) => form.setAttribute("novalidate", ""));
    await consent.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText(/necesitamos tu consentimiento explícito/)).toBeVisible();

    await page.getByRole("form", { name: "Tus datos de salud" }).getByRole("checkbox").check();
    await page
      .getByRole("form", { name: "Tus datos de salud" })
      .getByRole("button", { name: "Continuar" })
      .click();

    const allergies = page.getByRole("form", { name: "Mis alergias" });
    await allergies.getByLabel("Cereales con gluten").check();
    await allergies.getByLabel("Frutos de cáscara").check();
    await allergies.getByRole("button", { name: "Guardar" }).click();
    await expect(allergies.getByRole("status")).toHaveText("Tu perfil de alergias se ha guardado.");

    await page.getByRole("link", { name: "Inicio" }).click();
    await expect(
      page.getByRole("list", { name: "Tus alergias: Cereales con gluten, Frutos de cáscara." }),
    ).toBeVisible();
  });

  test("retirar el consentimiento borra las alergias", async ({ page }) => {
    await registerDiner(page);
    await page.goto("/comensal/alergias");
    await page.getByRole("form", { name: "Tus datos de salud" }).getByRole("checkbox").check();
    await page
      .getByRole("form", { name: "Tus datos de salud" })
      .getByRole("button", { name: "Continuar" })
      .click();
    const allergies = page.getByRole("form", { name: "Mis alergias" });
    await allergies.getByLabel("Leche y lácteos").check();
    await allergies.getByRole("button", { name: "Guardar" }).click();
    await expect(allergies.getByRole("status")).toBeVisible();

    await page.goto("/comensal/cuenta");
    await page
      .getByRole("button", { name: "Retirar consentimiento y borrar mis alergias" })
      .click();
    await page.getByRole("dialog").getByRole("button", { name: "Retirar y borrar" }).click();
    await expect(page.getByText("Has retirado tu consentimiento")).toBeVisible();

    await page.goto("/comensal");
    await expect(page.getByText("Aún no has configurado tus alergias.")).toBeVisible();
  });

  test("borrar la cuenta elimina todo y cierra la sesión", async ({ page }) => {
    const email = await registerDiner(page);
    await page.goto("/comensal/cuenta");
    await page.getByRole("button", { name: "Borrar mi cuenta" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Borrar mi cuenta" }).click();
    await expect(page).toHaveURL(/\/\?cuenta=borrada$/);
    await expect(page.getByText("Tu cuenta y todos tus datos se han borrado.")).toBeVisible();

    await page.goto("/comensal");
    await expect(page).toHaveURL(/\/login/);
    await login(page, email, DEFAULT_PASSWORD);
    await expect(formAlert(page)).toHaveText("Email o contraseña incorrectos.");
  });
});
