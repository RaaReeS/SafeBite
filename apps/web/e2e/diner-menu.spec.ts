import { expect, test, type Page } from "@playwright/test";
import { SEED_DINER, SEED_OWNER, login, registerDiner } from "./helpers";

const MENU = "/r/la-huerta-demo";

function allergenButton(page: Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}

test.describe("carta con el perfil del comensal", () => {
  test("con sesión, la carta se filtra sola con el perfil guardado", async ({ page }) => {
    // El comensal del seed es celíaco y alérgico a los frutos de cáscara.
    await login(page, SEED_DINER.email, SEED_DINER.password);
    await expect(page).toHaveURL(/\/comensal$/);
    await page.goto(MENU);

    await expect(page.getByText("Filtrada con tu perfil de alergias.")).toBeVisible();
    await expect(allergenButton(page, "Cereales con gluten")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(allergenButton(page, "Frutos de cáscara")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("listitem").filter({ hasText: "Pan con tomate" })).toContainText(
      "No apto",
    );

    // Ajustar solo para esta carta no cambia el perfil guardado.
    await allergenButton(page, "Leche y lácteos").click();
    await expect(page.getByText(/Ajustada solo para esta carta/)).toBeVisible();
    await page.getByRole("button", { name: "Volver a mi perfil" }).click();
    await expect(page.getByText("Filtrada con tu perfil de alergias.")).toBeVisible();

    await allergenButton(page, "Leche y lácteos").click();
    await page.reload();
    await expect(allergenButton(page, "Leche y lácteos")).toHaveAttribute("aria-pressed", "false");
    await page.goto("/comensal");
    await expect(
      page.getByRole("list", { name: "Tus alergias: Cereales con gluten, Frutos de cáscara." }),
    ).toBeVisible();
  });

  test("sin perfil guardado invita a configurarlo", async ({ page }) => {
    await registerDiner(page);
    await page.goto(MENU);
    await expect(
      page.getByRole("link", {
        name: "Configura tus alergias para que las cartas se filtren solas",
      }),
    ).toBeVisible();
    await expect(allergenButton(page, "Cereales con gluten")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("sin sesión, o con una cuenta de restaurante, no se usa ningún perfil", async ({ page }) => {
    await page.goto(MENU);
    await expect(page.getByRole("heading", { name: "La Huerta Demo" })).toBeVisible();
    await expect(page.getByText("Filtrada con tu perfil de alergias.")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "← Restaurantes" })).toHaveCount(0);

    await login(page, SEED_OWNER.email, SEED_OWNER.password);
    await expect(page).toHaveURL(/\/panel$/);
    await page.goto(MENU);
    await expect(page.getByRole("heading", { name: "La Huerta Demo" })).toBeVisible();
    await expect(page.getByText("Filtrada con tu perfil de alergias.")).toHaveCount(0);
  });
});
