import { expect, type Page } from "@playwright/test";

// Buzón de pruebas de Supabase local: los emails de Auth no salen a internet.
const MAILPIT_URL = "http://127.0.0.1:54324";

/**
 * Mensaje de error de un formulario. Excluye el anunciador de rutas de Next,
 * que también tiene role="alert".
 */
export function formAlert(page: Page) {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}

export const SEED_DINER = { email: "comensal@safebite.test", password: "password123" };

export const DEFAULT_PASSWORD = "contraseña-de-prueba";

/** Email único por test, para que los tests no interfieran entre sí. */
export function uniqueEmail(prefix = "dueno"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@safebite.test`;
}

type MailpitSummary = { ID: string; Subject: string };

/** Espera el último email recibido por `to` con ese asunto y devuelve el enlace a /auth/confirmar. */
export async function getAuthLinkFromEmail(to: string, subject: string): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const search = await fetch(
          `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
        );
        const { messages } = (await search.json()) as { messages: MailpitSummary[] };
        const message = messages.find((m) => m.Subject === subject);
        if (message === undefined) return undefined;
        const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`);
        const { HTML } = (await detail.json()) as { HTML: string };
        link = /href="([^"]*\/auth\/confirmar[^"]*)"/.exec(HTML)?.[1]?.replaceAll("&amp;", "&");
        return link;
      },
      { message: `No ha llegado el email «${subject}» a ${to}`, timeout: 15_000 },
    )
    .toBeDefined();
  return link as string;
}

/** Registra un dueño de restaurante y confirma su email. Deja la sesión abierta en /panel. */
export async function registerOwner(page: Page, email = uniqueEmail()): Promise<string> {
  await page.goto("/registro");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
  await page.getByLabel(/He leído y acepto/).check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("status")).toContainText("Te hemos enviado un email");

  await page.goto(await getAuthLinkFromEmail(email, "Confirma tu cuenta de SafeBite"));
  await expect(page).toHaveURL(/\/panel$/);
  return email;
}

export async function login(page: Page, email: string, password: string, path = "/login") {
  await page.goto(path);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

// Next 16 (Cache Components) conserva ocultas en el DOM las páginas visitadas.
// Por eso los campos se buscan dentro del formulario visible (getByRole ignora
// los elementos ocultos).
export function restaurantForm(page: Page) {
  return page.getByRole("form", { name: "Datos del establecimiento" });
}

export function uniqueName(prefix = "Casa Prueba"): string {
  return `${prefix} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Crea un restaurante y deja la página en su ficha. */
export async function createRestaurant(page: Page, name = uniqueName()) {
  await page.goto("/panel/restaurantes/nuevo");
  const form = restaurantForm(page);
  await form.getByLabel("Nombre del establecimiento").fill(name);
  await form.getByLabel("Ciudad").fill("Madrid");
  await form.getByRole("button", { name: "Crear restaurante" }).click();
  await expect(page).toHaveURL(/\/panel\/restaurantes\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  return { name, url: page.url() };
}
