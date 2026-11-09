import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/i18n";

export const metadata: Metadata = { title: "Cuenta confirmada · SafeBite" };

// Destino de los comensales que abren el enlace del email en el navegador en
// lugar de escribir el código en la app.
export default function AccountConfirmedPage({ searchParams }: PageProps<"/cuenta-confirmada">) {
  const t = getMessages();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <Suspense fallback={<p>{t.common.loading}</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Content({ searchParams }: Pick<PageProps<"/cuenta-confirmada">, "searchParams">) {
  const t = getMessages();
  const { motivo } = await searchParams;
  const password = motivo === "contrasena";
  return (
    <>
      <h1 className="text-2xl font-semibold">
        {password ? t.accountConfirmed.passwordTitle : t.accountConfirmed.title}
      </h1>
      <p className="text-zinc-700 dark:text-zinc-300">{t.accountConfirmed.backToApp}</p>
    </>
  );
}
