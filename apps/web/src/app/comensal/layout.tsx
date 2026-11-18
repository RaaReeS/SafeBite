import { Suspense, type ReactNode } from "react";
import { AppShell, PageSkeleton } from "@/components/app-shell/app-shell";
import type { NavItem } from "@/components/app-shell/nav-links";
import { getMessages } from "@/i18n";
import { requireDiner } from "@/lib/auth";

export default function DinerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton padded />}>
      <DinerShell>{children}</DinerShell>
    </Suspense>
  );
}

/**
 * Barrera única del área del comensal: no se pinta nada hasta comprobar que la
 * sesión es de un comensal. Cada página y Server Action lo vuelve a comprobar,
 * y RLS es la última barrera (cada uno solo ve su propio perfil de alergias).
 */
async function DinerShell({ children }: { children: ReactNode }) {
  const t = getMessages();
  const user = await requireDiner();
  const nav: NavItem[] = [
    { href: "/comensal", label: t.diner.nav.home, icon: "home", exact: true },
    { href: "/comensal/restaurantes", label: t.diner.nav.restaurants, icon: "restaurant" },
    {
      href: "/comensal/alergias",
      label: t.diner.nav.allergies,
      shortLabel: t.diner.navShort.allergies,
      icon: "medical",
    },
    {
      href: "/comensal/familia",
      label: t.diner.nav.family,
      shortLabel: t.diner.navShort.family,
      icon: "people",
    },
    {
      href: "/comensal/cuenta",
      label: t.diner.nav.account,
      shortLabel: t.diner.navShort.account,
      icon: "person",
    },
  ];

  return (
    <AppShell
      homeHref="/comensal"
      email={user.email}
      nav={nav}
      navLabel={t.diner.navLabel}
      bottomNav
    >
      {children}
    </AppShell>
  );
}
