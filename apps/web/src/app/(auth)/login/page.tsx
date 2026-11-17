import { safeRedirectPath } from "@safebite/core";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Alert } from "@/components/ui/alert";
import { getMessages } from "@/i18n";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · SafeBite" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  const t = getMessages();

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">{t.auth.login.title}</h1>
      <Suspense fallback={<p>{t.common.loading}</p>}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
      <div className="flex flex-col gap-2 text-sm">
        <Link href="/recuperar" className="font-semibold text-primary-text underline">
          {t.auth.login.forgot}
        </Link>
        <p>
          {t.auth.login.noAccount}{" "}
          <Link href="/registro" className="font-semibold text-primary-text underline">
            {t.auth.login.register}
          </Link>
        </p>
      </div>
    </>
  );
}

async function LoginContent({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const t = getMessages();
  const params = await searchParams;
  const next = safeRedirectPath(params.next);

  return (
    <>
      {params.error === "enlace" ? <Alert tone="error">{t.auth.login.invalidLink}</Alert> : null}
      <LoginForm next={next} />
    </>
  );
}
