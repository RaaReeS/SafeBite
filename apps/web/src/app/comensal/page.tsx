import { ALLERGEN_LABELS } from "@safebite/core";
import type { Metadata } from "next";
import Link from "next/link";
import { AllergenIcon } from "@/components/menu/allergen-icon";
import { Alert } from "@/components/ui/alert";
import { IconBadge } from "@/components/ui/card";
import type { IconName } from "@/components/ui/icon";
import { getMessages } from "@/i18n";
import { requireDiner } from "@/lib/auth";
import { getMyFamily } from "@/lib/data/family";
import { getMyHealthProfile } from "@/lib/data/health-profile";

export const metadata: Metadata = { title: "Inicio · SafeBite" };

const HERO_LINK =
  "inline-flex min-h-11 w-fit items-center rounded-full bg-card px-5 text-sm font-semibold text-primary-strong shadow-card hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-card";

export default async function DinerHomePage({ searchParams }: PageProps<"/comensal">) {
  const t = getMessages();
  const user = await requireDiner();
  const profile = await getMyHealthProfile();
  const { aviso } = await searchParams;
  const consent = profile.consentGivenAt !== null;
  // Sin consentimiento no hay datos de salud, tampoco de la familia.
  const family = consent ? (await getMyFamily()).members : [];
  // El saludo usa la parte del email antes de la @ (no pedimos nombre).
  const name = (user.email ?? "").split("@")[0] ?? "";

  return (
    <>
      {aviso === "cuenta" ? <Alert tone="success">{t.diner.home.accountConfirmed}</Alert> : null}
      {aviso === "contrasena" ? <Alert tone="success">{t.diner.home.passwordChanged}</Alert> : null}

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t.diner.home.greeting(name)}</h1>
        <p className="text-muted">{t.diner.home.intro}</p>
      </div>

      {/* Tarjeta principal: alergias (y familia), como en la app. */}
      <section
        aria-labelledby="mis-alergias"
        className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-primary to-primary-dark p-6 text-on-primary shadow-raised"
      >
        <h2 id="mis-alergias" className="text-sm font-semibold text-on-primary/90">
          {t.diner.home.allergiesTitle}
        </h2>
        {!consent ? (
          <>
            <p className="text-lg font-medium">{t.diner.home.noConsent}</p>
            <Link href="/comensal/alergias" className={HERO_LINK}>
              {t.diner.home.configure}
            </Link>
          </>
        ) : (
          <>
            {profile.allergens.length === 0 ? (
              <p className="text-lg font-medium">{t.diner.home.noAllergies}</p>
            ) : (
              <ul
                aria-label={t.diner.home.yourAllergies(
                  profile.allergens.map((a) => ALLERGEN_LABELS.es[a]).join(", "),
                )}
                className="flex flex-wrap gap-2"
              >
                {profile.allergens.map((allergen) => (
                  <li
                    key={allergen}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium"
                  >
                    <AllergenIcon allergen={allergen} className="size-4" />
                    {ALLERGEN_LABELS.es[allergen]}
                  </li>
                ))}
              </ul>
            )}
            {family.length > 0 ? (
              <p className="text-sm text-on-primary/90">
                {t.diner.home.family(family.map((member) => member.name).join(", "))}
              </p>
            ) : null}
            <Link href="/comensal/alergias" className={HERO_LINK}>
              {t.diner.home.edit}
            </Link>
          </>
        )}
      </section>

      {/* Accesos rápidos. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <QuickAction
          href="/comensal/restaurantes"
          icon="restaurant"
          title={t.diner.search.open}
          hint={t.diner.home.quickSearchHint}
        />
        <QuickAction
          href="/comensal/familia"
          icon="people"
          title={t.diner.nav.family}
          hint={t.diner.home.quickFamilyHint}
        />
      </div>
    </>
  );
}

function QuickAction({
  href,
  icon,
  title,
  hint,
}: {
  href: string;
  icon: IconName;
  title: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
    >
      <IconBadge icon={icon} size="lg" />
      <span className="flex flex-col gap-0.5">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-muted">{hint}</span>
      </span>
    </Link>
  );
}
