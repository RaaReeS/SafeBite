import { expect, test } from "@playwright/test";

const EXPECTED = {
  "content-security-policy": "frame-ancestors 'none'",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(self), payment=()",
};

test.describe("cabeceras de seguridad", () => {
  for (const path of ["/", "/login", "/panel", "/admin/solicitudes", "/r/la-huerta-demo"]) {
    test(`${path} no se puede incrustar en otra web y lleva las cabeceras`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      const headers = response.headers();
      for (const [name, value] of Object.entries(EXPECTED)) {
        expect(headers[name], name).toBe(value);
      }
    });
  }
});
