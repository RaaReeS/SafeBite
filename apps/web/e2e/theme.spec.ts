import { expect, test } from "@playwright/test";

/**
 * Colores del tema (variables de globals.css), en claro y en oscuro: cada pareja
 * de texto y fondo cumple el contraste WCAG AA. Se leen de la página real, así
 * que el test vigila lo que de verdad se pinta.
 */

type Pair = [foreground: string, background: string, minimum: number];

const HEX = /^\s*#([0-9a-f]{3}|[0-9a-f]{6})\s*$/i;

const PAIRS: Pair[] = [
  ["--fg", "--background", 4.5],
  ["--fg", "--card", 4.5],
  ["--fg", "--surface", 4.5],
  ["--muted", "--card", 4.5],
  ["--muted", "--background", 4.5],
  ["--muted", "--surface", 4.5],
  ["--subtle", "--card", 4.5],
  ["--primary-text", "--background", 4.5],
  ["--primary-text", "--card", 4.5],
  ["--on-primary", "--primary", 4.5],
  ["--primary-strong", "--primary-soft", 4.5],
  ["--danger", "--card", 4.5],
  ["--danger", "--danger-soft", 4.5],
  ["--on-primary", "--danger-solid", 4.5],
  ["--warning-fg", "--warning-bg", 4.5],
  ["--info-fg", "--info-bg", 4.5],
  ["--success-fg", "--success-bg", 4.5],
  // Bordes de campos y casillas: 3:1 con su fondo (WCAG 1.4.11).
  ["--input", "--card", 3],
  // Estados del filtro: siempre con su texto encima.
  ["--on-status", "--status-apto", 4.5],
  ["--on-status", "--status-no-apto", 4.5],
  ["--on-status", "--status-sin-datos", 4.5],
  ["--on-status-trazas", "--status-trazas", 4.5],
];

/** Acepta #rgb y #rrggbb (el compilador de CSS acorta #ffffff a #fff). */
function luminance(hex: string): number {
  const short = hex.trim().replace("#", "");
  const value = short.length === 3 ? [...short].map((c) => c + c).join("") : short;
  const channels = [0, 2, 4].map((i) => Number.parseInt(value.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (high + 0.05) / (low + 0.05);
}

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`tema en modo ${colorScheme === "light" ? "claro" : "oscuro"}`, () => {
    test.use({ colorScheme });

    test("los colores cumplen el contraste AA", async ({ page }) => {
      await page.goto("/");
      const names = [...new Set(PAIRS.flatMap(([fg, bg]) => [fg, bg]))];
      const values = await page.evaluate((list) => {
        const style = getComputedStyle(document.documentElement);
        return Object.fromEntries(list.map((name) => [name, style.getPropertyValue(name)]));
      }, names);

      for (const [fg, bg, minimum] of PAIRS) {
        expect(values[fg], `${fg} definida`).toMatch(HEX);
        expect(values[bg], `${bg} definida`).toMatch(HEX);
        const ratio = contrast(values[fg] ?? "", values[bg] ?? "");
        expect(ratio, `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(minimum);
      }
    });

    test("la página usa el fondo del tema y la letra Inter", async ({ page }) => {
      await page.goto("/");
      const { font, background, expected } = await page.evaluate(() => {
        const body = getComputedStyle(document.body);
        const probe = document.createElement("div");
        probe.style.backgroundColor = "var(--background)";
        document.body.append(probe);
        const value = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return { font: body.fontFamily, background: body.backgroundColor, expected: value };
      });
      expect(font).toMatch(/Inter/);
      expect(background).toBe(expected);
    });
  });
}
