import type { Metadata } from "next";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { getMessages } from "@/i18n";
import { requireDiner } from "@/lib/auth";
import { getMyHealthProfile } from "@/lib/data/health-profile";
import { deleteMyAccount, withdrawHealthConsent } from "../actions";

export const metadata: Metadata = { title: "Mi cuenta · SafeBite" };

export default async function DinerAccountPage({ searchParams }: PageProps<"/comensal/cuenta">) {
  const t = getMessages();
  const user = await requireDiner();
  const profile = await getMyHealthProfile();
  const { aviso } = await searchParams;

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.diner.account.title}</h1>
      {aviso === "retirado" ? <Alert tone="success">{t.diner.account.withdrawn}</Alert> : null}
      <p className="text-zinc-700 dark:text-zinc-300">
        {t.diner.account.signedInAs(user.email ?? "")}
      </p>

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">{t.diner.account.healthTitle}</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {profile.consentGivenAt === null
            ? t.diner.account.consentNotGiven
            : t.diner.account.consentGiven}
        </p>
        {profile.consentGivenAt === null ? null : (
          <div>
            <ConfirmDialog
              trigger={t.diner.account.withdraw}
              title={t.diner.account.withdrawTitle}
              confirmLabel={t.diner.account.withdrawConfirm}
              cancelLabel={t.diner.account.cancel}
              action={withdrawHealthConsent}
            >
              <p>{t.diner.account.withdrawMessage}</p>
            </ConfirmDialog>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-red-200 p-4 dark:border-red-900">
        <h2 className="text-lg font-semibold">{t.diner.account.deleteTitle}</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{t.diner.account.deleteMessage}</p>
        <div>
          <ConfirmDialog
            trigger={t.diner.account.delete}
            title={t.diner.account.deleteConfirmTitle}
            confirmLabel={t.diner.account.deleteConfirm}
            cancelLabel={t.diner.account.cancel}
            action={deleteMyAccount}
          >
            <p>{t.diner.account.deleteMessage}</p>
          </ConfirmDialog>
        </div>
      </section>
    </>
  );
}
