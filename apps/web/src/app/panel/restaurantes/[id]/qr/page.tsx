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
      <Link href={`/panel/restaurantes/${restaurant.id}`} className="text-sm underline">
        {t.qr.backToRestaurant}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{t.qr.title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{restaurant.name}</p>
      </div>
      <p className="text-zinc-700 dark:text-zinc-300">{t.qr.description}</p>
      {restaurant.published ? null : <Alert tone="warning">{t.qr.notPublished}</Alert>}

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- PNG generado por un Route Handler privado. */}
        <img
          src={`${base}/png?vista`}
          alt={t.qr.imageAlt(restaurant.name)}
          width={240}
          height={240}
          className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800"
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
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.qr.slugWarning}</p>
    </>
  );
}
