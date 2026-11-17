# Rediseño de la web: plan de implementación

> **Para agentes:** sub-skill necesaria: superpowers:executing-plans (ejecución en esta
> sesión). Los pasos usan casillas (`- [ ]`).

**Objetivo:** que la web tenga el aspecto de la app en modo claro y oscuro, sin cambiar su
funcionamiento.

**Arquitectura:** las variables de color van en `globals.css` y se exponen a Tailwind 4 con
`@theme`. Las piezas comunes van en `src/components/ui/`. Después se rehacen las cabeceras
y las páginas, quitando los colores sueltos.

**Tecnología:** Next.js 16 (App Router), Tailwind 4, `next/font/google` (Inter),
`react-icons/io5` y Playwright.

**Diseño de referencia:** `docs/superpowers/specs/2026-11-17-rediseno-web-design.md`

## Restricciones globales

- Valores claros idénticos a `apps/mobile/src/theme.ts`: primary `#047857`, background
  `#f5f7f6`, card `#ffffff`, surface `#eef1ef`, border `#dfe4e1`, input-border `#8a93a0`,
  text `#111827`, muted `#5b6472`, subtle `#6b7280`, danger `#b91c1c`.
- Estados del filtro: apto `#047857`, no apto `#b91c1c` y sin datos `#5b6472`, los tres
  con texto blanco; trazas `#fbbf24` con texto `#18181b`. Siempre con símbolo y texto.
- Contraste WCAG AA: 4,5:1 para el texto y 3:1 para los bordes de los controles, en claro
  y en oscuro.
- No cambiar el nombre accesible de ningún control: los e2e buscan por rol y nombre.
- No tocar el PDF (`lib/pdf/allergen-table.tsx`) ni los textos de los avisos legales.
- Ninguna clase de color de Tailwind suelta (`zinc-*`, `emerald-*`…) en las páginas
  rediseñadas: solo variables.

## Puntos de revisión

1. **Modo oscuro:** cada pantalla debe leerse bien. Lo vigila el test de contraste de
   variables (Tarea 1) y la revisión visual de cada fase.
2. **Teclado:** el foco debe verse en todos los controles. Anillo `focus-visible` en las
   piezas (Tarea 2).
3. **Móvil a 375 px:** sin desplazamiento horizontal y con la barra inferior sin tapar
   contenido. Lo vigila un test e2e de la Tarea 3.
4. **Ficha del mapa** en modo oscuro: se lee bien. Revisión en la fase 3.
5. **Impresión del QR y de la carta:** no debe salir con fondo oscuro. Regla `@media print`
   en la Tarea 1.

---

### Tarea 1: Variables de color, letra Inter y prueba de contraste

**Archivos:** modificar `src/app/globals.css` y `src/app/layout.tsx`; crear
`e2e/theme.spec.ts`.

**Produce:** las clases de Tailwind `bg-background`, `bg-card`, `bg-surface`, `text-fg`,
`text-muted`, `text-subtle`, `border-line`, `border-input`, `bg-primary`, `text-primary`
(en el oscuro, el verde claro para texto), `bg-primary-soft`, `text-on-primary`,
`bg-danger`, `text-danger`, `bg-danger-soft`, `bg-status-{apto,no-apto,trazas,sin-datos}`
y la fuente `font-sans` (Inter).

- [ ] Test `e2e/theme.spec.ts`: con `colorScheme` claro y oscuro, lee las variables
      calculadas en `/` y comprueba el contraste mínimo de cada pareja (texto/fondo,
      texto/tarjeta, apagado/tarjeta, blanco/primary, primary-texto/fondo, borde de
      control/tarjeta ≥ 3, cada estado con su texto). Comprueba también que la fuente del
      `body` incluye «Inter».
- [ ] Ejecutarlo y comprobar que falla, porque las variables no existen y la fuente es Arial.
- [ ] Implementar las variables en claro y oscuro, `@theme inline`, Inter con
      `next/font/google`, la regla `@media print` en claro y `.safebite-popup` con variables.
- [ ] El test pasa en los dos modos.
- [ ] Commit.

### Tarea 2: Piezas comunes

**Archivos:** modificar `components/ui/button.tsx`, `components/ui/field.tsx`,
`components/ui/alert.tsx` y `components/status-badge.tsx`; crear `components/ui/card.tsx`
(`Card`, `SectionHeader`, `ListItem`, `IconBadge`, `Chip`, `EmptyState`, `Skeleton`) y
`components/ui/icon.tsx` (`Icon` y `IconName`). Dependencia nueva: `react-icons`.

**Produce:**

- `Button`/`ButtonLink` y `buttonClasses(variant, extra)`, con las mismas props y
  `icon?: IconName` opcional.
- `Card({children, className?, as?})`.
- `ListItem({href?, icon?, title, subtitle?})`.
- `Chip({children, selected?})`.
- `EmptyState({icon, title, text?, action?})`.
- `Skeleton({className?})`.

- [ ] Rediseñar las piezas existentes sin cambiar sus props ni sus roles, y crear las
      nuevas. Todas usan solo variables y anillo de foco verde.
- [ ] `pnpm lint`, `pnpm --filter @safebite/web typecheck` y `pnpm test:e2e`: todo pasa.
- [ ] Commit.

### Tarea 3: Cabeceras y navegación (fase 2)

- **Comensal:** cabecera con iconos y `aria-current`; en móvil, barra inferior.
- **Panel y admin:** cabecera con su menú.
- **Portada y acceso:** cabecera con degradado.

Test e2e: a 375 px, la barra inferior se ve, el contenido no queda tapado y no hay
desplazamiento horizontal.

### Tareas 4 a 8: Páginas (fase 3)

Comensal → carta `/r/[slug]` y `menu-view` → panel → admin → portada, acceso y páginas
legales. Un commit por grupo, con lint, typecheck y e2e pasando.

### Tarea 9: Repaso (fase 4)

Contraste en las dos modalidades sobre las páginas reales, foco con teclado, búsqueda de
clases de color sueltas (`grep "zinc-\|emerald-"` sin resultados en `src/app` y
`src/components`) y la suite completa.
