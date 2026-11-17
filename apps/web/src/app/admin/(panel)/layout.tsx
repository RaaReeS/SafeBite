import { Suspense, type ReactNode } from "react";
import { AppShell, PageSkeleton } from "@/components/app-shell/app-shell";
import { getMessages } from "@/i18n";
import { requireAdmin } from "@/lib/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton padded />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

/**
 * Barrera única de /admin: no se pinta nada hasta comprobar que la sesión es de
 * un administrador. Cada página y cada Server Action vuelven a comprobarlo, y
 * las funciones de la base de datos también.
 */
async function AdminShell({ children }: { children: ReactNode }) {
  const t = getMessages();
  const user = await requireAdmin();

  return (
    <AppShell
      homeHref="/admin/solicitudes"
      area={t.admin.label}
      email={user.email}
      navLabel={t.admin.navLabel}
      nav={[
        { href: "/admin/restaurantes", label: t.admin.nav.restaurants, icon: "storefront" },
        { href: "/admin/solicitudes", label: t.admin.nav.requests, icon: "list" },
        { href: "/admin/planes", label: t.admin.nav.plans, icon: "star" },
      ]}
    >
      {children}
    </AppShell>
  );
}
