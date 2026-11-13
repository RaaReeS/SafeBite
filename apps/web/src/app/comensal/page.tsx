import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { getMessages } from "@/i18n";
import { requireDiner } from "@/lib/auth";

export const metadata: Metadata = { title: "Inicio · SafeBite" };

export default async function DinerHomePage({ searchParams }: PageProps<"/comensal">) {
  const t = getMessages();
  const user = await requireDiner();
  const { aviso } = await searchParams;

  return (
    <>
      {aviso === "cuenta" ? <Alert tone="success">{t.diner.home.accountConfirmed}</Alert> : null}
      {aviso === "contrasena" ? <Alert tone="success">{t.diner.home.passwordChanged}</Alert> : null}
      <h1 className="text-2xl font-semibold">{t.diner.home.greeting(user.email ?? "")}</h1>
      <p className="text-zinc-700 dark:text-zinc-300">{t.diner.home.intro}</p>
    </>
  );
}
