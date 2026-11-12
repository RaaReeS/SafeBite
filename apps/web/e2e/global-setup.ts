import { createAdminApiToken } from "./helpers";

/** Una sola sesión de administrador (aal2) para todos los tests; dura una hora. */
export default async function globalSetup() {
  process.env.E2E_ADMIN_TOKEN = await createAdminApiToken();
}
