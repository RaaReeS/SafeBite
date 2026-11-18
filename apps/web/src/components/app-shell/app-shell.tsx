import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { signOut } from "@/app/(auth)/actions";
import { BottomNav, NavLinks, type NavItem } from "@/components/app-shell/nav-links";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { getMessages } from "@/i18n";

/** Logotipo: escudo en un círculo verde y el nombre (con el área, si la hay). */
export function Logo({ href, area }: { href: string; area?: string }) {
  const t = getMessages();
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-full font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
    >
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-on-primary shadow-card">
        <Icon name="shield" className="size-5" />
      </span>
      <span className="text-lg tracking-tight">{t.common.appName}</span>
      {area ? <span className="text-sm font-medium text-muted">· {area}</span> : null}
    </Link>
  );
}

/**
 * Estructura común de las áreas con sesión (comensal, panel y admin): cabecera
 * con logotipo, menú, email y cerrar sesión; en el móvil, opcionalmente, una
 * barra inferior como la de la app.
 */
export function AppShell({
  homeHref,
  area,
  email,
  nav,
  navLabel,
  bottomNav = false,
  width = "max-w-5xl",
  children,
}: {
  homeHref: string;
  area?: string;
  email: string | null;
  nav?: NavItem[];
  navLabel?: string;
  /** En el móvil, el menú va en una barra inferior en lugar de la cabecera. */
  bottomNav?: boolean;
  width?: "max-w-4xl" | "max-w-5xl";
  children: ReactNode;
}) {
  const t = getMessages();
  const hasNav = nav !== undefined && nav.length > 0 && navLabel !== undefined;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-card/90 backdrop-blur print:static print:hidden">
        <div
          className={`mx-auto flex w-full ${width} items-center justify-between gap-4 px-4 py-2`}
        >
          <Logo href={homeHref} area={area} />
          <div className="flex items-center gap-3 text-sm">
            {email ? <span className="hidden text-muted sm:inline">{email}</span> : null}
            <form action={signOut}>
              <Button type="submit" variant="secondary" icon="logout">
                {t.auth.logout}
              </Button>
            </form>
          </div>
        </div>
        {hasNav ? (
          <NavLinks
            items={nav}
            label={navLabel}
            className={`mx-auto w-full ${width} px-4 pb-2 ${bottomNav ? "hidden md:block" : ""}`}
          />
        ) : null}
      </header>
      <main
        className={`mx-auto flex w-full ${width} flex-1 flex-col gap-6 px-4 py-8 ${
          bottomNav ? "pb-28 md:pb-8" : ""
        }`}
      >
        <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
      </main>
      {hasNav && bottomNav ? <BottomNav items={nav} label={navLabel} /> : null}
    </div>
  );
}

/**
 * Lo que se ve mientras carga una página: bloques que «laten». `padded`, fuera
 * de la estructura (mientras se comprueba la sesión), con sus márgenes.
 */
export function PageSkeleton({ padded = false }: { padded?: boolean }) {
  const t = getMessages();
  return (
    <div
      role="status"
      aria-label={t.common.loading}
      className={`flex flex-col gap-4 ${padded ? "mx-auto w-full max-w-5xl px-4 py-8" : ""}`}
    >
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </div>
  );
}
