import type { Metadata } from "next";
import { getMessages } from "@/i18n";
import { requireDiner } from "@/lib/auth";
import { getPeopleIfDiner } from "@/lib/data/health-profile";
import { listPublicMenus, listPublishedRestaurants } from "@/lib/data/published-restaurants";
import { RestaurantFinder } from "./restaurant-finder";

export const metadata: Metadata = { title: "Restaurantes · SafeBite" };

export default async function RestaurantsPage() {
  const t = getMessages();
  await requireDiner();
  const [restaurants, diner, menus] = await Promise.all([
    listPublishedRestaurants(),
    getPeopleIfDiner(),
    listPublicMenus(),
  ]);

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.diner.search.title}</h1>
      <RestaurantFinder
        restaurants={restaurants}
        people={diner?.consentGiven ? diner.people : null}
        menus={menus}
      />
    </>
  );
}
