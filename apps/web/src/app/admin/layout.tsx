import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../(auth)/actions";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const t = getMessages();

  return (
    <Suspense fallback={<p className="px-4 py-8">{t.common.loading}</p>}>
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
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/admin/solicitudes"
            className="font-semibold text-emerald-700 dark:text-emerald-400"
          >
            {t.common.appName} · {t.admin.label}
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-600 sm:inline dark:text-zinc-400">{user.email}</span>
            <form action={signOut}>
              <Button type="submit" variant="secondary">
                {t.auth.logout}
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <Suspense fallback={<p>{t.common.loading}</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
