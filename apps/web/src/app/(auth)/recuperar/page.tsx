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
        <h1 className="text-3xl font-bold tracking-tight">{t.auth.forgot.title}</h1>
        <p className="text-sm text-muted">{t.auth.forgot.description}</p>
      </div>
      <ForgotForm />
      <Link
        href="/login"
        className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
      >
        {t.auth.forgot.back}
      </Link>
    </>
  );
}
