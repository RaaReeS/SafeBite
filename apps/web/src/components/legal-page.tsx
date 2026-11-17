import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/i18n";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  const t = getMessages();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <Alert tone="warning">{t.legal.draftNotice}</Alert>
      <div className="flex flex-col gap-4 leading-relaxed [&_h2]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
      <div>
        <ButtonLink href="/" variant="secondary">
          {t.legal.back}
        </ButtonLink>
      </div>
    </main>
  );
}
