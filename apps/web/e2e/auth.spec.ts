import { expect, test } from "@playwright/test";
import {
  DEFAULT_PASSWORD,
  countEmails,
  formAlert,
  SEED_DINER,
  getAuthLinkFromEmail,
  login,
  registerOwner,
  uniqueEmail,
} from "./helpers";

test.describe("registro", () => {
  test("un restaurante se registra, confirma su email y entra al panel", async ({ page }) => {
    const email = await registerOwner(page);
    await expect(page.getByRole("heading", { name: "Mis restaurantes" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test("sin confirmar el email no se puede entrar", async ({ page }) => {
    const email = uniqueEmail();
    await page.goto("/registro");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
    await page.getByLabel(/He leído y acepto/).check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("status")).toContainText("Te hemos enviado un email");

    await login(page, email, DEFAULT_PASSWORD);
    await expect(formAlert(page)).toContainText("Aún no has confirmado tu email");
  });

  test("quien no ha confirmado puede pedir que se reenvíe el email y entrar con él", async ({
    page,
  }) => {
    const email = uniqueEmail();
    const subject = "Confirma tu cuenta de SafeBite";
    await page.goto("/registro");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
    await page.getByLabel(/He leído y acepto/).check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("status")).toContainText("Te hemos enviado un email");
    await expect.poll(() => countEmails(email, subject)).toBe(1);

    await login(page, email, DEFAULT_PASSWORD);
    await page.getByRole("button", { name: "Reenviar el email de confirmación" }).click();
    await expect(page.getByRole("status")).toContainText("te hemos enviado un email nuevo");
    await expect.poll(() => countEmails(email, subject)).toBe(2);

    await page.goto(await getAuthLinkFromEmail(email, subject));
    await expect(page).toHaveURL(/\/panel$/);
  });

  test("con una contraseña incorrecta no se ofrece reenviar la confirmación", async ({ page }) => {
    await login(page, SEED_DINER.email, "no-es-la-contraseña");
    await expect(formAlert(page)).toHaveText("Email o contraseña incorrectos.");
    await expect(
      page.getByRole("button", { name: "Reenviar el email de confirmación" }),
    ).toHaveCount(0);
  });

  test("el servidor exige aceptar los términos aunque se salte la validación del navegador", async ({
    page,
  }) => {
    await page.goto("/registro");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
    // Quita la validación del navegador para comprobar la del servidor.
    await page.locator("form").evaluate((form) => form.setAttribute("novalidate", ""));
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("Debes aceptar los términos de uso")).toBeVisible();
  });

  test("el servidor rechaza contraseñas de menos de 8 caracteres", async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Contraseña").fill("corta");
    await page.getByLabel(/He leído y acepto/).check();
    await page.locator("form").evaluate((form) => form.setAttribute("novalidate", ""));
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("al menos 8 caracteres").last()).toBeVisible();
  });
});

test.describe("inicio de sesión", () => {
  test("una contraseña incorrecta muestra un error genérico y conserva el email", async ({
    page,
  }) => {
    await login(page, SEED_DINER.email, "no-es-la-contraseña");
    await expect(formAlert(page)).toHaveText("Email o contraseña incorrectos.");
    await expect(page.getByLabel("Email")).toHaveValue(SEED_DINER.email);
  });

  test("sin sesión, /panel lleva al login y después vuelve a la página pedida", async ({
    page,
    browser,
  }) => {
    const email = await registerOwner(page);
    const fresh = await browser.newPage();
    await fresh.goto("/panel");
    await expect(fresh).toHaveURL(/\/login\?next=%2Fpanel$/);
    await login(fresh, email, DEFAULT_PASSWORD, fresh.url());
    await expect(fresh).toHaveURL(/\/panel$/);
    await fresh.close();
  });

  test("?next= nunca redirige fuera del sitio", async ({ page }) => {
    const email = await registerOwner(page);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await login(page, email, DEFAULT_PASSWORD, "/login?next=https://evil.example/robar");
    await expect(page).toHaveURL(/localhost:3000\/panel$/);
  });

  test("el servidor rechaza un destino externo aunque se manipule el formulario", async ({
    page,
  }) => {
    const email = await registerOwner(page);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
    // Simula un envío directo a la Server Action con un destino externo.
    await page
      .locator('input[name="next"]')
      .evaluate((input) => input.setAttribute("value", "https://evil.example/robar"));
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/localhost:3000\/panel$/);
  });

  test("una cuenta de comensal no puede entrar al panel", async ({ page }) => {
    await login(page, SEED_DINER.email, SEED_DINER.password);
    await expect(page).toHaveURL(/\/sin-acceso$/);
    await expect(
      page.getByRole("heading", { name: "Esta cuenta no es de restaurante" }),
    ).toBeVisible();
  });

  test("cerrar sesión impide volver al panel", async ({ page }) => {
    await registerOwner(page);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("un enlace de confirmación inválido muestra un aviso", async ({ page }) => {
    await page.goto("/auth/confirmar?token_hash=falso&type=email&next=/panel");
    await expect(page).toHaveURL(/\/login\?error=enlace$/);
    await expect(formAlert(page)).toContainText("El enlace no es válido o ha caducado");
  });
});

test.describe("recuperación de contraseña", () => {
  test("se puede elegir una contraseña nueva desde el email y entrar con ella", async ({
    page,
  }) => {
    const email = await registerOwner(page);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();

    await page.goto("/recuperar");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(page.getByRole("status")).toContainText("Si existe una cuenta con ese email");

    await page.goto(await getAuthLinkFromEmail(email, "Restablece tu contraseña de SafeBite"));
    await expect(page).toHaveURL(/\/nueva-contrasena$/);
    await page.getByLabel("Contraseña nueva").fill("otra-contraseña-nueva");
    await page.getByLabel("Repite la contraseña").fill("otra-contraseña-nueva");
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page).toHaveURL(/\/panel$/);

    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await login(page, email, "otra-contraseña-nueva");
    await expect(page).toHaveURL(/\/panel$/);
  });

  test("pedir recuperación de un email inexistente responde igual (no revela cuentas)", async ({
    page,
  }) => {
    await page.goto("/recuperar");
    await page.getByLabel("Email").fill(uniqueEmail("nadie"));
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(page.getByRole("status")).toContainText("Si existe una cuenta con ese email");
  });
});
