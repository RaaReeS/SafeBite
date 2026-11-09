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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    // Geocodificador simulado: los tests nunca llaman a Nominatim.
    env: { GEOCODER: "fake" },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
