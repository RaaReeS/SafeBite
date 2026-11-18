import { expect, test, type Page } from "@playwright/test";

/** Color de fondo de la página (el de la variable --background aplicada). */
function pageBackground(page: Page) {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

const LIGHT_BG = "rgb(245, 247, 246)";
const DARK_BG = "rgb(11, 18, 16)";

async function choose(page: Page, current: string, option: string) {
  await page.getByRole("button", { name: `Apariencia: ${current}` }).click();
  await page
    .getByRole("radiogroup", { name: "Apariencia" })
    .getByRole("radio", { name: option })
    .click();
}

test.describe("apariencia de la web", () => {
  test.use({ colorScheme: "dark" });

  test("por defecto sigue al sistema; se puede elegir Claro y se recuerda", async ({ page }) => {
    await page.goto("/login");
    expect(await pageBackground(page)).toBe(DARK_BG);

    await choose(page, "Automático", "Claro");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect.poll(() => pageBackground(page)).toBe(LIGHT_BG);
    await expect(page.getByRole("button", { name: "Apariencia: Claro" })).toBeFocused();

    // Al volver a cargar (y en otras páginas) ya sale en claro, sin esperar a React.
    await page.goto("/r/la-huerta-demo");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(await pageBackground(page)).toBe(LIGHT_BG);

    // «Automático» vuelve a seguir al sistema.
    await choose(page, "Claro", "Automático");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    await expect.poll(() => pageBackground(page)).toBe(DARK_BG);
  });

  test("con el sistema en claro se puede elegir Oscuro", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await choose(page, "Automático", "Oscuro");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect.poll(() => pageBackground(page)).toBe(DARK_BG);
  });

  test("el menú se cierra con Escape y el foco vuelve al botón", async ({ page }) => {
    await page.goto("/login");
    const button = page.getByRole("button", { name: "Apariencia: Automático" });
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("radio", { name: "Automático" })).toBeChecked();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("radiogroup", { name: "Apariencia" })).toHaveCount(0);
    await expect(button).toBeFocused();
  });

  test("un valor guardado desconocido se ignora", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("safebite.appearance", "morado"));
    await page.goto("/login");
    await expect(page.locator("html")).not.toHaveAttribute("data-theme");
    await expect(page.getByRole("button", { name: "Apariencia: Automático" })).toBeVisible();
  });
});
