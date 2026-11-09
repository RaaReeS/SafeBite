import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { createRestaurant, registerOwner, restaurantForm, uniqueName } from "./helpers";

// Recorrido completo de un restaurante, comprobando al final lo que vería un
// visitante anónimo a través de la API pública (las vistas public_*), que es lo
// que usará la carta por QR.

/** Variables de apps/web/.env.local (Playwright se ejecuta desde apps/web). */
function readLocalEnv(): Record<string, string> {
  const content = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .filter((line) => line.includes("=") && !line.startsWith("#"))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
}

/** Consulta la API REST de Supabase como visitante anónimo (sin sesión). */
async function anonymousSelect<T>(path: string): Promise<T> {
  const env = readLocalEnv();
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: key },
  });
  expect(response.status, path).toBe(200);
  return (await response.json()) as T;
}

async function addDish(page: Page, restaurantUrl: string, name: string, price: string) {
  await page.goto(`${restaurantUrl}/platos/nuevo`);
  const form = page.getByRole("form", { name: "Datos del plato" });
  await form.getByLabel("Nombre del plato").fill(name);
  await form.getByLabel(/^Precio/).fill(price);
  await form.getByRole("button", { name: "Crear plato" }).click();
  await expect(page).toHaveURL(/\/platos\/[0-9a-f-]{36}$/);
}

test("recorrido completo: registro, carta, alérgenos, publicación y QR", async ({ page }) => {
  test.slow();

  // 1. Registro y restaurante.
  await registerOwner(page);
  const name = uniqueName("Recorrido");
  const { url: restaurantUrl } = await createRestaurant(page, name);
  const slug = await restaurantForm(page).getByLabel("Dirección de la carta").inputValue();

  // 2. Dos platos: uno con todos los alérgenos declarados y otro sin declarar.
  await addDish(page, restaurantUrl, "Pan con tomate", "4,50");
  const editor = page.getByRole("form", { name: "Alérgenos" });
  await editor
    .getByRole("group", { name: "Cereales con gluten", exact: true })
    .getByText("Contiene", { exact: true })
    .click();
  await editor.getByRole("button", { name: "Marcar los no declarados como «No contiene»" }).click();
  await page
    .getByRole("dialog", { name: "¿Marcar como «No contiene»?" })
    .getByRole("button", { name: "Sí, no contiene ninguno" })
    .click();
  await editor.getByRole("button", { name: "Guardar alérgenos" }).click();
  await expect(editor.getByRole("status").first()).toHaveText("Alérgenos guardados.");

  await addDish(page, restaurantUrl, "Croquetas", "8");

  await page.goto(`${restaurantUrl}/platos`);
  await expect(page.getByText("1 plato tiene alérgenos sin declarar.")).toBeVisible();

  // 3. Antes de publicar, la carta no es visible para nadie.
  const encodedSlug = encodeURIComponent(slug);
  expect(await anonymousSelect<unknown[]>(`public_restaurants?slug=eq.${encodedSlug}`)).toEqual([]);

  // 4. Publicar.
  await page.goto(restaurantUrl);
  await page.getByRole("button", { name: "Publicar carta" }).click();
  await expect(page.getByText("Publicado", { exact: true })).toBeVisible();

  // 5. El QR apunta a la carta pública.
  const qr = await page.request.get(`${restaurantUrl}/qr/png`);
  const png = PNG.sync.read(await qr.body());
  expect(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data).toBe(
    `http://localhost:3000/r/${slug}`,
  );

  // 6. Lo que ve un visitante anónimo.
  const [restaurant] = await anonymousSelect<{ id: string; name: string }[]>(
    `public_restaurants?slug=eq.${encodedSlug}&select=id,name`,
  );
  expect(restaurant?.name).toBe(name);
  expect(restaurant).not.toHaveProperty("owner_id");

  const dishes = await anonymousSelect<{ id: string; name: string; price_cents: number }[]>(
    `public_dishes?restaurant_id=eq.${restaurant?.id}&select=id,name,price_cents&order=sort_order`,
  );
  expect(dishes.map((d) => [d.name, d.price_cents])).toEqual([
    ["Pan con tomate", 450],
    ["Croquetas", 800],
  ]);

  const allergens = await anonymousSelect<{ dish_id: string; allergen: string; level: string }[]>(
    `public_dish_allergens?dish_id=in.(${dishes.map((d) => d.id).join(",")})`,
  );
  const bread = allergens.filter((a) => a.dish_id === dishes[0]?.id);
  expect(bread).toHaveLength(14);
  expect(bread.find((a) => a.allergen === "gluten")?.level).toBe("contains");
  // Las croquetas no tienen declaraciones: el filtro las tratará como "sin datos".
  expect(allergens.filter((a) => a.dish_id === dishes[1]?.id)).toEqual([]);

  // 7. Al despublicar, la carta deja de ser visible.
  await page.goto(restaurantUrl);
  await page.getByRole("button", { name: "Despublicar" }).click();
  await expect(page.getByText("Borrador", { exact: true })).toBeVisible();
  expect(await anonymousSelect<unknown[]>(`public_restaurants?slug=eq.${encodedSlug}`)).toEqual([]);
  expect(
    await anonymousSelect<unknown[]>(`public_dishes?restaurant_id=eq.${restaurant?.id}`),
  ).toEqual([]);
});
