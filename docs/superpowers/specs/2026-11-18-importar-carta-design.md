# Importar la carta desde fotos o PDF

Fecha: 2026-11-18 · Estado: pendiente de aprobación

## Intención

Dar de alta la carta es lo más lento para un restaurante: hoy cada plato se escribe a mano y se
declaran sus 14 alérgenos uno a uno. El restaurante podrá **subir fotos o un PDF de su carta** y
SafeBite **leerá los platos** (nombre, precio, categoría, descripción e ingredientes si aparecen) y
**propondrá alérgenos**. El restaurante revisa y confirma. El objetivo es ahorrar tiempo sin
rebajar la seguridad del filtro.

## Decisiones del usuario

- **Alérgenos: opción B.** La IA los propone, pero **solo cuentan cuando el restaurante los confirma**.
- **Gratis.** Sin Claude ni servicios de pago: **Groq, en su plan gratuito**, con un modelo de visión
  (hoy `qwen/qwen3.6-27b`). Gemini quedó descartado porque su plan gratis no se puede usar en
  aplicaciones para usuarios de la UE.
- **Proveedor intercambiable**, por si Groq cambia sus condiciones o retira el modelo.

## Objetivos

- Subir de 1 a 5 imágenes (JPG, PNG o WebP) o un PDF de hasta 5 páginas.
- Una pantalla de revisión donde se corrigen o descartan los platos leídos antes de crearlos.
- Alérgenos propuestos por la IA **y** por un diccionario propio de palabras (red de seguridad), visibles
  como propuesta en el editor de cada plato.
- Si la IA falla o se agota el plan gratis, mensaje claro: se puede seguir añadiendo platos a mano.

## Fuera de alcance

- Leer cartas desde la app móvil (la app es de comensales).
- Guardar las fotos o el PDF.
- Traducir cartas o detectar idiomas.
- Rellenar los alérgenos de platos que ya existen.

## Lo que no puede pasar (reglas críticas)

- **Ningún alérgeno propuesto cuenta para el filtro sin confirmación.** Los platos importados se crean
  **sin declaraciones** en `dish_allergens`: para el comensal salen «sin datos», nunca «apto»
  (regla 1). Las propuestas se guardan aparte y **no aparecen en las vistas públicas**: `public_dishes`
  elige sus columnas una a una.
- **Las propuestas nunca pueden ser «no contiene» (`free_from`).** Solo «contiene» o «puede contener».
  Ni la IA ni el diccionario declaran ausencias.
- La lógica de alérgenos (diccionario y combinación de propuestas) vive en `packages/core`, con
  cobertura y mutación al 100 % (regla 2). El filtro no cambia.
- Cada restaurante solo importa en **su** restaurante: se comprueba en el servidor y lo refuerza RLS
  (regla 4).
- Lenguaje responsable (regla 5): «Alérgenos propuestos automáticamente: revisa cada uno antes de
  guardar. Tú eres responsable de la información (Reglamento UE 1169/2011)».
- La clave de Groq va solo en variables de entorno del servidor (`GROQ_API_KEY`), nunca en el cliente,
  en el repositorio ni en el chat (regla 7).

## Opciones consideradas

1. **Claude (Anthropic).** La mejor lectura, pero de pago (unos céntimos por carta). Rechazada por el
   usuario (todo gratis).
2. **Gemini, plan gratis.** Sus condiciones exigen el plan de pago para servir a usuarios de la UE.
   Descartada.
3. **GLM 5.3 Flash.** Gratis solo dentro de OpenCode; fuera, de pago. Descartada.
4. **Sin IA** (lectura de texto en el navegador y reglas propias). Gratis y sin terceros, pero lee mal
   cartas reales y no permite la opción B tal como se pidió. Su **diccionario** se aprovecha como red de
   seguridad.
5. **Groq, plan gratis (elegida).** Lee imágenes, devuelve JSON y no guarda los datos por defecto (se
   puede activar «retención cero»). Riesgos: los límites y modelos pueden cambiar. Pendiente de
   confirmar el uso comercial del plan gratis antes del piloto.

## Diseño

### Flujo del restaurante

1. Panel → su restaurante → **Platos** → botón **«Importar desde la carta»**
   (`/panel/restaurantes/[id]/platos/importar`).
2. Elige fotos o un PDF. En el navegador:
   - el PDF se convierte en imágenes, una por página (`pdfjs-dist`);
   - cada imagen se reduce a 1600 px como máximo y se pasa a JPEG, para no pasar de los límites
     de Groq;
   - más de 5 páginas o imágenes, o un formato no admitido, da un error sin enviar nada.
3. **«Leer la carta»** → aviso de que puede tardar unos segundos → **pantalla de revisión**:
   - una tarjeta por plato con nombre, precio, categoría, descripción e ingredientes, todo editable;
   - una casilla «Incluir» por plato, marcada por defecto;
   - los alérgenos propuestos, como etiquetas «Propuesto», solo informativas en esta pantalla;
   - un aviso de responsabilidad.
4. **«Añadir N platos»** → se crean visibles en la carta, al final del orden actual, sin
   declaraciones de alérgenos y con sus propuestas guardadas. Se vuelve a la lista de platos con
   «Se han añadido N platos. Revisa los alérgenos de cada uno».
5. En la lista de platos, cada plato con propuestas pendientes lleva la etiqueta **«Alérgenos por
   revisar»**.
6. En el editor de alérgenos del plato, las propuestas aparecen **preseleccionadas y marcadas como
   «Propuesto»**, con un aviso arriba. No se guarda nada hasta pulsar **«Guardar alérgenos»**. Al
   guardar, las propuestas se borran, porque ya están confirmadas.

### Base de datos (migración nueva)

- `dishes.allergen_suggestions public.allergen_suggestion[]`, donde
  `allergen_suggestion = (allergen public.allergen, level public.allergen_level)`, con un `check` para
  que `level` solo pueda ser `contains` o `may_contain`. Por defecto, un array vacío. No sale en las
  vistas públicas. Solo la edita el dueño del restaurante, con la misma RLS que ya tiene `dishes`.
  _Decisión que dejo a quien lo construya:_ usar `jsonb` con validación si el tipo compuesto complica
  los tipos generados.
- `public.menu_imports (id, restaurant_id, created_at)` para contar las lecturas: **5 al día por
  restaurante**, con el error propio `SB429`, como las solicitudes. Lleva RLS (el dueño solo ve las
  suyas) y `revoke all` previo, y solo se inserta mediante una función `security definer`
  `register_menu_import(restaurant_id)` que comprueba al propietario y el límite.
- Los tests pgTAP cubren permisos, el límite y que las vistas públicas no exponen
  `allergen_suggestions`.

### Servidor (web)

- Server Action `readMenu(restaurantId, images: string[])` (data URLs JPEG):
  - `requireRestaurantOwner` y comprobación de que el restaurante es suyo;
  - validación de 1 a 5 imágenes de 4 MB como máximo cada una;
  - `register_menu_import` para aplicar el límite;
  - llamada al lector;
  - validación con zod;
  - devuelve los platos propuestos. No escribe platos.
- Server Action `createImportedDishes(restaurantId, dishes)`: vuelve a validar todo, como entrada no
  fiable, e inserta los platos con sus `allergen_suggestions` en una sola operación.
- **Lector intercambiable** (`apps/web/src/lib/menu-reader/`):
  - interfaz `MenuReader.read(images) → RawMenu`;
  - implementación `groq.ts`, que llama por `fetch` a la API compatible con OpenAI de Groq (modelo en
    `GROQ_MODEL`, JSON mode, tiempo máximo de unos 60 s);
  - implementación `fake.ts` para los tests, activada con `MENU_READER=fake`, como `GEOCODER=fake`.
- **Instrucciones para el modelo:** extraer solo lo que aparece en la carta, sin inventar platos ni
  precios. Precio en euros como número o vacío. Alérgenos solo de la lista de 14 códigos, con «contiene»
  o «puede contener». Si no está seguro, no proponer nada.

### Lógica compartida (`packages/core`)

- `src/menu-import/`:
  - **esquema zod** de la respuesta del modelo;
  - **normalización**: recortar textos a los límites de la base de datos, convertir precios «12,50 €»
    a céntimos y descartar platos sin nombre;
  - **descarte** de cualquier alérgeno o nivel desconocido.
- `suggestAllergens(text): AllergenSuggestion[]`: **diccionario de palabras en español** sobre nombre,
  descripción e ingredientes. Por ejemplo: gambas, langostinos → crustáceos; nata, queso, mantequilla
  → leche; harina de trigo, pan, rebozado → gluten; nueces, almendras → frutos de cáscara. Sin tildes
  ni mayúsculas, y con palabras completas.
- `mergeSuggestions(ai, dictionary)`: unión de las dos listas. Si coinciden en un alérgeno, gana
  «contiene» sobre «puede contener». Nunca produce `free_from`.
- Cobertura y mutación al 100 % (se añade `src/menu-import` a la configuración de Stryker).

### Textos (`i18n/es.ts`)

Botón, ayuda, errores (formato, demasiadas páginas, límite diario, Groq no disponible, no se han
encontrado platos), revisión, aviso de responsabilidad y etiquetas «Propuesto» y «Alérgenos por
revisar».

### Tests

- **core:** diccionario, normalización, esquema y combinación (unitarios, cobertura y mutación).
- **pgTAP:** columna oculta en las vistas, límite de 5 al día, solo el dueño.
- **e2e (Playwright, `MENU_READER=fake`):**
  - subir una imagen, revisar y crear platos;
  - los platos salen «sin datos» en la carta pública;
  - las propuestas aparecen en el editor y desaparecen al guardar;
  - el límite diario;
  - otro dueño no puede importar en un restaurante ajeno;
  - un PDF de más de 5 páginas da error.
- Sin llamadas reales a Groq en los tests.

### Configuración (la hace el usuario)

- Crear una cuenta gratis en Groq y una clave de API, y activar **Zero Data Retention** en Data Controls.
- `GROQ_API_KEY` en `apps/web/.env.local` y en Vercel (Production), sin pegarla en el chat.
  Opcional: `GROQ_MODEL`.
- `.env.example` documenta las variables vacías.
- Antes del piloto, revisar las condiciones de uso comercial del plan gratis de Groq.

## Decisiones mías (revisables)

- Límite de **5 lecturas al día por restaurante** y de **5 páginas o imágenes por lectura**.
- Los platos importados se crean **visibles**: sin declaraciones salen «sin datos», que es seguro, y
  la carta no queda vacía.
- La conversión del PDF y la reducción de las imágenes se hacen **en el navegador**: el servidor (en el
  plan gratis de Vercel) no hace trabajo pesado y se envía menos.
- El diccionario empieza con unas 150 palabras habituales en cartas españolas y crecerá con el uso.
