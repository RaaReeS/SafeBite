import type { Metadata } from "next";
import Link from "next/link";
import { getMessages } from "@/i18n";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta · SafeBite" };

export default function RegisterPage() {
  const t = getMessages();

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.auth.register.title}</h1>
        <p className="text-sm text-muted">{t.auth.register.description}</p>
      </div>
      <RegisterForm />
      <p className="text-sm">
        {t.auth.register.hasAccount}{" "}
        <Link href="/login" className="underline">
          {t.auth.register.login}
        </Link>
      </p>
    </>
  );
}
