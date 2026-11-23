import { defineConfig, devices } from "@playwright/test";

// Tests de extremo a extremo contra el Supabase LOCAL (`pnpm db:start`).
// El puerto 3000 debe coincidir con site_url de supabase/config.toml, que es la
// base de los enlaces de los emails de Auth.
const PORT = 3000;

export default defineConfig({
  testDir: "./e2e",
  // Cada test registra cuentas y espera emails contra un único servidor local:
  // con todos en paralelo, algunos pasos tardan más que los valores por defecto.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "es-ES",
    trace: "retain-on-failure",
  },
  // Obtiene una sola vez la sesión de administrador (con la verificación en dos
  // pasos) que usan los tests para verificar restaurantes por la API.
  globalSetup: "./e2e/global-setup.ts",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /admin.*\.spec\.ts/,
    },
    {
      // Supabase no admite dos verificaciones simultáneas del mismo autenticador:
      // los tests que entran como administrador en la web van de uno en uno.
      name: "admin",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /admin.*\.spec\.ts/,
      workers: 1,
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    // Geocodificador y lector de cartas simulados: los tests nunca llaman a Nominatim ni a Groq.
    env: { GEOCODER: "fake", MENU_READER: "fake" },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
