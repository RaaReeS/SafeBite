import { ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/i18n";

export default function NotFound() {
  const t = getMessages();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t.notFound.title}</h1>
      <p className="text-zinc-700 dark:text-zinc-300">{t.notFound.description}</p>
      <div>
        <ButtonLink href="/" variant="secondary">
          {t.notFound.back}
        </ButtonLink>
      </div>
    </main>
  );
}
