import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import {
  createRestaurant,
  registerOwner,
  restaurantForm,
  verifyRestaurantAsAdmin,
} from "./helpers";

// El lector de cartas es el simulado (MENU_READER=fake): en cada página lee
// «Gambas al ajillo» (12,50 €, propone crustáceos) y «Ensalada verde» (8 €).
// Una página de 3×3 píxeles simula que el servicio no responde, y una de 4×4,
// un error inesperado del servidor.

const FIXTURES = "e2e/fixtures";

function reviewForm(page: Page) {
  return page.getByRole("form", { name: "Platos leídos de la carta" });
}

function dishGroup(page: Page, name: string) {
  return reviewForm(page).getByRole("group", { name: new RegExp(`Plato \\d+: ${name}`) });
}

async function readMenu(page: Page, restaurantUrl: string, file = "carta.png") {
  await page.goto(`${restaurantUrl}/platos/importar`);
  await page.getByLabel("Fotos o PDF de la carta").setInputFiles(`${FIXTURES}/${file}`);
  await page.getByRole("button", { name: "Leer la carta" }).click();
}

test.describe("importar la carta", () => {
  test("lee la carta, se revisa y crea los platos con los alérgenos solo propuestos", async ({
    page,
  }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    const slug = await restaurantForm(page).getByLabel("Dirección de la carta").inputValue();

    await readMenu(page, url);
    await expect(reviewForm(page)).toBeVisible();
    await expect(dishGroup(page, "Gambas al ajillo").getByLabel("Precio (€)")).toHaveValue("12,50");
    await expect(
      dishGroup(page, "Gambas al ajillo").getByRole("list", {
        name: "Alérgenos propuestos (sin confirmar)",
      }),
    ).toContainText("Crustáceos");

    // Se corrige el precio y se descarta la ensalada.
    await dishGroup(page, "Gambas al ajillo").getByLabel("Precio (€)").fill("13");
    await dishGroup(page, "Ensalada verde").getByLabel("Añadir «Ensalada verde»").uncheck();
    await reviewForm(page).getByRole("button", { name: "Añadir 1 plato" }).click();

    await expect(page).toHaveURL(/\/platos\?importados=1$/);
    await expect(page.getByText("Se ha añadido 1 plato.")).toBeVisible();
    const row = page.getByRole("listitem").filter({ hasText: "Gambas al ajillo" });
    await expect(row).toContainText("Alérgenos por revisar");
    await expect(row).toContainText("13,00");
    await expect(page.getByRole("listitem").filter({ hasText: "Ensalada verde" })).toHaveCount(0);

    // En la carta pública, sin confirmar: «sin datos», nunca «apto».
    await page.goto(url);
    await page.getByRole("button", { name: "Publicar carta" }).click();
    await expect(page.getByText("Publicado", { exact: true })).toBeVisible();
    await verifyRestaurantAsAdmin(url);
    await page.goto(`/r/${slug}`);
    await page.getByRole("button", { name: "Crustáceos", exact: true }).click();
    const publicDish = page.getByRole("listitem").filter({ hasText: "Gambas al ajillo" });
    await expect(publicDish).toContainText("Sin datos suficientes");
  });

  test("en el editor las propuestas salen marcadas y, al guardarlas, cuentan", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await readMenu(page, url);
    await dishGroup(page, "Ensalada verde").getByLabel("Añadir «Ensalada verde»").uncheck();
    await reviewForm(page).getByRole("button", { name: "Añadir 1 plato" }).click();
    await page.getByRole("link", { name: /Gambas al ajillo/ }).click();

    const editor = page.getByRole("form", { name: "Alérgenos" });
    await expect(page.getByText(/se han leído automáticamente de tu carta/)).toBeVisible();
    const crustaceans = editor.getByRole("group", { name: /Crustáceos/ });
    await expect(crustaceans).toContainText("Propuesto");
    await expect(crustaceans.getByRole("radio", { name: "Contiene", exact: true })).toBeChecked();

    await editor.getByRole("button", { name: "Guardar alérgenos" }).click();
    await expect(editor.getByRole("status").first()).toHaveText("Alérgenos guardados.");
    await page.reload();
    await expect(page.getByText(/se han leído automáticamente de tu carta/)).toHaveCount(0);
    await expect(
      editor.getByRole("group", { name: "Crustáceos", exact: true }).getByRole("radio", {
        name: "Contiene",
        exact: true,
      }),
    ).toBeChecked();

    await page.goto(`${url}/platos`);
    await expect(page.getByText("Alérgenos por revisar")).toHaveCount(0);
  });

  test("se pueden arrastrar las fotos a la zona de la carta", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await page.goto(`${url}/platos/importar`);
    const png = readFileSync(`${FIXTURES}/carta.png`).toString("base64");
    const dataTransfer = await page.evaluateHandle((base64) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const transfer = new DataTransfer();
      transfer.items.add(new File([bytes], "carta-del-bar.png", { type: "image/png" }));
      return transfer;
    }, png);
    const zone = page.getByTestId("menu-dropzone");
    // Arrastrar solo funciona con la página ya activa (tras hidratar).
    await expect(async () => {
      await page.getByRole("tab", { name: "Enlace" }).click();
      await expect(page.getByRole("tab", { name: "Enlace" })).toHaveAttribute(
        "aria-selected",
        "true",
        { timeout: 500 },
      );
    }).toPass();
    await page.getByRole("tab", { name: "Fotos o PDF" }).click();
    await zone.dispatchEvent("dragenter", { dataTransfer });
    await expect(zone).toHaveAttribute("data-dragging", "true");
    await zone.dispatchEvent("drop", { dataTransfer });
    await expect(zone).toHaveAttribute("data-dragging", "false");
    await expect(page.getByRole("list", { name: "Archivos elegidos" })).toContainText(
      "carta-del-bar.png",
    );
    await page.getByRole("button", { name: "Leer la carta" }).click();
    await expect(reviewForm(page)).toBeVisible();
  });

  test("se puede quitar un archivo elegido sin querer", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await page.goto(`${url}/platos/importar`);
    const chosen = page.getByRole("list", { name: "Archivos elegidos" });
    // Primero la carta y, después, una foto equivocada (se suman).
    await page.getByLabel("Fotos o PDF de la carta").setInputFiles(`${FIXTURES}/fallo.png`);
    await expect(chosen).toContainText("fallo.png");
    await page.getByLabel("Fotos o PDF de la carta").setInputFiles(`${FIXTURES}/carta.png`);
    await expect(chosen.getByRole("listitem")).toHaveCount(2);

    // Se quita la carta: solo queda la foto que falla, así que la lectura falla.
    await page.getByRole("button", { name: "Quitar carta.png" }).click();
    await expect(chosen.getByRole("listitem")).toHaveCount(1);
    await expect(chosen).not.toContainText("carta.png");
    await page.getByRole("button", { name: "Leer la carta" }).click();
    await expect(page.getByText(/Ahora mismo no podemos leer la carta/)).toBeVisible();
  });

  test("lee un PDF y no admite más de 5 páginas", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);

    await readMenu(page, url, "carta-6-paginas.pdf");
    await expect(page.getByText(/Como mucho 5 páginas/)).toBeVisible();

    // Los archivos se suman: se quita el PDF largo y se elige uno más corto.
    await page.getByRole("button", { name: "Quitar carta-6-paginas.pdf" }).click();
    await page
      .getByLabel("Fotos o PDF de la carta")
      .setInputFiles(`${FIXTURES}/carta-2-paginas.pdf`);
    await page.getByRole("button", { name: "Leer la carta" }).click();
    await expect(reviewForm(page)).toBeVisible();
  });

  test("si el servicio no responde, lo explica y no crea nada", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await readMenu(page, url, "fallo.png");
    await expect(page.getByText(/Ahora mismo no podemos leer la carta/)).toBeVisible();
    await page.goto(`${url}/platos`);
    await expect(page.getByText("Aún no has añadido platos a esta carta.")).toBeVisible();
  });

  test("si una página falla, se conservan los platos de las demás", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await page.goto(`${url}/platos/importar`);
    await page
      .getByLabel("Fotos o PDF de la carta")
      .setInputFiles([`${FIXTURES}/carta.png`, `${FIXTURES}/fallo.png`]);
    await page.getByRole("button", { name: "Leer la carta" }).click();
    await expect(reviewForm(page)).toBeVisible();
    await expect(dishGroup(page, "Gambas al ajillo")).toBeVisible();
  });

  test("un error inesperado del servidor no deja la página cargando", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await readMenu(page, url, "error-inesperado.png");
    await expect(page.getByText(/Ahora mismo no podemos leer la carta/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Leer la carta" })).toBeVisible();
  });

  test("cinco páginas muy detalladas caben en una lectura", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await page.goto(`${url}/platos/importar`);
    // Fotos de ruido (lo más difícil de comprimir): el peor caso de tamaño.
    const noise = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1600;
      const context = canvas.getContext("2d");
      if (context === null) return "";
      const image = context.createImageData(1600, 1600);
      for (let i = 0; i < image.data.length; i += 1) image.data[i] = Math.random() * 256;
      context.putImageData(image, 0, 0);
      return canvas.toDataURL("image/png").split(",")[1] ?? "";
    });
    const buffer = Buffer.from(noise, "base64");
    await page
      .getByLabel("Fotos o PDF de la carta")
      .setInputFiles(
        [1, 2, 3, 4, 5].map((n) => ({ name: `pagina-${n}.png`, mimeType: "image/png", buffer })),
      );
    await page.getByRole("button", { name: "Leer la carta" }).click();
    await expect(reviewForm(page)).toBeVisible({ timeout: 30_000 });
  });

  test("una lectura que falla no gasta el límite diario", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    for (let i = 0; i < 5; i += 1) {
      await readMenu(page, url, "fallo.png");
      await expect(page.getByText(/Ahora mismo no podemos leer la carta/)).toBeVisible();
    }
    await readMenu(page, url);
    await expect(reviewForm(page)).toBeVisible();
  });

  test("si no se pueden crear los platos, lo explica sin perder la revisión", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await readMenu(page, url);
    // Se manipula la petición para que ningún plato sea válido (sin nombre).
    await page.route("**/platos/importar", async (route) => {
      const request = route.request();
      const body = request.postData();
      if (request.method() === "POST" && body?.includes("Gambas al ajillo")) {
        await route.continue({ postData: body.replaceAll(/"name":"[^"]*"/g, '"name":""') });
      } else {
        await route.continue();
      }
    });
    await reviewForm(page).getByRole("button", { name: "Añadir 2 platos" }).click();
    await expect(page.getByText(/No se han podido añadir los platos/)).toBeVisible();
    await expect(reviewForm(page)).toBeVisible();
  });

  test("como mucho 5 lecturas al día por restaurante", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    for (let i = 0; i < 5; i += 1) {
      await readMenu(page, url);
      await expect(reviewForm(page)).toBeVisible();
    }
    await readMenu(page, url);
    await expect(page.getByText(/Has leído 5 cartas en las últimas 24 horas/)).toBeVisible();
  });

  test("lo que envía el navegador se vuelve a validar: nunca «no contiene»", async ({ page }) => {
    await registerOwner(page);
    const { url } = await createRestaurant(page);
    await readMenu(page, url);
    await dishGroup(page, "Ensalada verde").getByLabel("Añadir «Ensalada verde»").uncheck();

    // Se manipula la petición: las gambas «no contienen» crustáceos.
    await page.route("**/platos/importar", async (route) => {
      const request = route.request();
      const body = request.postData();
      if (request.method() === "POST" && body?.includes("Gambas al ajillo")) {
        await route.continue({ postData: body.replace('"contains"', '"free_from"') });
      } else {
        await route.continue();
      }
    });
    await reviewForm(page).getByRole("button", { name: "Añadir 1 plato" }).click();
    await expect(page).toHaveURL(/\/platos\?importados=1$/);
    const row = page.getByRole("listitem").filter({ hasText: "Gambas al ajillo" });
    await expect(row).toBeVisible();
    await expect(row).not.toContainText("Alérgenos por revisar");
    await row.getByRole("link").click();
    await expect(page.getByText("Propuesto", { exact: true })).toHaveCount(0);
    await expect(
      page
        .getByRole("form", { name: "Alérgenos" })
        .getByRole("radio", { name: "No contiene", checked: true }),
    ).toHaveCount(0);
  });

  test("otro dueño no puede importar en un restaurante ajeno", async ({ browser }) => {
    const owner = await browser.newPage();
    await registerOwner(owner);
    const { url } = await createRestaurant(owner);

    const other = await browser.newPage();
    await registerOwner(other);
    await other.goto(`${url}/platos/importar`);
    await expect(other.getByRole("heading", { name: "Página no encontrada" })).toBeVisible();
    await owner.close();
    await other.close();
  });
});
