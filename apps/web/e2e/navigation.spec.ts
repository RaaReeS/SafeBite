import { expect, test } from "@playwright/test";
import { SEED_DINER, login } from "./helpers";

const NAV = "Secciones de tu cuenta";

test.describe("navegación del comensal", () => {
  test("en el ordenador, el menú de la cabecera marca la página actual", async ({ page }) => {
    await login(page, SEED_DINER.email, SEED_DINER.password);
    await expect(page).toHaveURL(/\/comensal$/);
    const nav = page.getByRole("navigation", { name: NAV });
    await expect(nav.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");

    await nav.getByRole("link", { name: "Mi familia" }).click();
    await expect(page).toHaveURL(/\/comensal\/familia$/);
    await expect(nav.getByRole("link", { name: "Mi familia" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(nav.getByRole("link", { name: "Inicio" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test.describe("en el móvil", () => {
    test.use({ viewport: { width: 375, height: 740 } });

    test("el menú es una barra inferior que no tapa el contenido ni desborda", async ({ page }) => {
      await login(page, SEED_DINER.email, SEED_DINER.password);
      await expect(page).toHaveURL(/\/comensal$/);

      // Solo hay un menú visible (la barra inferior), con las cinco secciones.
      const nav = page.getByRole("navigation", { name: NAV });
      await expect(nav).toHaveCount(1);
      await expect(nav.getByRole("link")).toHaveCount(5);
      const navBox = await nav.boundingBox();
      expect(navBox?.y ?? 0).toBeGreaterThan(600);

      await nav.getByRole("link", { name: "Mis alergias" }).click();
      await expect(page).toHaveURL(/\/comensal\/alergias$/);

      // Sin desplazamiento horizontal y con hueco al final para la barra.
      const layout = await page.evaluate(() => {
        const main = document.querySelector("main");
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          paddingBottom: main ? Number.parseFloat(getComputedStyle(main).paddingBottom) : 0,
        };
      });
      expect(layout.overflow).toBeLessThanOrEqual(0);
      expect(layout.paddingBottom).toBeGreaterThanOrEqual(navBox?.height ?? 0);
    });
  });
});
