import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

export const ADMIN_EMAIL_CODE_SUBJECT = "Tu código de acceso a la administración de SafeBite";

/** Espera un email de código de administrador posterior a `afterCount` y devuelve el código. */
export async function getAdminEmailCode(to: string, afterCount: number): Promise<string> {
  let code: string | undefined;
  await expect
    .poll(
      async () => {
        const search = await fetch(
          `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
        );
        const { messages } = (await search.json()) as { messages: MailpitSummary[] };
        const codes = messages.filter((m) => m.Subject === ADMIN_EMAIL_CODE_SUBJECT);
        if (codes.length <= afterCount) return undefined;
        // Mailpit devuelve primero el más reciente.
        const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${codes[0]?.ID}`);
        const { Text } = (await detail.json()) as { Text: string };
        code = /\b(\d{6})\b/.exec(Text)?.[1];
        return code;
      },
      { message: `No ha llegado el código de administrador a ${to}`, timeout: 15_000 },
    )
    .toBeDefined();
  return code as string;
}

/** Número de emails recibidos por `to` con ese asunto. */
export async function countEmails(to: string, subject: string): Promise<number> {
  const search = await fetch(
    `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
  );
  const { messages } = (await search.json()) as { messages: MailpitSummary[] };
  return messages.filter((m) => m.Subject === subject).length;
}

/** Registra un dueño de restaurante y confirma su email. Deja la sesión abierta en /panel. */
export async function registerOwner(page: Page, email = uniqueEmail()): Promise<string> {
  await page.goto("/registro");
  await page.getByLabel("Soy un restaurante").check();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
  await page.getByLabel(/He leído y acepto/).check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("status")).toContainText("Te hemos enviado un email");

  await page.goto(await getAuthLinkFromEmail(email, "Confirma tu cuenta de SafeBite"));
  await expect(page).toHaveURL(/\/panel$/);
  return email;
}

/** Registra un comensal en la web y confirma su email. Deja la sesión abierta en /comensal. */
export async function registerDiner(page: Page, email = uniqueEmail("comensal")): Promise<string> {
  await page.goto("/registro");
  await page.getByLabel("Soy comensal").check();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(DEFAULT_PASSWORD);
  await page.getByLabel(/He leído y acepto/).check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("status")).toContainText("Te hemos enviado un email");

  await page.goto(await getAuthLinkFromEmail(email, "Confirma tu cuenta de SafeBite"));
  await expect(page).toHaveURL(/\/comensal\?aviso=cuenta$/);
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

/** Variables de apps/web/.env.local (Playwright se ejecuta desde apps/web). */
export function localEnv(): Record<string, string> {
  const content = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .filter((line) => line.includes("=") && !line.startsWith("#"))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
}

/** Registra un comensal como lo haría la app (API de Supabase, sin rol de restaurante). */
export async function signUpDinerViaApi(email: string, password = DEFAULT_PASSWORD) {
  const env = localEnv();
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, data: { accepted_terms: true } }),
  });
  expect(response.status).toBe(200);
}

export const SEED_OWNER = { email: "restaurante@safebite.test", password: "password123" };
export const SEED_ADMIN = { email: "admin@safebite.test", password: "password123" };
/** Clave TOTP del autenticador del admin del seed (solo local). */
export const SEED_ADMIN_TOTP_SECRET = "JBSWY3DPEHPK3PXP";
/** Admin del seed sin verificación en dos pasos configurada. */
export const SEED_NEW_ADMIN = { email: "admin-nuevo@safebite.test", password: "password123" };

function base32Decode(value: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of value.replace(/=+$/, "").toUpperCase()) {
    bits += alphabet.indexOf(char).toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** Código TOTP actual (RFC 6238: SHA-1, 6 cifras, 30 s), como el de una app de autenticación. */
export function totpCode(secret: string, now = Date.now()): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30_000)));
  const hmac = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = (hmac[hmac.length - 1] ?? 0) & 15;
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

/** Entra como el admin del seed y completa la verificación en dos pasos. */
export async function loginAsAdmin(page: Page) {
  await login(page, SEED_ADMIN.email, SEED_ADMIN.password);
  await expect(page).toHaveURL(/\/admin\/dos-pasos$/);
  const form = page.getByRole("form", { name: "Código de verificación" });
  await form.getByLabel("Código de 6 cifras").fill(totpCode(SEED_ADMIN_TOTP_SECRET));
  await form.getByRole("button", { name: "Verificar" }).click();
  await expect(page).toHaveURL(/\/admin\/restaurantes$/);
}

/** Crea una solicitud «Pide este restaurante» como el comensal del seed, igual que la app. */
export async function requestRestaurantAsSeedDiner(restaurantName: string, city: string) {
  const env = localEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const apikey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const login = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: SEED_DINER.email, password: SEED_DINER.password }),
  });
  expect(login.status).toBe(200);
  const { access_token } = (await login.json()) as { access_token: string };

  const insert = await fetch(`${url}/rest/v1/restaurant_requests`, {
    method: "POST",
    headers: {
      apikey,
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ restaurant_name: restaurantName, city }),
  });
  expect(insert.status).toBe(201);
}

/** Sesión de la API de Supabase con una cuenta del seed (como lo haría un cliente). */
async function apiToken(email: string, password: string): Promise<string> {
  const env = localEnv();
  const response = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    },
  );
  expect(response.status).toBe(200);
  return ((await response.json()) as { access_token: string }).access_token;
}

/**
 * Sesión del admin del seed con la verificación en dos pasos hecha (aal2).
 * La obtiene global-setup.ts una sola vez: Supabase no admite dos
 * verificaciones simultáneas del mismo autenticador.
 */
export async function createAdminApiToken(): Promise<string> {
  const env = localEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const headers = (token: string) => ({
    apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });
  const token = await apiToken(SEED_ADMIN.email, SEED_ADMIN.password);
  const user = (await (await fetch(`${url}/auth/v1/user`, { headers: headers(token) })).json()) as {
    factors?: { id: string; factor_type: string; status: string }[];
  };
  const factor = user.factors?.find((f) => f.factor_type === "totp" && f.status === "verified");
  expect(factor, "autenticador del admin del seed").toBeDefined();
  const challenge = (await (
    await fetch(`${url}/auth/v1/factors/${factor?.id}/challenge`, {
      method: "POST",
      headers: headers(token),
      body: "{}",
    })
  ).json()) as { id: string };
  const verified = await fetch(`${url}/auth/v1/factors/${factor?.id}/verify`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ challenge_id: challenge.id, code: totpCode(SEED_ADMIN_TOTP_SECRET) }),
  });
  expect(verified.status).toBe(200);
  return ((await verified.json()) as { access_token: string }).access_token;
}

/**
 * Cambia la verificación de un restaurante como administrador (lo que hace
 * /admin/restaurantes), a partir de la URL de su ficha en el panel.
 */
export async function setVerificationAsAdmin(
  restaurantPanelUrl: string,
  status: "verified" | "rejected" | "pending",
  note?: string,
) {
  const id = /\/panel\/restaurantes\/([0-9a-f-]{36})/.exec(restaurantPanelUrl)?.[1];
  expect(id, "URL de la ficha del restaurante").toBeDefined();
  const env = localEnv();
  const token = process.env.E2E_ADMIN_TOKEN ?? (await createAdminApiToken());
  const response = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/admin_set_restaurant_verification`,
    {
      method: "POST",
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target_restaurant_id: id, new_status: status, note }),
    },
  );
  expect(response.status).toBe(204);
}

export async function verifyRestaurantAsAdmin(restaurantPanelUrl: string) {
  await setVerificationAsAdmin(restaurantPanelUrl, "verified");
}
