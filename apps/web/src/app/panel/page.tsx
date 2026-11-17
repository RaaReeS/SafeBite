import type { Metadata } from "next";
import Link from "next/link";
import { PublishedBadge } from "@/components/status-badge";
import { VerificationBadge } from "@/components/verification-status";
import { ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { listMyRestaurants } from "@/lib/data/restaurants";

export const metadata: Metadata = { title: "Mis restaurantes · SafeBite" };

export default async function PanelPage() {
  const t = getMessages();
  const restaurants = await listMyRestaurants();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t.panel.title}</h1>
        <ButtonLink href="/panel/restaurantes/nuevo">{t.panel.newRestaurant}</ButtonLink>
      </div>
      {restaurants.length === 0 ? (
        <p className="text-muted">{t.panel.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-2xl bg-card px-5 shadow-card">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <Link
                href={`/panel/restaurantes/${restaurant.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{restaurant.name}</span>
                  <span className="text-sm text-muted">{restaurant.city}</span>
                </span>
                <span className="flex flex-wrap justify-end gap-2">
                  <PublishedBadge published={restaurant.published} />
                  <VerificationBadge status={restaurant.verification_status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
