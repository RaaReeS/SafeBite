import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/env";
import { getMessages } from "@/i18n";
import { requireRestaurantOwner } from "@/lib/auth";
import { createRestaurant } from "../actions";
import { RestaurantForm } from "../restaurant-form";

export const metadata: Metadata = { title: "Nuevo restaurante · SafeBite" };

export default async function NewRestaurantPage() {
  const t = getMessages();
  await requireRestaurantOwner();

  return (
    <>
      <Link
        href="/panel"
        className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
      >
        {t.panel.backToList}
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">{t.restaurant.newTitle}</h1>
      <RestaurantForm action={createRestaurant} siteUrl={env.siteUrl} />
    </>
  );
}
