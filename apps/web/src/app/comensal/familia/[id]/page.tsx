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
      <Link
        href="/comensal/familia"
        className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
      >
        {t.family.back}
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">{member.name}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t.family.allergiesOf(member.name)}</h2>
        <AllergiesForm
          action={saveFamilyMemberAllergens.bind(null, member.id)}
          initial={member.allergens}
          label={t.family.allergiesOf(member.name)}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold">{t.family.renameTitle}</h2>
        <RenameMemberForm action={renameFamilyMember.bind(null, member.id)} name={member.name} />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-card ring-1 ring-danger/30">
        <h2 className="text-lg font-semibold">{t.family.deleteTitle}</h2>
        <p className="text-sm text-muted">{t.family.deleteMessage}</p>
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
