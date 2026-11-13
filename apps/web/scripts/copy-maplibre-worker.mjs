// Copia el worker de MapLibre a public/ para que el navegador lo pueda cargar.
// MapLibre lo busca con una URL que Next no resuelve al empaquetar, así que se
// sirve como archivo estático y se indica con setWorkerUrl (restaurant-map.tsx).
// Se copia en cada dev/build: siempre coincide con la versión instalada.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const packageDir = dirname(require.resolve("maplibre-gl/package.json"));
mkdirSync("public/vendor", { recursive: true });
copyFileSync(
  join(packageDir, "dist/maplibre-gl-worker.mjs"),
  "public/vendor/maplibre-gl-worker.mjs",
);
