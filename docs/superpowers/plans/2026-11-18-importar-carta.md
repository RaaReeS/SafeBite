# Importar la carta: plan de implementación

> **Para agentes:** sub-skill necesaria: superpowers:executing-plans. Los pasos usan casillas (`- [ ]`).

**Objetivo:** que un restaurante suba fotos o un PDF de su carta, revise los platos leídos por la IA
(Groq, gratis) y los cree con los alérgenos solo propuestos, que confirmará después.

**Arquitectura:**

- **`core`:** normaliza la respuesta del modelo, propone alérgenos con un diccionario y combina
  las propuestas.
- **Web:** convierte PDF e imágenes en el navegador, envía al servidor, que llama a un lector
  intercambiable (Groq o simulado), y muestra una pantalla de revisión antes de crear los platos.
- **Base de datos:** columna `allergen_suggestions` (fuera de las vistas públicas) y límite de 5
  lecturas al día.

**Tecnología:** TypeScript, zod 4, Vitest y Stryker (core), Next.js 16 con Server Actions,
`pdfjs-dist` en el navegador, Supabase (migración y pgTAP), Playwright.

**Diseño de referencia:** `docs/superpowers/specs/2026-11-18-importar-carta-design.md`

## Restricciones globales

- **Propuestas:**
  - solo `contains` o `may_contain`, nunca `free_from`;
  - nunca se escriben en `dish_allergens` hasta que el dueño pulsa «Guardar alérgenos».
- **Límites de lectura:**
  - de 1 a 5 imágenes por lectura, cada una de 4 MB como máximo en forma de data URL JPEG;
  - 5 lecturas al día por restaurante (error `SB429`).
- **Configuración:** `MENU_READER=fake` en los tests. `GROQ_API_KEY` y `GROQ_MODEL` (por defecto
  `qwen/qwen3.6-27b`) solo en el servidor.
- **Textos de la base de datos:**
  - nombre de 1 a 120 caracteres;
  - descripción, 1000 como máximo;
  - categoría, 60;
  - ingredientes, 2000;
  - precio en céntimos, mayor o igual que 0.
- Cobertura y mutación al 100 % en `src/menu-import` (se añade a `vitest.config` y a Stryker).
- Aviso de responsabilidad: «Alérgenos propuestos automáticamente: revisa cada uno antes de guardar.
  Tú eres responsable de la información (Reglamento UE 1169/2011).»

## Puntos de revisión

1. **El modelo devuelve JSON roto o con campos de otro tipo.** Se descarta lo inválido plato a plato;
   si no queda ninguno, el mensaje es «No hemos encontrado platos». Lo cubre el test de `parseMenuResponse`.
2. **Precios escritos de mil formas** («12,50 €», «12.5», «12€», «—»). Se convierten a céntimos o se
   dejan vacíos; nunca dan un número absurdo. Lo cubre el test de `parsePrice`.
3. **Palabras del diccionario dentro de otras** («pan» en «panceta», «nata» en «natación»). Solo
   cuentan palabras completas, sin tildes ni mayúsculas. Lo cubre el test de `suggestAllergens`.
4. **Groq caído, lento o con el plan gratis agotado.** Mensaje claro y ningún plato creado. Lo cubre el
   e2e con el lector simulado en modo fallo.
5. **Un dueño envía a `createImportedDishes` platos con alérgenos inventados o con `free_from`.** El
   servidor los descarta. Lo cubre el e2e de entrada manipulada y el test de `normalizeImportedDish`.

---

### Task 1: Lógica de importación en `core`

**Archivos:**

- Crear `packages/core/src/menu-import/{schema.ts, price.ts, dictionary.ts, suggest.ts, normalize.ts}`
  y sus `*.test.ts`.
- Modificar `src/index.ts`, `vitest.config.ts` (umbral al 100 % en `src/menu-import/**`) y
  `stryker.config.json` (añadir `src/menu-import/**/*.ts`).

**Produce:**

- `type SuggestedLevel = "contains" | "may_contain"`
- `type AllergenSuggestion = { allergen: Allergen; level: SuggestedLevel }`
- `type ImportedDish = { name: string; description: string | null; priceCents: number | null; category: string | null; ingredients: string | null; suggestions: AllergenSuggestion[] }`
- `parsePrice(value: unknown): number | null`: acepta números (euros) y textos («12,50 €», «12.5»,
  «12 €»). Si el valor es negativo, no es finito o pasa de 100 000 €, devuelve null.
- `suggestAllergens(text: string): AllergenSuggestion[]`: con el diccionario `ALLERGEN_KEYWORDS`
  (`Record<Allergen, readonly string[]>`, unas 150 palabras), todo `contains`, sin repetir alérgenos.
- `mergeSuggestions(...lists: AllergenSuggestion[][]): AllergenSuggestion[]`: si coinciden, gana
  `contains`; el resultado sale ordenado como `ALLERGENS`.
- `parseMenuResponse(raw: unknown): ImportedDish[]`: esquema zod tolerante. Acepta
  `{ dishes: [...] }`, descarta los platos inválidos o sin nombre, recorta los textos a los límites
  de la base de datos, deja solo los alérgenos y niveles válidos y combina las propuestas del modelo
  con `suggestAllergens(nombre + descripción + ingredientes)`.
- `normalizeImportedDish(input: unknown): ImportedDish | null`: valida lo que envía el navegador
  al crear los platos. Mismas reglas; no añade el diccionario.

- [ ] **Tests:**
  - `parsePrice`: `("12,50 €")→1250`, `(12.5)→1250`, `("12€")→1200`, `("—")→null`, `(-3)→null`,
    `("1e9")→null`.
  - `suggestAllergens`:
    - «Gambas al ajillo» → crustaceans;
    - «Panceta ibérica» → [];
    - «Tarta de QUESO» → milk;
    - «harina de trigo» → gluten;
    - «natación» → [].
  - `mergeSuggestions([{milk,may_contain}],[{milk,contains}])` → `[{milk,contains}]`, ordenado.
  - `parseMenuResponse`:
    - descarta `{name:""}`, `{name:5}`, un alérgeno `"chocolate"` y el nivel `"free_from"`;
    - recorta un nombre de 300 caracteres a 120;
    - `null` → `[]`.
  - `normalizeImportedDish`: `free_from` descartado y entrada que no es objeto → null.
- [ ] Comprobar que los tests fallan, implementar, y que `pnpm --filter @safebite/core test`
      (cobertura 100 %) y `pnpm test:mutation` (100 %) pasan.
- [ ] Commit.

### Task 2: Base de datos

**Archivos:**

- Crear `supabase/migrations/20261118090000_menu_import.sql` y
  `supabase/tests/14_menu_import_test.sql`.
- Regenerar `packages/core/src/db/database.types.ts`.

**Produce:**

- `dishes.allergen_suggestions jsonb not null default '[]'`, con
  `check (private.valid_allergen_suggestions(allergen_suggestions))`: es un array de objetos
  `{allergen, level}` con `allergen` del enum y `level` en (`contains`, `may_contain`).
- Tabla `public.menu_imports (id uuid pk, restaurant_id uuid fk on delete cascade, created_at timestamptz default now())`:
  RLS activado, `revoke all` para `anon` y `authenticated`, y `select` solo del propio restaurante.
- Función `public.register_menu_import(p_restaurant_id uuid) returns void`, `security definer`:
  - exige que el usuario sea el dueño (si no, lanza un error);
  - si ya hay 5 lecturas en las últimas 24 h, lanza `SB429`;
  - si no, inserta la lectura.
    Se concede solo a `authenticated`.
- `public_dishes` no cambia: no expone la columna.

- [ ] **pgTAP:**
  - la columna existe y rechaza `[{"allergen":"milk","level":"free_from"}]` y `[{"allergen":"chocolate","level":"contains"}]`;
  - el dueño la actualiza y otro dueño no;
  - `public_dishes` no tiene la columna;
  - la 6.ª llamada a `register_menu_import` en 24 h falla con SB429;
  - otro dueño o un comensal no pueden llamarla;
  - `menu_imports` no es legible por `anon`.
- [ ] `pnpm db:reset`, `pnpm db:test` y `pnpm db:types`. Commit.

### Task 3: Lector y acciones del servidor (web)

**Archivos:**

- Crear `apps/web/src/lib/menu-reader/{index.ts, groq.ts, fake.ts}`.
- Crear `apps/web/src/app/panel/restaurantes/[id]/platos/importar/actions.ts`.
- Modificar `.env.example`.

**Produce:**

- `interface MenuReader { read(images: string[]): Promise<unknown> }` y `getMenuReader(): MenuReader`
  (`MENU_READER=fake` → `fake`; si no, `groq`).
- `groq.ts`: `POST https://api.groq.com/openai/v1/chat/completions` con:
  - `model` = `GROQ_MODEL` o `qwen/qwen3.6-27b`;
  - las imágenes como `image_url`;
  - `response_format: {type:"json_object"}`;
  - tiempo máximo de 60 s (`AbortSignal.timeout`).
    Las instrucciones para el modelo son las del diseño. Si falla, lanza `MenuReaderError`.
- `fake.ts`:
  - devuelve dos platos fijos («Gambas al ajillo», 12,50 €, con propuesta de crustáceos; «Ensalada
    verde», 8 €, sin propuestas);
  - si alguna imagen contiene el marcador `FALLO`, lanza `MenuReaderError` (para el e2e).
- `readMenu(restaurantId: string, images: string[]): Promise<ReadMenuState>`, Server Action, con
  `ReadMenuState = { status: "ok"; dishes: ImportedDish[] } | { status: "error"; message: string }`:
  1. `requireRestaurantOwner`, `isUuid` y dueño;
  2. de 1 a 5 imágenes con el prefijo `data:image/jpeg;base64,` y 4 MB como máximo cada una;
  3. `register_menu_import` (SB429 → mensaje de límite);
  4. lector y `parseMenuResponse`;
  5. ningún plato → mensaje «No hemos encontrado platos…».
- `createImportedDishes(restaurantId: string, dishes: unknown[]): Promise<void>`, Server Action:
  - dueño;
  - `normalizeImportedDish` para cada plato, descartando los null;
  - de 1 a 100 platos;
  - insertarlos con `sort_order` a partir del máximo actual;
  - redirigir a `…/platos?importados=N`.

- [ ] Typecheck y lint. Commit (se prueba en la tarea 5).

### Task 4: Pantallas (web)

**Archivos:**

- Crear `apps/web/src/app/panel/restaurantes/[id]/platos/importar/{page.tsx, import-flow.tsx}`
  (cliente) y `apps/web/src/lib/menu-import/prepare-images.ts` (cliente).
- Modificar:
  - `platos/page.tsx`: botón «Importar desde la carta», etiqueta «Alérgenos por revisar» y aviso
    con `?importados`;
  - `platos/[dishId]/allergen-editor.tsx` y su página: propuestas preseleccionadas y marcadas
    «Propuesto», con un aviso;
  - `saveDishAllergens`: además, vacía `allergen_suggestions`;
  - `i18n/es.ts`.
- Dependencia nueva: `pdfjs-dist`. El worker se copia a `public/vendor`, como el de MapLibre.

**Produce:**

- `prepareImages(files: File[]): Promise<string[]>`:
  - PDF → una imagen por página con `pdfjs-dist`;
  - las imágenes se reducen a 1600 px como máximo y se pasan a JPEG con calidad 0,8;
  - lanza un error con mensaje si hay más de 5 páginas o imágenes, o un formato no admitido.
- Flujo: elegir → «Leer la carta» (con esqueletos y «Puede tardar unos segundos») → revisión.
  - Revisión: tarjetas editables con casilla «Incluir», etiquetas «Propuesto» y aviso de
    responsabilidad.
  - Botón «Añadir N platos».
  - Formulario con nombre accesible «Platos leídos de la carta».

- [ ] Typecheck, lint y capturas en claro, oscuro y móvil. Commit.

### Task 5: Tests e2e y documentación

**Archivos:**

- Crear `apps/web/e2e/menu-import.spec.ts`.
- Modificar el `webServer.env` de `playwright.config.ts` (`MENU_READER: "fake"`) y `CLAUDE.md`.

- [ ] **Tests:**
  1. Subir una imagen, revisar, desmarcar «Ensalada verde», cambiar el precio a 13 € y «Añadir 1
     plato». En la lista aparece «Alérgenos por revisar», y en `/r/[slug]`, con crustáceos
     marcados, «Gambas al ajillo» sale «Sin datos suficientes».
  2. En el editor, crustáceos aparece preseleccionado como «Propuesto». Al guardar, la etiqueta
     desaparece y la carta pasa a «No apto» para crustáceos.
  3. La 6.ª lectura del día muestra el mensaje de límite.
  4. Otro dueño no puede leer ni crear en un restaurante ajeno.
  5. El lector simulado en modo fallo muestra el error y no crea nada.
  6. Un PDF de 6 páginas da error sin enviar nada.
  7. Una llamada manipulada a `createImportedDishes` con `free_from` no declara nada.
- [ ] Suite completa (`pnpm lint`, `pnpm test`, `pnpm db:test` y `pnpm test:e2e`).
- [ ] `CLAUDE.md`: convención de la importación, lector intercambiable y variables. Commit.
