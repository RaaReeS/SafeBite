import { ALLERGEN_LABELS } from "@safebite/core";
import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { getMyFamily } from "@/lib/data/family";
import { getMyHealthProfile } from "@/lib/data/health-profile";
import { addFamilyMember } from "./actions";
import { AddMemberForm } from "./family-forms";

export const metadata: Metadata = { title: "Mi familia · SafeBite" };

export default async function FamilyPage({ searchParams }: PageProps<"/comensal/familia">) {
  const t = getMessages();
  const [profile, family, { aviso }] = await Promise.all([
    getMyHealthProfile(),
    getMyFamily(),
    searchParams,
  ]);
  const canAdd = family.members.length < family.limit;

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{t.family.title}</h1>
        <p className="text-zinc-700 dark:text-zinc-300">{t.family.description}</p>
      </div>
      {aviso === "borrado" ? <Alert tone="success">{t.family.deleted}</Alert> : null}

      {profile.consentGivenAt === null ? (
        <Alert tone="info">
          {t.family.consentRequired}{" "}
          <Link href="/comensal/alergias" className="underline">
            {t.diner.home.configure}
          </Link>
        </Alert>
      ) : (
        <>
          {family.members.length === 0 ? (
            <p className="text-zinc-700 dark:text-zinc-300">{t.family.empty}</p>
          ) : (
            <ul
              aria-label={t.family.title}
              className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
            >
              {family.members.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="flex flex-col">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {member.allergens.length === 0
                        ? t.family.noAllergies
                        : member.allergens.map((a) => ALLERGEN_LABELS.es[a]).join(", ")}
                    </span>
                  </span>
                  <ButtonLink
                    href={`/comensal/familia/${member.id}`}
                    variant="secondary"
                    aria-label={t.family.editOf(member.name)}
                  >
                    {t.family.edit}
                  </ButtonLink>
                </li>
              ))}
            </ul>
          )}

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t.family.usage(family.members.length, family.limit)}
          </p>
          {canAdd ? (
            <AddMemberForm action={addFamilyMember} />
          ) : (
            <Alert tone="info">
              {family.plan === "premium" ? t.family.premiumFull : t.family.freeFull}
            </Alert>
          )}
        </>
      )}
    </>
  );
}
