import type { Metadata } from "next";
import { getMessages } from "@/i18n";
import { requireDiner } from "@/lib/auth";
import { getMyHealthProfile } from "@/lib/data/health-profile";
import {
  listPublishedRestaurants,
  suitabilityByRestaurant,
} from "@/lib/data/published-restaurants";
import { RestaurantFinder } from "./restaurant-finder";

export const metadata: Metadata = { title: "Restaurantes · SafeBite" };

export default async function RestaurantsPage() {
  const t = getMessages();
  await requireDiner();
  const [restaurants, profile] = await Promise.all([
    listPublishedRestaurants(),
    getMyHealthProfile(),
  ]);
  // Sin alergias guardadas no hay nada que evaluar: se muestran todos, sin semáforo.
  const allergens = profile.consentGivenAt === null ? [] : profile.allergens;
  const suitability = allergens.length === 0 ? null : await suitabilityByRestaurant(allergens);

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.diner.search.title}</h1>
      <RestaurantFinder restaurants={restaurants} suitability={suitability} />
    </>
  );
}
