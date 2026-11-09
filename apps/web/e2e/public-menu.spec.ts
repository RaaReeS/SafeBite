import { expect, test } from "@playwright/test";
import { createRestaurant, registerOwner, restaurantForm, uniqueName } from "./helpers";

// Usa el restaurante publicado del seed (supabase/seed.sql): "La Huerta Demo".
const SEED_SLUG = "la-huerta-demo";
const SEED_OWNER_ID = "10000000-0000-0000-0000-000000000001";

test.describe("carta pública por QR", () => {
  test("muestra la carta publicada sin registro, con el aviso obligatorio", async ({ page }) => {
    await page.goto(`/r/${SEED_SLUG}`);
    await expect(page).toHaveTitle("Carta de La Huerta Demo · SafeBite");
    await expect(page.getByRole("heading", { level: 1, name: "La Huerta Demo" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Llamar/ })).toHaveAttribute(
      "href",
      "tel:+34600000000",
    );
    await expect(
      page
        .getByText("Confirma siempre con el establecimiento y revisa la etiqueta física.")
        .first(),
    ).toBeVisible();
    await expect(
      page.getByText("Información declarada por el establecimiento.").first(),
    ).toBeVisible();
  });

  test("agrupa por categoría, muestra precios y lo declarado, y oculta los platos inactivos", async ({
    page,
  }) => {
    await page.goto(`/r/${SEED_SLUG}`);
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(["Entrantes", "Postres"]);

    const bread = page.getByRole("listitem").filter({ hasText: "Pan con tomate" });
    await expect(bread).toContainText("4,50 €");
    await expect(bread).toContainText("Contiene: Cereales con gluten");

    const brownie = page.getByRole("listitem").filter({ hasText: "Brownie sin gluten" });
    await expect(brownie).toContainText("Puede contener trazas de: Frutos de cáscara");

    const croquetas = page.getByRole("listitem").filter({ hasText: "Croquetas caseras" });
    await expect(croquetas).toContainText(
      "El establecimiento no ha declarado los alérgenos de este plato.",
    );

    await expect(page.getByText("Plato fuera de carta")).toHaveCount(0);
  });

  test("una carta inexistente o con dirección inválida muestra «Carta no encontrada»", async ({
    page,
  }) => {
    for (const slug of ["no-existe-esta-carta", "NO VALIDA", "a"]) {
      await page.goto(`/r/${encodeURIComponent(slug)}`);
      await expect(page.getByRole("heading", { name: "Carta no encontrada" })).toBeVisible();
    }
  });

  test("una carta sin publicar no es visible, ni siquiera para su dueño con sesión", async ({
    page,
  }) => {
    await registerOwner(page);
    const name = uniqueName("Borrador Secreto");
    await createRestaurant(page, name);
    const slug = await restaurantForm(page).getByLabel("Dirección de la carta").inputValue();

    await page.goto(`/r/${slug}`);
    await expect(page.getByRole("heading", { name: "Carta no encontrada" })).toBeVisible();
    await expect(page.getByText(name)).toHaveCount(0);
  });

  test("la página no expone quién es el dueño", async ({ page }) => {
    const response = await page.goto(`/r/${SEED_SLUG}`);
    const html = (await response?.text()) ?? "";
    expect(html).toContain("La Huerta Demo");
    expect(html).not.toContain(SEED_OWNER_ID);
    expect(html).not.toContain("owner_id");
  });
});
