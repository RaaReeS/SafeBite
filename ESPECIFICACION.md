# SafeBite: Especificación del proyecto

## 1. Resumen

SafeBite ayuda a personas con alergias e intolerancias alimentarias a encontrar qué pueden comer con seguridad, tanto en restaurantes como en el supermercado. El usuario define su perfil una vez y la carta de cada restaurante se adapta a él. Los restaurantes disponen de una herramienta sencilla para cumplir la normativa de alérgenos y atraer a un público muy fiel.

## 2. Problema

- Las cartas suelen carecer de información clara sobre alérgenos y trazas.
- El personal de sala no siempre conoce los ingredientes exactos.
- El usuario vive con incertidumbre y riesgo para su salud.

## 3. Usuarios

- **Usuarios finales (B2C):** celíacos, alérgicos, intolerantes (lactosa, frutos secos, etc.) y familias con niños alérgicos. En fases posteriores: veganos, religiosas (kosher, halal), diabéticos e hipertensos.
- **Restaurantes (B2B):** locales que deben informar sobre alérgenos y quieren captar clientes con restricciones alimentarias.

## 4. Módulos

### 4.1 Panel web para restaurantes
- Registro e inicio de sesión del restaurante.
- Ficha del local (nombre, dirección, ciudad, contacto).
- CRUD de platos: nombre, descripción, precio, categoría, ingredientes.
- Marcado de alérgenos por plato (contiene / puede contener trazas / no contiene).
- Generación y descarga del código QR (PNG y PDF imprimible).
- Vista previa de cómo ve la carta el cliente.

### 4.2 Carta web pública (por QR)
- URL pública por restaurante: `/r/[slug]`.
- Sin registro ni descarga.
- Selector rápido de alérgenos; los platos no aptos se ocultan o se tachan.
- Iconos claros de alérgenos en cada plato.
- Botón "Guarda tu perfil: descarga SafeBite".
- El filtro es temporal y no se guarda ningún dato personal.

### 4.3 App móvil (Android + iOS)
- Registro e inicio de sesión.
- Perfil de alergias e intolerancias (se configura una sola vez).
- Búsqueda de restaurantes por ciudad o cercanía.
- Carta de cada restaurante filtrada automáticamente según el perfil.
- Escáner de código de barras de productos (Open Food Facts) con resultado en semáforo.
- Botón "Pide este restaurante" para solicitar el alta de un local.

## 5. Resultado del filtro de alérgenos

Para cada plato o producto y cada usuario:

| Estado | Significado |
|---|---|
| `no_apto` | Contiene un alérgeno del perfil del usuario |
| `posibles_trazas` | Puede contener trazas de un alérgeno del perfil |
| `sin_datos` | Falta información sobre algún alérgeno relevante |
| `apto` | Hay información completa y ningún alérgeno del perfil está presente |

Prioridad: `no_apto` > `posibles_trazas` > `sin_datos` > `apto`. Ante la duda, nunca `apto`.

## 6. Modelo de datos (borrador)

- `profiles`: id (= auth.users.id), nombre, creado_en
- `user_allergens`: user_id, allergen (enum de 14)
- `restaurants`: id, owner_id, nombre, slug, ciudad, dirección, lat, lng
- `dishes`: id, restaurant_id, nombre, descripción, precio, categoría, activo
- `dish_allergens`: dish_id, allergen, nivel (`contiene` | `trazas` | `no_contiene`), un registro por cada alérgeno declarado
- `restaurant_requests`: id, user_id, nombre_restaurante, ciudad, creado_en

Un alérgeno sin registro en `dish_allergens` equivale a "sin datos".

## 7. Los 14 alérgenos (Reglamento UE 1169/2011)

Cereales con gluten, crustáceos, huevos, pescado, cacahuetes, soja, leche y lácteos, frutos de cáscara, apio, mostaza, sésamo, dióxido de azufre y sulfitos, altramuces y moluscos.

## 8. Seguridad y privacidad

- Row Level Security en todas las tablas.
- Cada usuario accede solo a su perfil; cada restaurante solo a su carta.
- La carta pública es de solo lectura.
- Servidores de Supabase en la UE.
- Política de privacidad, consentimiento explícito para datos de salud y derecho de supresión de cuenta.
- Términos de uso con cláusula de responsabilidad: la información la declara el establecimiento.

## 9. Alcance del MVP

**Incluye:** panel de restaurantes, carta web por QR, app con perfil guardado y carta filtrada, escáner de código de barras.

**Excluye:** traductor con cámara, verificación de protocolos de cocina, dietas con datos nutricionales, pagos y suscripciones.

## 10. Hoja de ruta

1. Monorepo, `CLAUDE.md` y proyecto Supabase en la UE.
2. Esquema de base de datos, RLS y tests de permisos.
3. `packages/core`: enum de alérgenos y filtro con tests exhaustivos.
4. Panel web: autenticación, platos, alérgenos y QR.
5. Carta web pública con filtro.
6. App móvil: perfil y carta filtrada.
7. Escáner de código de barras.
8. Revisión de seguridad, asesoría legal y piloto en una zona.

## 11. Criterios de éxito del piloto

- 30 restaurantes con carta completa en la zona piloto.
- 300 usuarios registrados.
- Porcentaje de usuarios que vuelven a usar la app en 30 días.
- Cero incidencias de platos mostrados como aptos siendo no aptos.
