# Rediseño de la web con el estilo de la app

Fecha: 2026-11-17 · Estado: pendiente de aprobación

## Intención

La app móvil se rediseñó: fondo gris claro, tarjetas blancas con sombra suave, verde
`#047857`, letra Inter, iconos Ionicons, chips y estados vacíos. La web (área del
comensal, carta pública por QR, panel de restaurantes, admin, portada, acceso y páginas
legales) sigue con el aspecto antiguo. El objetivo es que **la web y la app se vean
como el mismo producto**, moderno y bien organizado, sin cambiar lo que hace la web.

## Objetivos

- El mismo lenguaje visual que la app: colores, letra, radios, sombras, iconos y piezas.
- **Modo claro y oscuro** (decisión del usuario: se mantiene el oscuro), siguiendo la
  configuración del sistema, con contraste WCAG AA comprobado en los dos.
- Navegación clara por área. En el comensal, en el móvil, una barra inferior como en la app.
- Un solo sitio para los colores: ninguna página con colores sueltos de Tailwind.

## Fuera de alcance

- Cambios de funcionalidad, de textos legales o de la base de datos.
- Modo oscuro en la app móvil (se hará después; reutilizará estos colores).
- Un selector manual de claro u oscuro: se sigue al sistema, como ahora.

## Lo que no puede pasar

- Que algo deje de funcionar o de ser accesible: los 112 tests e2e deben seguir pasando,
  buscando por rol y nombre accesible, sin cambiar los nombres.
- Que cambie el lenguaje responsable o desaparezcan los avisos («información declarada por
  el establecimiento», «Confirma siempre…»).
- Que un estado se distinga solo por el color: siempre símbolo y texto.
- Que el PDF de la tabla de alérgenos cambie de aspecto sin querer: tiene su propio estilo.

## Opciones consideradas

1. **Variables de color en claro y oscuro, piezas comunes y luego página a página.**
   Elegida por el usuario: la web queda igual que la app y con un modo oscuro coherente.
2. Una librería de componentes (shadcn/ui): trae su propio estilo y muchos archivos;
   habría que adaptarla igualmente.
3. Cambiar solo colores y letra: rápido, pero sin tarjetas, iconos ni navegación nuevos,
   seguiría pareciendo otro producto.

## Diseño

### Colores (variables)

En `apps/web/src/app/globals.css`, variables CSS en `:root`, con su versión oscura en
`@media (prefers-color-scheme: dark)`, expuestas a Tailwind con `@theme`, por ejemplo
`bg-background`, `bg-card`, `text-muted`, `border-input` o `bg-primary`.
Los valores claros son los de `apps/mobile/src/theme.ts`:

| Variable     | Claro   | Oscuro (propuesta)                                  |
| ------------ | ------- | --------------------------------------------------- |
| background   | #f5f7f6 | #0b1210                                             |
| card         | #ffffff | #141c19                                             |
| surface      | #eef1ef | #1d2723                                             |
| border       | #dfe4e1 | #2a3631                                             |
| input-border | #8a93a0 | #6b7a73                                             |
| text         | #111827 | #eef2f0                                             |
| muted        | #5b6472 | #a3b0aa                                             |
| subtle       | #6b7280 | #8b9892                                             |
| primary      | #047857 | #34d399 (texto) / #047857 (fondos con texto blanco) |
| primary-soft | #d1fae5 | #0f3a2c                                             |
| danger       | #b91c1c | #f87171                                             |

Estados del filtro, iguales que en la app, con texto blanco o negro: apto `#047857`,
no apto `#b91c1c`, trazas `#fbbf24` con texto negro y sin datos `#5b6472`.
Los valores oscuros se ajustarán al comprobar el contraste.

### Letra e iconos

- **Letra:** Inter con `next/font/google`. Se descarga al compilar y se sirve desde la
  propia web, sin peticiones a Google desde el navegador. Esto corrige de paso el fallo
  actual: el texto sale en Arial.
- **Iconos:** Ionicons 5 de `react-icons/io5`, los mismos que la app. Son decorativos
  (`aria-hidden`) y siempre van junto a un texto.

### Piezas comunes (`apps/web/src/components/ui/`)

- Las piezas que ya existen (`Button`, los campos y `Alert`) cambian de aspecto, pero no
  de props ni de nombres accesibles. El botón pasa a forma de píldora con icono opcional.
- Piezas nuevas: `Card`, `SectionHeader`, `ListItem` (fila con icono, título, subtítulo
  y flecha), `IconBadge`, `Chip`, `EmptyState` y `Skeleton`.
- `StatusBadge` usa los colores del semáforo.
- Las baldosas de alérgenos, como `AllergenGrid` en la app, son casillas nativas
  (`<input type="checkbox">`) con su icono.
- El foco con teclado es siempre visible: un anillo verde.

### Navegación

- **Comensal:** en el ordenador, cabecera con el logotipo, enlaces con icono (la página
  actual resaltada, con `aria-current`) y cerrar sesión. En el móvil, una barra inferior
  fija con Inicio, Restaurantes, Alergias, Familia y Cuenta.
- **Panel de restaurantes y admin:** cabecera con el logotipo, el menú del área y el email.
- **Portada, acceso y registro:** cabecera verde con degradado y el formulario en una
  tarjeta, como la bienvenida de la app.

### Orden de trabajo (un commit o varios por fase; tests tras cada una)

1. Base: variables, Inter, iconos y piezas.
2. Cabeceras y navegación de las tres áreas.
3. Páginas: comensal, carta pública `/r/[slug]` y `menu-view`, panel, admin, y por
   último portada, acceso y páginas legales.
4. Repaso: contraste en claro y oscuro, foco con teclado y móvil a 375 px.
   Se pasan `pnpm lint`, `pnpm test` y `pnpm test:e2e`.

## Decisiones que dejo a quien lo construya

- Los valores exactos del modo oscuro, siempre que cumplan el contraste AA.
- La distribución interior de cada página, siempre que use las piezas comunes.
- El mapa: la ficha emergente de MapLibre (`.safebite-popup`) usará las variables para
  verse bien en los dos modos.

## Decisiones mías (revisables)

- Iconos con `react-icons/io5` en lugar de dibujarlos a mano: es la única dependencia nueva
  junto con la letra.
- La carta pública por QR se trata como prioridad dentro de la fase 3, porque es lo que más
  gente verá sin cuenta.
- Sin selector manual de modo: el modo lo decide la configuración del sistema.
