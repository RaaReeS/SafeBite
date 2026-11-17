# SafeBite

> **Proyecto en desarrollo.** Las funciones, el diseño y el propio nombre («SafeBite» es provisional) pueden cambiar. Todavía no está listo para un uso real.

Plataforma para personas con alergias, intolerancias y dietas específicas que quieren comer fuera de casa y comprar alimentos con más tranquilidad.

- **Web para restaurantes:** declaran los 14 alérgenos de cada plato (Reglamento (UE) n.º 1169/2011), publican su carta con un código QR y descargan una tabla de alérgenos imprimible.
- **Carta pública por QR:** cualquiera la filtra según sus alergias, sin registrarse.
- **Comensales (web y app móvil):** guardan su perfil de alergias y el de su familia, buscan en el mapa dónde pueden comer y escanean productos envasados (datos de Open Food Facts).

La información de alérgenos es la **declarada por cada establecimiento**: confirma siempre con el establecimiento y revisa la etiqueta física.

## Tecnología

Monorepo en TypeScript con pnpm y Turborepo:

| Carpeta         | Contenido                                                                         |
| --------------- | --------------------------------------------------------------------------------- |
| `apps/web`      | Next.js: panel de restaurantes, carta pública, área del comensal y administración |
| `apps/mobile`   | App móvil con React Native y Expo                                                 |
| `packages/core` | Lógica compartida: filtro de alérgenos, validaciones y tipos                      |
| `supabase`      | Base de datos (Postgres), seguridad por filas (RLS) y sus tests                   |

## Desarrollo

Requisitos: Node.js, pnpm y Docker Desktop.

```bash
pnpm install
pnpm db:start      # Supabase local (requiere Docker)
pnpm dev:web       # http://localhost:3000
pnpm dev:mobile    # Expo
pnpm test          # tests de core y de la app
pnpm test:e2e      # tests de extremo a extremo de la web
```

Cada app necesita su archivo `.env.local` (las variables están en `.env.example`). Las claves nunca se suben al repositorio.

## Licencia

El código de SafeBite es **visible, pero no es de código abierto**. Se publica con la licencia [PolyForm Noncommercial 1.0.0](LICENSE.md):

- **Se permite** leerlo, estudiarlo, probarlo y usarlo con fines **no comerciales**.
- **No se permite** ningún uso comercial (por ejemplo, ofrecerlo como servicio o integrarlo en un producto de pago) sin un permiso expreso del autor.

Para un uso comercial, contacta con el autor a través de su perfil de GitHub: [@RaaReeS](https://github.com/RaaReeS).

La licencia cubre el código, aunque cambie el nombre del proyecto o se añadan funciones. El nombre del proyecto y su identidad visual no forman parte de esta licencia.

Copyright (c) 2026 Rares Stanescu.
