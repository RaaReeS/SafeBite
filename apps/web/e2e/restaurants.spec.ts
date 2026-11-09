import { expect, test } from "@playwright/test";
import { createRestaurant, registerOwner, restaurantForm, uniqueName } from "./helpers";

test.describe("restaurantes", () => {
  test("crear un restaurante genera la dirección a partir del nombre y empieza como borrador", async ({
    page,
  }) => {
    await registerOwner(page);
    await page.goto("/panel/restaurantes/nuevo");
    const form = restaurantForm(page);
    await form.getByLabel("Nombre del establecimiento").fill("Café Ñandú Ünico");
    await expect(form.getByLabel("Dirección de la carta")).toHaveValue("cafe-nandu-unico");

    const name = uniqueName("Café Ñandú");
    await createRestaurant(page, name);
    await expect(page.getByText("Borrador", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "← Mis restaurantes" }).click();
    await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
  });

  test("no se puede usar una dirección que ya tiene otro restaurante", async ({ page }) => {
    await registerOwner(page);
    await createRestaurant(page);
    const slug = await restaurantForm(page).getByLabel("Dirección de la carta").inputValue();

    await page.goto("/panel/restaurantes/nuevo");
    const form = restaurantForm(page);
    await form.getByLabel("Nombre del establecimiento").fill("Otro nombre");
    await form.getByLabel("Dirección de la carta").fill(slug);
    await form.getByLabel("Ciudad").fill("Madrid");
    await form.getByRole("button", { name: "Crear restaurante" }).click();
    await expect(form.getByText("Esa dirección ya la usa otro establecimiento")).toBeVisible();
    await expect(form.getByLabel("Ciudad")).toHaveValue("Madrid");
  });

  test("el servidor valida los datos del restaurante", async ({ page }) => {
    await registerOwner(page);
    await page.goto("/panel/restaurantes/nuevo");
    const form = restaurantForm(page);
    await form.evaluate((element) => element.setAttribute("novalidate", ""));
    await form.getByLabel("Nombre del establecimiento").fill("Bar Pepe");
    await form.getByLabel("Dirección de la carta").fill("Dirección Con Espacios");
    await form.getByLabel(/^Teléfono/).fill("llámanos");
    await form.getByRole("button", { name: "Crear restaurante" }).click();
    await expect(form.getByText("Este campo es obligatorio.")).toBeVisible(); // ciudad
    await expect(form.getByText(/Usa entre 3 y 80 caracteres/)).toBeVisible();
    await expect(form.getByText("Introduce un teléfono válido")).toBeVisible();
  });

  test("editar los datos los guarda", async ({ page }) => {
    await registerOwner(page);
    await createRestaurant(page);
    const form = restaurantForm(page);
    await form.getByLabel("Ciudad").fill("Sevilla");
    await form.getByLabel(/^Teléfono/).fill("+34 954 000 000");
    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(form.getByRole("status")).toHaveText("Cambios guardados.");

    await page.reload();
    await expect(restaurantForm(page).getByLabel("Ciudad")).toHaveValue("Sevilla");
    await expect(restaurantForm(page).getByLabel(/^Teléfono/)).toHaveValue("+34 954 000 000");
  });

  test("publicar y despublicar la carta", async ({ page }) => {
    await registerOwner(page);
    await createRestaurant(page);
    await page.getByRole("button", { name: "Publicar carta" }).click();
    await expect(page.getByText("Publicado", { exact: true })).toBeVisible();
    await expect(page.getByText("Tu carta está publicada")).toBeVisible();

    await page.getByRole("button", { name: "Despublicar" }).click();
    await expect(page.getByText("Borrador", { exact: true })).toBeVisible();
  });

  test("cambiar la dirección de una carta publicada exige confirmar que los QR dejarán de funcionar", async ({
    page,
  }) => {
    await registerOwner(page);
    await createRestaurant(page);
    await page.getByRole("button", { name: "Publicar carta" }).click();
    await expect(page.getByText("Publicado", { exact: true })).toBeVisible();

    const form = restaurantForm(page);
    const slug = form.getByLabel("Dirección de la carta");
    await slug.fill(`${await slug.inputValue()}-nueva`);
    await expect(
      form.getByText("los códigos QR que ya hayas impreso dejarán de funcionar"),
    ).toBeVisible();

    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(form.getByText("Confirma que entiendes que los QR impresos")).toBeVisible();

    await form.getByLabel("Entiendo que los QR impresos dejarán de funcionar").check();
    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(form.getByRole("status")).toHaveText("Cambios guardados.");
  });

  test("eliminar un restaurante pide confirmación y lo borra", async ({ page }) => {
    await registerOwner(page);
    const { name } = await createRestaurant(page);

    await page.getByRole("button", { name: "Eliminar restaurante" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Eliminar este restaurante?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();

    await page.getByRole("button", { name: "Eliminar restaurante" }).click();
    await dialog.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page).toHaveURL(/\/panel$/);
    await expect(page.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);
  });
});

test.describe("aislamiento entre restaurantes", () => {
  // Las respuestas del panel se envían en streaming: un 404 muestra la página de
  // "no encontrado" (con noindex) aunque el código HTTP sea 200. Lo que importa
  // es que no aparezca ningún dato ajeno.
  test("un dueño no puede ver ni editar el restaurante de otro", async ({ browser }) => {
    const ownerA = await browser.newPage();
    await registerOwner(ownerA);
    const { name, url } = await createRestaurant(ownerA);

    const ownerB = await browser.newPage();
    await registerOwner(ownerB);
    await expect(ownerB.getByRole("link", { name: new RegExp(name) })).toHaveCount(0);

    await ownerB.goto(url);
    await expect(ownerB.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
    await expect(ownerB.getByText(name)).toHaveCount(0);
    await expect(restaurantForm(ownerB)).toHaveCount(0);

    await ownerA.close();
    await ownerB.close();
  });

  test("un id con formato inválido muestra «no encontrado»", async ({ page }) => {
    await registerOwner(page);
    await page.goto("/panel/restaurantes/no-es-un-uuid");
    await expect(page.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
  });
});

test.describe("ubicación del restaurante", () => {
  // Con GEOCODER=fake: Madrid, Sevilla y Barcelona se ubican; "no existe" no.
  async function saveAddress(
    page: import("@playwright/test").Page,
    address: string,
    city = "Madrid",
  ) {
    const form = restaurantForm(page);
    await form.getByLabel(/^Dirección \(opcional\)/).fill(address);
    await form.getByLabel("Ciudad").fill(city);
    await form.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(form.getByRole("status")).toHaveText("Cambios guardados.");
  }

  test("sin dirección, pide añadirla para aparecer en «Cerca de mí»", async ({ page }) => {
    await registerOwner(page);
    await createRestaurant(page);
    await expect(page.getByText("Añade la dirección del establecimiento")).toBeVisible();
  });

  test("con dirección, se ubica en el mapa y se puede comprobar", async ({ page }) => {
    await registerOwner(page);
    await createRestaurant(page);
    await saveAddress(page, "Calle Mayor 1");
    await expect(page.getByText("Hemos ubicado tu dirección en el mapa")).toBeVisible();
    const link = page.getByRole("link", { name: "Comprobar en el mapa" });
    // Valor exacto del geocodificador simulado: confirma que no se ha llamado a Nominatim.
    await expect(link).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/?mlat=40.41864&mlon=-3.70196#map=18/40.41864/-3.70196",
    );
    await expect(page.getByText("© OpenStreetMap")).toBeVisible();
  });

  test("si la dirección no se encuentra, lo avisa y el restaurante se guarda igualmente", async ({
    page,
  }) => {
    await registerOwner(page);
    await createRestaurant(page);
    await saveAddress(page, "Calle que no existe 0");
    await expect(page.getByText("No hemos podido ubicar esta dirección")).toBeVisible();
  });

  test("al cambiar de ciudad, la ubicación se actualiza", async ({ page }) => {
    await registerOwner(page);
    await createRestaurant(page);
    await saveAddress(page, "Calle Mayor 1", "Madrid");
    const link = page.getByRole("link", { name: "Comprobar en el mapa" });
    await expect(link).toHaveAttribute("href", /mlat=40\./);
    await saveAddress(page, "Calle Mayor 1", "Sevilla");
    await expect(link).toHaveAttribute("href", /mlat=37\./);
  });
});
