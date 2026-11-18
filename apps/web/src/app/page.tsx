import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/app-shell/app-shell";
import { AppearanceMenu } from "@/components/appearance-menu";
import { DeletedNotice } from "@/components/deleted-notice";
import { ButtonLink } from "@/components/ui/button";
import { Card, IconBadge } from "@/components/ui/card";
import type { IconName } from "@/components/ui/icon";
import { getMessages } from "@/i18n";

const ON_GREEN_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-primary";

export default function Home() {
  const t = getMessages();
  const features: { icon: IconName; title: string; text: string }[] = [
    { icon: "qr", title: t.home.features.qrTitle, text: t.home.features.qrText },
    {
      icon: "shield-outline",
      title: t.home.features.allergensTitle,
      text: t.home.features.allergensText,
    },
    { icon: "document", title: t.home.features.tableTitle, text: t.home.features.tableText },
  ];

  return (
    <div className="flex flex-1 flex-col">
      {/* Cabecera verde, como la bienvenida de la app. */}
      <section className="bg-gradient-to-br from-primary to-primary-dark px-4 pt-6 pb-20 text-on-primary">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full bg-card px-3 py-1 text-fg">
              <Logo href="/" />
            </span>
            <div className="flex items-center gap-1">
              <AppearanceMenu onDark />
              <Link
                href="/login"
                className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold hover:bg-white/15 ${ON_GREEN_FOCUS}`}
              >
                {t.home.login}
              </Link>
            </div>
          </div>
          <div className="flex max-w-2xl flex-col gap-4">
            <p className="text-sm font-semibold text-on-primary/85">
              {t.common.appName} {t.common.forRestaurants}
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t.home.title}</h1>
            <p className="text-lg text-on-primary/90">{t.home.description}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/registro"
                className={`inline-flex min-h-12 items-center rounded-full bg-card px-6 font-semibold text-primary-strong shadow-raised hover:brightness-95 ${ON_GREEN_FOCUS}`}
              >
                {t.home.register}
              </Link>
              <Link
                href="/login"
                className={`inline-flex min-h-12 items-center rounded-full border border-white/60 px-6 font-semibold hover:bg-white/15 ${ON_GREEN_FOCUS}`}
              >
                {t.home.login}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto -mt-12 flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 pb-16">
        <Suspense fallback={null}>
          <DeletedNotice />
        </Suspense>

        <ul className="grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <Card as="li" key={feature.title}>
              <IconBadge icon={feature.icon} size="lg" />
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="text-sm text-muted">{feature.text}</p>
            </Card>
          ))}
        </ul>

        <Card as="section" className="sm:flex-row sm:items-center sm:gap-5">
          <IconBadge icon="people" size="lg" />
          <div className="flex flex-1 flex-col gap-1">
            <h2 className="text-lg font-semibold">{t.home.dinerTitle}</h2>
            <p className="text-sm text-muted">{t.home.dinerDescription}</p>
          </div>
          <ButtonLink href="/registro" variant="secondary" className="w-fit">
            {t.home.dinerRegister}
          </ButtonLink>
        </Card>

        <footer className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/privacidad" className="hover:underline">
            {t.home.privacy}
          </Link>
          <Link href="/terminos" className="hover:underline">
            {t.home.terms}
          </Link>
        </footer>
      </main>
    </div>
  );
}
