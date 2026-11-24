import { expect, test } from "@playwright/test";
import {
  DEFAULT_PASSWORD,
  countEmails,
  formAlert,
  SEED_DINER,
  getAuthLinkFromEmail,
  login,
  registerOwner,
  signUpDinerViaApi,
  uniqueEmail,
} from "./helpers";

test.describe("registro", () => {
  test("un restaurante se registra, confirma su email y entra al panel", async ({ page }) => {
    const email = await registerOwner(page);
    await expect(page.getByRole("heading", { name: "Mis restaurantes" })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
  });

  test("con un email que ya tiene cuenta avisa de que está registrada", async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel("Soy un restaurante").check();
    await page.getByLabel("Email").fill(SEED_DINER.email);
    await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
    await page.getByLabel(/He leído y acepto/).check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(formAlert(page)).toContainText("Esta cuenta ya está registrada");
    await expect(page.getByLabel("Email")).toHaveValue(SEED_DINER.email);
  });

  test("sin confirmar el email no se puede entrar", async ({ page }) => {
    const email = uniqueEmail();
    await page.goto("/registro");
    await page.getByLabel("Soy un restaurante").check();
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
    await page.getByLabel("Soy un restaurante").check();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
    await page.getByLabel(/He leído y acepto/).check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("status")).toContainText("Te hemos enviado un email");
    await expect.poll(() => countEmails(email, subject)).toBe(1);

    await login(page, email, DEFAULT_PASSWORD);
    // Supabase limita los reenvíos (max_frequency = 1s en local, 60 s por defecto
    // en producción); antes de ese plazo la web muestra «Demasiados intentos».
    await page.waitForTimeout(1_500);
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
    await page.getByLabel("Soy un restaurante").check();
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
    // Quita la validación del navegador para comprobar la del servidor.
    await page.locator("form").evaluate((form) => form.setAttribute("novalidate", ""));
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("Debes aceptar los términos de uso")).toBeVisible();
  });

  test("el servidor rechaza contraseñas de menos de 8 caracteres", async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel("Soy un restaurante").check();
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

  test("una cuenta de comensal entra en su área y no en el panel", async ({ page }) => {
    // Va directa a su área: el inicio de sesión ya la manda a /comensal, sin
    // pasar por el panel de restaurantes para que este la devuelva.
    const loginResponse = page.waitForResponse(
      (response) => response.request().method() === "POST" && response.url().endsWith("/login"),
    );
    await login(page, SEED_DINER.email, SEED_DINER.password);
    expect((await loginResponse).headers()["x-action-redirect"]).toMatch(/^\/comensal(;|$)/);
    await expect(page).toHaveURL(/\/comensal$/);
    await expect(
      page.getByRole("heading", { name: `Hola, ${SEED_DINER.email.split("@")[0]}` }),
    ).toBeVisible();
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/comensal$/);
  });

  test("al entrar desde un enlace de su área, el comensal vuelve a esa página", async ({
    page,
  }) => {
    await page.goto("/comensal/alergias");
    await expect(page).toHaveURL(/\/login\?next=%2Fcomensal%2Falergias$/);
    await page.getByLabel("Email").fill(SEED_DINER.email);
    await page.getByLabel("Contraseña").fill(SEED_DINER.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/comensal\/alergias$/);
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

test.describe("comensales", () => {
  test("un comensal se registra en la web, confirma su email y entra en su área", async ({
    page,
  }) => {
    const email = uniqueEmail("comensal");
    await page.goto("/registro");
    await page.getByLabel("Soy comensal").check();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
    // Al elegir comensal no se habla de la responsabilidad sobre los alérgenos.
    await expect(page.getByText(/soy responsable de la información de alérgenos/)).toHaveCount(0);
    await page.getByLabel(/He leído y acepto/).check();
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByRole("status")).toContainText("Te hemos enviado un email");

    await page.goto(await getAuthLinkFromEmail(email, "Confirma tu cuenta de SafeBite"));
    await expect(page).toHaveURL(/\/comensal\?aviso=cuenta$/);
    await expect(page.getByRole("status")).toContainText("Tu cuenta está confirmada");
    await page.goto("/panel");
    await expect(page).toHaveURL(/\/comensal$/);
  });

  test("el servidor exige elegir el tipo de cuenta", async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel("Email").fill(uniqueEmail());
    await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
    await page.getByLabel(/He leído y acepto/).check();
    await page.locator("form").evaluate((form) => form.setAttribute("novalidate", ""));
    await page.getByRole("button", { name: "Crear cuenta" }).click();
    await expect(page.getByText("Elige si eres comensal o restaurante.")).toBeVisible();
  });

  test("al responsable de un restaurante se le recuerda su responsabilidad", async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel("Soy un restaurante").check();
    await expect(page.getByText(/soy responsable de la información de alérgenos/)).toBeVisible();
  });

  test("si un comensal de la app abre el enlace del email, entra en su área de la web", async ({
    page,
  }) => {
    const email = uniqueEmail("comensal");
    await signUpDinerViaApi(email);
    await page.goto(await getAuthLinkFromEmail(email, "Confirma tu cuenta de SafeBite"));
    await expect(page).toHaveURL(/\/comensal\?aviso=cuenta$/);
    await expect(page.getByRole("status")).toContainText("Tu cuenta está confirmada");
  });

  test("si cambian la contraseña con el enlace, terminan en su área", async ({ page }) => {
    const email = uniqueEmail("comensal");
    await signUpDinerViaApi(email);
    await page.goto(await getAuthLinkFromEmail(email, "Confirma tu cuenta de SafeBite"));
    await page.goto("/recuperar");
    await page.getByLabel("Email").fill(email);
    await page.getByRole("button", { name: "Enviar enlace" }).click();
    await expect(page.getByRole("status")).toContainText("Si existe una cuenta");
    await page.goto(await getAuthLinkFromEmail(email, "Restablece tu contraseña de SafeBite"));
    await expect(page).toHaveURL(/\/nueva-contrasena$/);
    await page.getByLabel("Contraseña nueva").fill("otra-contraseña-nueva");
    await page.getByLabel("Repite la contraseña").fill("otra-contraseña-nueva");
    await page.getByRole("button", { name: "Guardar contraseña" }).click();
    await expect(page).toHaveURL(/\/comensal\?aviso=contrasena$/);
    await expect(page.getByRole("status")).toContainText("Tu contraseña se ha cambiado");
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
