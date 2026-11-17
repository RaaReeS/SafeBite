import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getMessages } from "@/i18n";
import { getMyFamilyMember } from "@/lib/data/family";
import { AllergiesForm } from "../../alergias/health-forms";
import { deleteFamilyMember, renameFamilyMember, saveFamilyMemberAllergens } from "../actions";
import { RenameMemberForm } from "../family-forms";

export const metadata: Metadata = { title: "Familiar · SafeBite" };

export default async function FamilyMemberPage({ params }: PageProps<"/comensal/familia/[id]">) {
  const t = getMessages();
  const { id } = await params;
  const member = await getMyFamilyMember(id);

  return (
    <>
      <Link href="/comensal/familia" className="text-sm underline">
        {t.family.back}
      </Link>
      <h1 className="text-2xl font-semibold">{member.name}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t.family.allergiesOf(member.name)}</h2>
        <AllergiesForm
          action={saveFamilyMemberAllergens.bind(null, member.id)}
          initial={member.allergens}
          label={t.family.allergiesOf(member.name)}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">{t.family.renameTitle}</h2>
        <RenameMemberForm action={renameFamilyMember.bind(null, member.id)} name={member.name} />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-red-200 p-4 dark:border-red-900">
        <h2 className="text-lg font-semibold">{t.family.deleteTitle}</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{t.family.deleteMessage}</p>
        <div>
          <ConfirmDialog
            trigger={t.family.delete}
            title={t.family.deleteConfirmTitle(member.name)}
            confirmLabel={t.family.delete}
            cancelLabel={t.diner.account.cancel}
            action={deleteFamilyMember.bind(null, member.id)}
          >
            <p>{t.family.deleteMessage}</p>
          </ConfirmDialog>
        </div>
      </section>
    </>
  );
}
