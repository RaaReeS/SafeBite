import { ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/i18n";

export default function NotFound() {
  const t = getMessages();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t.notFound.title}</h1>
      <p className="text-muted">{t.notFound.description}</p>
      <div>
        <ButtonLink href="/" variant="secondary">
          {t.notFound.back}
        </ButtonLink>
      </div>
    </main>
  );
}
