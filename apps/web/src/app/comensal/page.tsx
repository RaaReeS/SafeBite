import { ALLERGEN_LABELS } from "@safebite/core";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { requireDiner } from "@/lib/auth";
import { getMyHealthProfile } from "@/lib/data/health-profile";

export const metadata: Metadata = { title: "Inicio · SafeBite" };

export default async function DinerHomePage({ searchParams }: PageProps<"/comensal">) {
  const t = getMessages();
  const user = await requireDiner();
  const profile = await getMyHealthProfile();
  const { aviso } = await searchParams;

  return (
    <>
      {aviso === "cuenta" ? <Alert tone="success">{t.diner.home.accountConfirmed}</Alert> : null}
      {aviso === "contrasena" ? <Alert tone="success">{t.diner.home.passwordChanged}</Alert> : null}
      <h1 className="text-2xl font-semibold">{t.diner.home.greeting(user.email ?? "")}</h1>
      <p className="text-zinc-700 dark:text-zinc-300">{t.diner.home.intro}</p>

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">{t.diner.home.allergiesTitle}</h2>
        {profile.consentGivenAt === null ? (
          <>
            <p className="text-zinc-700 dark:text-zinc-300">{t.diner.home.noConsent}</p>
            <div>
              <ButtonLink href="/comensal/alergias">{t.diner.home.configure}</ButtonLink>
            </div>
          </>
        ) : (
          <>
            <p className="text-zinc-700 dark:text-zinc-300">
              {profile.allergens.length === 0
                ? t.diner.home.noAllergies
                : t.diner.home.yourAllergies(
                    profile.allergens.map((a) => ALLERGEN_LABELS.es[a]).join(", "),
                  )}
            </p>
            <div>
              <ButtonLink href="/comensal/alergias" variant="secondary">
                {t.diner.home.edit}
              </ButtonLink>
            </div>
          </>
        )}
      </section>
    </>
  );
}
