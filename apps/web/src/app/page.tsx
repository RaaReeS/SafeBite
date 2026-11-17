import { Suspense } from "react";
import { DeletedNotice } from "@/components/deleted-notice";
import { ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/i18n";

export default function Home() {
  const t = getMessages();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <Suspense fallback={null}>
        <DeletedNotice />
      </Suspense>
      <p className="text-sm font-semibold text-primary-text">
        {t.common.appName} {t.common.forRestaurants}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">{t.home.title}</h1>
      <p className="text-muted">{t.home.description}</p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/registro">{t.home.register}</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          {t.home.login}
        </ButtonLink>
      </div>
      <section className="flex flex-col gap-2 rounded-2xl bg-card p-5 shadow-card">
        <h2 className="font-semibold">{t.home.dinerTitle}</h2>
        <p className="text-sm text-muted">{t.home.dinerDescription}</p>
        <div>
          <ButtonLink href="/registro" variant="secondary">
            {t.home.dinerRegister}
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
