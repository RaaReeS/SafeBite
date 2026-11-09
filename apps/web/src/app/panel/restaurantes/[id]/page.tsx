import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PublishedBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
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
      <Link href="/panel" className="text-sm underline">
        {t.panel.backToList}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
        <PublishedBadge published={restaurant.published} />
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">{t.restaurant.publication}</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {restaurant.published ? t.restaurant.publishedInfo : t.restaurant.draftInfo}
        </p>
        <form action={setRestaurantPublished.bind(null, restaurant.id, !restaurant.published)}>
          <Button type="submit" variant={restaurant.published ? "secondary" : "primary"}>
            {restaurant.published ? t.restaurant.unpublish : t.restaurant.publish}
          </Button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t.restaurant.details}</h2>
        <RestaurantForm
          action={updateRestaurant.bind(null, restaurant.id)}
          siteUrl={env.siteUrl}
          initial={restaurant}
          published={restaurant.published}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-red-200 p-4 dark:border-red-900">
        <h2 className="text-lg font-semibold">{t.restaurant.dangerZone}</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{t.restaurant.deleteDescription}</p>
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
