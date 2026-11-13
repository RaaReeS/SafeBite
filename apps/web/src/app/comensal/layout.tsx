import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { requireDiner } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";

export default function DinerLayout({ children }: { children: ReactNode }) {
  const t = getMessages();

  return (
    <Suspense fallback={<p className="px-4 py-8">{t.common.loading}</p>}>
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

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/comensal" className="font-semibold text-emerald-700 dark:text-emerald-400">
            {t.common.appName}
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
        <nav
          aria-label={t.diner.navLabel}
          className="mx-auto flex w-full max-w-5xl flex-wrap gap-4 px-4 pb-3 text-sm"
        >
          <Link href="/comensal" className="underline">
            {t.diner.nav.home}
          </Link>
        </nav>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        <Suspense fallback={<p>{t.common.loading}</p>}>{children}</Suspense>
      </main>
    </div>
  );
}
