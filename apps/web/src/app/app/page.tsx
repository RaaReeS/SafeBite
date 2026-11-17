import type { Metadata } from "next";
import { getMessages } from "@/i18n";
import { BackButton } from "./back-button";

export const metadata: Metadata = { title: getMessages().appPromo.pageMetaTitle };

// Destino del botón "Guarda tu perfil: descarga SafeBite" de la carta pública
// mientras la app no está publicada (fase 6).
export default function AppPage() {
  const t = getMessages();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{t.appPromo.pageTitle}</h1>
      <p className="text-lg font-semibold text-primary-text">{t.appPromo.soon}</p>
      <p className="text-muted">{t.appPromo.pageText}</p>
      <p className="text-sm text-muted">{t.appPromo.privacy}</p>
      <div>
        <BackButton label={t.appPromo.back} />
      </div>
    </main>
  );
}
