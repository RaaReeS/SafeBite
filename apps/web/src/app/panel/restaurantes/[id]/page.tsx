import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PublishedBadge } from "@/components/status-badge";
import { VerificationBadge, VerificationNotice } from "@/components/verification-status";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";
import { env } from "@/env";
import { isValidCoordinates } from "@safebite/core";
import { mapUrl } from "@/lib/geocoding";
import type { MyRestaurant } from "@/lib/data/restaurants";
import { getMessages } from "@/i18n";
import { getMyRestaurant } from "@/lib/data/restaurants";
import { deleteRestaurant, setRestaurantPublished, updateRestaurant } from "../actions";
import { RestaurantForm } from "../restaurant-form";

export const metadata: Metadata = { title: "Restaurante · SafeBite" };

export default async function RestaurantPage({ params }: PageProps<"/panel/restaurantes/[id]">) {
  const t = getMessages();
  const { id } = await params;
  const restaurant = await getMyRestaurant(id);

  return (
    <>
      <Link
        href="/panel"
        className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
      >
        {t.panel.backToList}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{restaurant.name}</h1>
        <PublishedBadge published={restaurant.published} />
        <VerificationBadge status={restaurant.verification_status} />
      </div>
      <VerificationNotice
        status={restaurant.verification_status}
        note={restaurant.verification_note}
      />
      <div className="flex flex-wrap gap-3">
        <ButtonLink href={`/panel/restaurantes/${restaurant.id}/platos`}>
          {t.dishes.manage}
        </ButtonLink>
        <ButtonLink href={`/panel/restaurantes/${restaurant.id}/qr`} variant="secondary">
          {t.qr.manage}
        </ButtonLink>
        <ButtonLink href={`/panel/restaurantes/${restaurant.id}/vista-previa`} variant="secondary">
          {t.preview.manage}
        </ButtonLink>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold">{t.allergenTable.title}</h2>
        <p className="text-sm text-muted">{t.allergenTable.description}</p>
        <div>
          {/* Enlace normal (no <Link>): es una descarga, no una página. */}
          <a
            href={`/panel/restaurantes/${restaurant.id}/alergenos/pdf`}
            download
            className={buttonClasses("secondary")}
          >
            {t.allergenTable.download}
          </a>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold">{t.restaurant.publication}</h2>
        <p className="text-sm text-muted">
          {restaurant.published ? t.restaurant.publishedInfo : t.restaurant.draftInfo}
        </p>
        <form action={setRestaurantPublished.bind(null, restaurant.id, !restaurant.published)}>
          <Button type="submit" variant={restaurant.published ? "secondary" : "primary"}>
            {restaurant.published ? t.restaurant.unpublish : t.restaurant.publish}
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold">{t.restaurant.location}</h2>
        <RestaurantLocation restaurant={restaurant} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t.restaurant.details}</h2>
        <RestaurantForm
          action={updateRestaurant.bind(null, restaurant.id)}
          siteUrl={env.siteUrl}
          initial={restaurant}
          published={restaurant.published}
          verified={restaurant.verification_status === "verified"}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-card ring-1 ring-danger/30">
        <h2 className="text-lg font-semibold">{t.restaurant.dangerZone}</h2>
        <p className="text-sm text-muted">{t.restaurant.deleteDescription}</p>
        <div>
          <ConfirmDialog
            trigger={t.restaurant.delete}
            title={t.restaurant.deleteConfirmTitle}
            confirmLabel={t.restaurant.deleteConfirm}
            cancelLabel={t.restaurant.cancel}
            action={deleteRestaurant.bind(null, restaurant.id)}
          >
            {t.restaurant.deleteDescription}
          </ConfirmDialog>
        </div>
      </section>
    </>
  );
}

function RestaurantLocation({ restaurant }: { restaurant: MyRestaurant }) {
  const t = getMessages();
  if (isValidCoordinates(restaurant)) {
    return (
      <>
        <p className="text-sm text-muted">{t.restaurant.locationFound}</p>
        <p className="text-sm">
          <a
            href={mapUrl(restaurant)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {t.restaurant.locationCheck}
          </a>
        </p>
        <p className="text-xs text-muted">{t.restaurant.locationAttribution}</p>
      </>
    );
  }
  return (
    <Alert tone="warning">
      {restaurant.address === null ? t.restaurant.locationMissing : t.restaurant.locationNotFound}
    </Alert>
  );
}
