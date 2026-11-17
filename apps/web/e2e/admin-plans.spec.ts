import { expect, test } from "@playwright/test";
import { SEED_DINER, login, loginAsAdmin } from "./helpers";

test.describe("planes de las cuentas (administración)", () => {
  test("el admin da premium a una cuenta y el comensal puede guardar hasta 10 familiares", async ({
    browser,
  }) => {
    const admin = await browser.newPage();
    await loginAsAdmin(admin);
    await admin
      .getByRole("navigation", { name: "Secciones de administración" })
      .getByRole("link", { name: "Planes" })
      .click();
    const form = admin.getByRole("form", { name: "Cambiar el plan de una cuenta" });

    await form.getByLabel("Email de la cuenta").fill("nadie@safebite.test");
    await form.getByRole("button", { name: "Dar premium" }).click();
    await expect(form.getByText("No hay ninguna cuenta con ese email.")).toBeVisible();

    await form.getByLabel("Email de la cuenta").fill(SEED_DINER.email);
    await form.getByRole("button", { name: "Dar premium" }).click();
    await expect(form.getByRole("status")).toHaveText(
      `${SEED_DINER.email} ya tiene el plan premium.`,
    );

    const diner = await browser.newPage();
    try {
      await login(diner, SEED_DINER.email, SEED_DINER.password);
      await expect(diner).toHaveURL(/\/comensal$/);
      await diner.goto("/comensal/familia");
      await expect(diner.getByText(/de 10 familiares en tu plan/)).toBeVisible();
    } finally {
      // Deja la cuenta del seed como estaba.
      await form.getByLabel("Email de la cuenta").fill(SEED_DINER.email);
      await form.getByRole("button", { name: "Volver al plan gratis" }).click();
      await expect(form.getByRole("status")).toHaveText(
        `${SEED_DINER.email} vuelve al plan gratis.`,
      );
    }
    await diner.reload();
    await expect(diner.getByText(/de 1 familiares en tu plan/)).toBeVisible();
  });
});
