import { ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/i18n";

export default function Home() {
  const t = getMessages();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
        {t.common.appName} {t.common.forRestaurants}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">{t.home.title}</h1>
      <p className="text-zinc-700 dark:text-zinc-300">{t.home.description}</p>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/registro">{t.home.register}</ButtonLink>
        <ButtonLink href="/login" variant="secondary">
          {t.home.login}
        </ButtonLink>
      </div>
    </main>
  );
}
