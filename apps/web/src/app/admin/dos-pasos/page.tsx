import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { requireAdminAccount } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { confirmEnrollment, startEnrollment, verifyCode } from "./actions";
import { CodeForm, EnrollFlow } from "./two-factor-forms";

export const metadata: Metadata = { title: "Verificación en dos pasos · SafeBite" };

export default function TwoFactorPage() {
  const t = getMessages();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-12">
      <h1 className="text-2xl font-semibold">{t.admin.twoFactor.title}</h1>
      <Suspense fallback={<p>{t.common.loading}</p>}>
        <TwoFactorStep />
      </Suspense>
    </main>
  );
}

async function TwoFactorStep() {
  const t = getMessages();
  const user = await requireAdminAccount();
  if (user.aal === "aal2") redirect("/admin/restaurantes");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  // Si no se puede saber si ya tiene autenticador, no se ofrece el alta (Supabase
  // tampoco la permitiría sin el segundo paso): se pide reintentar.
  if (error || data === null) {
    return <Alert tone="error">{t.admin.twoFactor.loadError}</Alert>;
  }
  const hasAuthenticator = data.totp.length > 0;

  return (
    <>
      <p className="text-zinc-700 dark:text-zinc-300">{t.admin.twoFactor.why}</p>
      {hasAuthenticator ? (
        <CodeForm action={verifyCode} />
      ) : (
        <EnrollFlow start={startEnrollment} confirm={confirmEnrollment} />
      )}
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.admin.twoFactor.lostDevice}</p>
      <form action={signOut}>
        <Button type="submit" variant="secondary">
          {t.auth.logout}
        </Button>
      </form>
    </>
  );
}
