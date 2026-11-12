import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { hasAdminSecondFactor, requireAdminAccount } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTwoFactorMethod, type TwoFactorMethod } from "@/lib/two-factor";
import { signOut } from "@/app/(auth)/actions";
import {
  confirmEnrollment,
  requestEmailCode,
  startEnrollment,
  verifyCode,
  verifyEmailCode,
} from "./actions";
import { CodeForm, EmailCodeFlow, EnrollFlow } from "./two-factor-forms";

export const metadata: Metadata = { title: "Verificación en dos pasos · SafeBite" };

export default function TwoFactorPage({ searchParams }: PageProps<"/admin/dos-pasos">) {
  const t = getMessages();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">{t.admin.twoFactor.title}</h1>
      <Suspense fallback={<p>{t.common.loading}</p>}>
        <TwoFactorStep searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function TwoFactorStep({
  searchParams,
}: {
  searchParams: PageProps<"/admin/dos-pasos">["searchParams"];
}) {
  const t = getMessages();
  const user = await requireAdminAccount();
  if (await hasAdminSecondFactor()) redirect("/admin/restaurantes");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  // Si no se puede saber si ya tiene autenticador, no se ofrece el alta (Supabase
  // tampoco la permitiría sin el segundo paso): se pide reintentar.
  if (error || data === null) {
    return <Alert tone="error">{t.admin.twoFactor.loadError}</Alert>;
  }
  const hasAuthenticator = data.totp.length > 0;
  const method: TwoFactorMethod | null =
    parseTwoFactorMethod((await searchParams).metodo) ?? (hasAuthenticator ? "app" : null);

  return (
    <>
      <p className="text-zinc-700 dark:text-zinc-300">{t.admin.twoFactor.why}</p>

      <nav aria-label={t.admin.twoFactor.methodLabel} className="flex flex-wrap gap-2">
        {(["app", "email"] as const).map((option) => (
          <Link
            key={option}
            href={`/admin/dos-pasos?metodo=${option}`}
            aria-current={option === method ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${
              option === method
                ? "border-emerald-700 bg-emerald-700 text-white"
                : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            }`}
          >
            {t.admin.twoFactor.methods[option]}
          </Link>
        ))}
      </nav>

      {method === null ? (
        <p className="text-zinc-700 dark:text-zinc-300">{t.admin.twoFactor.chooseMethod}</p>
      ) : null}
      {method === "app" ? (
        hasAuthenticator ? (
          <CodeForm action={verifyCode} />
        ) : (
          <EnrollFlow start={startEnrollment} confirm={confirmEnrollment} />
        )
      ) : null}
      {method === "email" ? (
        <>
          <EmailCodeFlow
            email={user.email ?? ""}
            request={requestEmailCode}
            verify={verifyEmailCode}
          />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t.admin.twoFactor.emailWarning}
          </p>
        </>
      ) : null}

      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.admin.twoFactor.lostDevice}</p>
      <form action={signOut}>
        <Button type="submit" variant="secondary">
          {t.auth.logout}
        </Button>
      </form>
    </>
  );
}
