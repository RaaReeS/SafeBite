import type { Metadata } from "next";
import Link from "next/link";
import { getMessages } from "@/i18n";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Recuperar contraseña · SafeBite" };

export default function ForgotPasswordPage() {
  const t = getMessages();

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t.auth.forgot.title}</h1>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{t.auth.forgot.description}</p>
      </div>
      <ForgotForm />
      <Link href="/login" className="text-sm underline">
        {t.auth.forgot.back}
      </Link>
    </>
  );
}
