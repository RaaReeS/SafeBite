import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/db/database.types.ts", "src/index.ts"],
      reporter: ["text-summary", "text"],
      thresholds: {
        // Lógica crítica (regla 2 de CLAUDE.md): cobertura total obligatoria.
        "src/filter/**": { statements: 100, branches: 100, functions: 100, lines: 100 },
        "src/allergens/**": { statements: 100, branches: 100, functions: 100, lines: 100 },
        "src/menu/**": { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  },
});
