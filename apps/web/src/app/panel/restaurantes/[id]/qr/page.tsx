import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { getMyRestaurant } from "@/lib/data/restaurants";
import { menuUrl } from "@/lib/qr";

export const metadata: Metadata = { title: "Código QR · SafeBite" };

export default async function QrPage({ params }: PageProps<"/panel/restaurantes/[id]/qr">) {
  const t = getMessages();
  const { id } = await params;
  const restaurant = await getMyRestaurant(id);
  const base = `/panel/restaurantes/${restaurant.id}/qr`;
  const url = menuUrl(restaurant.slug);

  return (
    <>
      <Link
        href={`/panel/restaurantes/${restaurant.id}`}
        className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
      >
        {t.qr.backToRestaurant}
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.qr.title}</h1>
        <p className="text-sm text-muted">{restaurant.name}</p>
      </div>
      <p className="text-muted">{t.qr.description}</p>
      {restaurant.published ? null : <Alert tone="warning">{t.qr.notPublished}</Alert>}
      {restaurant.published && restaurant.verification_status !== "verified" ? (
        <Alert tone="warning">{t.verification.notVisibleYet}</Alert>
      ) : null}

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- PNG generado por un Route Handler privado. */}
        <img
          src={`${base}/png?vista`}
          alt={t.qr.imageAlt(restaurant.name)}
          width={240}
          height={240}
          className="rounded-2xl bg-card shadow-card"
        />
        <div className="flex flex-col gap-3">
          <p className="text-sm">
            {t.qr.opens} <span className="font-mono break-all">{url}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={`${base}/pdf`} download className={buttonClasses("primary")}>
              {t.qr.downloadPdf}
            </a>
            <a href={`${base}/png`} download className={buttonClasses("secondary")}>
              {t.qr.downloadPng}
            </a>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted">{t.qr.slugWarning}</p>
    </>
  );
}
