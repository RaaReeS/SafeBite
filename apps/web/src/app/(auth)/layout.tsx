import type { ReactNode } from "react";
import { Logo } from "@/components/app-shell/app-shell";
import { AppearanceMenu } from "@/components/appearance-menu";
import { getMessages } from "@/i18n";

/**
 * Acceso, registro y recuperación: franja verde con el logotipo (como la
 * bienvenida de la app) y el formulario en una tarjeta.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  const t = getMessages();

  return (
    <div className="flex flex-1 flex-col">
      <div className="bg-gradient-to-br from-primary to-primary-dark px-4 pt-10 pb-24 text-on-primary">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="w-fit rounded-full bg-card px-3 py-1 text-fg">
              <Logo href="/" />
            </div>
            <AppearanceMenu onDark />
          </div>
          <p className="text-sm text-on-primary/90">{t.common.tagline}</p>
        </div>
      </div>
      <main className="mx-auto -mt-16 flex w-full max-w-md flex-1 flex-col gap-6 px-4 pb-12">
        <div className="flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-raised">{children}</div>
      </main>
    </div>
  );
}
