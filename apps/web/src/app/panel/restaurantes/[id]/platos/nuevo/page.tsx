import type { Metadata } from "next";
import Link from "next/link";
import { getMessages } from "@/i18n";
import { getMyRestaurant } from "@/lib/data/restaurants";
import { listMyCategories } from "@/lib/data/dishes";
import { createDish } from "../actions";
import { DishForm } from "../dish-form";

export const metadata: Metadata = { title: "Nuevo plato · SafeBite" };

export default async function NewDishPage({
  params,
}: PageProps<"/panel/restaurantes/[id]/platos/nuevo">) {
  const t = getMessages();
  const { id } = await params;
  const restaurant = await getMyRestaurant(id);
  const categories = await listMyCategories(restaurant.id);

  return (
    <>
      <Link
        href={`/panel/restaurantes/${restaurant.id}/platos`}
        className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
      >
        {t.dishes.backToDishes}
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t.dishes.newTitle}</h1>
        <p className="text-sm text-muted">{restaurant.name}</p>
      </div>
      <DishForm action={createDish.bind(null, restaurant.id)} categories={categories} />
    </>
  );
}
