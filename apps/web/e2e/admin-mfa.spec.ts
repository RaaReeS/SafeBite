import { expect, test, type Page } from "@playwright/test";
import {
  ADMIN_EMAIL_CODE_SUBJECT,
  SEED_ADMIN,
  SEED_NEW_ADMIN,
  countEmails,
  getAdminEmailCode,
  localEnv,
  login,
  totpCode,
} from "./helpers";

function codeForm(page: Page) {
  return page.getByRole("form", { name: "Código de verificación" });
}

/**
 * Deja al admin nuevo del seed sin autenticador (para que el test se pueda repetir):
 * entra con la clave del alta, completa el segundo paso y borra el factor.
 */
async function removeNewAdminFactor(secret: string) {
  const env = localEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const apikey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const json = { apikey, "Content-Type": "application/json" };
  const login = (await (
    await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: json,
      body: JSON.stringify(SEED_NEW_ADMIN),
    })
  ).json()) as { access_token: string };
  const auth = (token: string) => ({ ...json, Authorization: `Bearer ${token}` });
  const user = (await (
    await fetch(`${url}/auth/v1/user`, { headers: auth(login.access_token) })
  ).json()) as { factors?: { id: string; status: string }[] };
  for (const factor of user.factors ?? []) {
    let token = login.access_token;
    if (factor.status === "verified") {
      const challenge = (await (
        await fetch(`${url}/auth/v1/factors/${factor.id}/challenge`, {
          method: "POST",
          headers: auth(token),
          body: "{}",
        })
      ).json()) as { id: string };
      const verified = (await (
        await fetch(`${url}/auth/v1/factors/${factor.id}/verify`, {
          method: "POST",
          headers: auth(token),
          body: JSON.stringify({ challenge_id: challenge.id, code: totpCode(secret) }),
        })
      ).json()) as { access_token: string };
      token = verified.access_token;
    }
    await fetch(`${url}/auth/v1/factors/${factor.id}`, { method: "DELETE", headers: auth(token) });
  }
}

test.describe("verificación en dos pasos del administrador", () => {
  test("puede elegir un código por email en vez de la app", async ({ page }) => {
    // Supabase limita a 5 códigos por hora y admin: este test pide uno por ejecución.
    const before = await countEmails(SEED_NEW_ADMIN.email, ADMIN_EMAIL_CODE_SUBJECT);
    await login(page, SEED_NEW_ADMIN.email, SEED_NEW_ADMIN.password);
    await expect(page).toHaveURL(/\/admin\/dos-pasos$/);
    await page.getByRole("link", { name: "Código por email" }).click();
    await expect(page.getByText(/menos seguro que la app de autenticación/)).toBeVisible();
    await page.getByRole("button", { name: "Enviarme un código" }).click();
    await expect(
      page.getByText(/Te hemos enviado un código a admin-nuevo@safebite.test/),
    ).toBeVisible();

    const code = await getAdminEmailCode(SEED_NEW_ADMIN.email, before);
    const wrong = code === "000000" ? "111111" : "000000";
    await codeForm(page).getByLabel("Código de 6 cifras").fill(wrong);
    await codeForm(page).getByRole("button", { name: "Verificar" }).click();
    await expect(codeForm(page).getByRole("alert")).toContainText("no es correcto");

    await codeForm(page).getByLabel("Código de 6 cifras").fill(code);
    await codeForm(page).getByRole("button", { name: "Verificar" }).click();
    await expect(page).toHaveURL(/\/admin\/restaurantes$/);
    await expect(page.getByRole("heading", { name: "Verificación de restaurantes" })).toBeVisible();
  });

  test("con solo la contraseña no se entra en la administración", async ({ page }) => {
    await login(page, SEED_ADMIN.email, SEED_ADMIN.password);
    await expect(page).toHaveURL(/\/admin\/dos-pasos$/);

    for (const path of ["/admin/restaurantes", "/admin/solicitudes", "/admin"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/admin\/dos-pasos$/);
    }

    await codeForm(page).getByLabel("Código de 6 cifras").fill("12345");
    await codeForm(page).getByRole("button", { name: "Verificar" }).click();
    await expect(codeForm(page).getByRole("alert")).toContainText("Escribe el código de 6 cifras");

    // Un código de hace 5 minutos ya no vale.
    const old = totpCode("JBSWY3DPEHPK3PXP", Date.now() - 5 * 60_000);
    await codeForm(page).getByLabel("Código de 6 cifras").fill(old);
    await codeForm(page).getByRole("button", { name: "Verificar" }).click();
    await expect(codeForm(page).getByRole("alert")).toContainText("no es correcto");
    await expect(page).toHaveURL(/\/admin\/dos-pasos$/);
  });

  test("un admin sin autenticador lo configura con el QR y entra", async ({ page }) => {
    let secret = "";
    try {
      await login(page, SEED_NEW_ADMIN.email, SEED_NEW_ADMIN.password);
      await expect(page).toHaveURL(/\/admin\/dos-pasos$/);
      await expect(page.getByText(/Elige cómo quieres verificar tu identidad/)).toBeVisible();
      await page.getByRole("link", { name: "App de autenticación" }).click();
      await page.getByRole("button", { name: "Configurar la verificación en dos pasos" }).click();

      await expect(page.getByRole("img", { name: /Código QR/ })).toBeVisible();
      secret = (await page.getByTestId("totp-secret").innerText()).trim();
      expect(secret).toMatch(/^[A-Z2-7]{16,}$/);

      await codeForm(page).getByLabel("Código de 6 cifras").fill(totpCode(secret));
      await codeForm(page).getByRole("button", { name: "Verificar" }).click();
      await expect(page).toHaveURL(/\/admin\/restaurantes$/);
      await expect(
        page.getByRole("heading", { name: "Verificación de restaurantes" }),
      ).toBeVisible();
    } finally {
      if (secret !== "") await removeNewAdminFactor(secret);
    }
  });
});
