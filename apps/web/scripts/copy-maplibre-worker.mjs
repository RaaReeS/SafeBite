// Copia a public/vendor los «workers» que el navegador carga como archivo:
// - MapLibre: lo busca con una URL que Next no resuelve al empaquetar (se indica
//   con setWorkerUrl en restaurant-map.tsx).
// - PDF.js: lee los PDF de la carta al importarla (prepare-images.ts).
// Se copian en cada dev/build: siempre coinciden con la versión instalada.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
mkdirSync("public/vendor", { recursive: true });

const maplibre = dirname(require.resolve("maplibre-gl/package.json"));
copyFileSync(join(maplibre, "dist/maplibre-gl-worker.mjs"), "public/vendor/maplibre-gl-worker.mjs");

const pdfjs = dirname(require.resolve("pdfjs-dist/package.json"));
copyFileSync(join(pdfjs, "build/pdf.worker.min.mjs"), "public/vendor/pdf.worker.min.mjs");
