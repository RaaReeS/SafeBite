import { Suspense, type ReactNode } from "react";
import { AppShell, PageSkeleton } from "@/components/app-shell/app-shell";
import { getMessages } from "@/i18n";
import { requireRestaurantOwner } from "@/lib/auth";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton padded />}>
      <PanelShell>{children}</PanelShell>
    </Suspense>
  );
}

/**
 * Barrera única del panel: no se pinta nada (ni la cabecera ni la página)
 * hasta comprobar que la sesión es de un dueño de restaurante. Cada página y
 * cada Server Action vuelven a comprobarlo, y RLS es la última barrera.
 */
async function PanelShell({ children }: { children: ReactNode }) {
  const t = getMessages();
  const user = await requireRestaurantOwner();

  return (
    <AppShell homeHref="/panel" area={t.panel.area} email={user.email} width="max-w-4xl">
      {children}
    </AppShell>
  );
}
