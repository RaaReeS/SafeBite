import { centsToPriceInput } from "@safebite/core";
import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getMessages } from "@/i18n";
import { getMyDish, listMyCategories } from "@/lib/data/dishes";
import { deleteDish, updateDish } from "../actions";
import { DishForm } from "../dish-form";

export const metadata: Metadata = { title: "Plato · SafeBite" };

export default async function DishPage({
  params,
}: PageProps<"/panel/restaurantes/[id]/platos/[dishId]">) {
  const t = getMessages();
  const { id, dishId } = await params;
  const { restaurant, dish } = await getMyDish(id, dishId);
  const categories = await listMyCategories(restaurant.id);

  return (
    <>
      <Link href={`/panel/restaurantes/${restaurant.id}/platos`} className="text-sm underline">
        {t.dishes.backToDishes}
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{dish.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{restaurant.name}</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t.dishes.details}</h2>
        <DishForm
          action={updateDish.bind(null, restaurant.id, dish.id)}
          categories={categories}
          initial={{
            name: dish.name,
            description: dish.description ?? "",
            price: dish.price_cents === null ? "" : centsToPriceInput(dish.price_cents),
            category: dish.category ?? "",
            ingredients: dish.ingredients ?? "",
            is_active: dish.is_active,
          }}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-red-200 p-4 dark:border-red-900">
        <h2 className="text-lg font-semibold">{t.dishes.delete}</h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{t.dishes.deleteDescription}</p>
        <div>
          <ConfirmDialog
            trigger={t.dishes.delete}
            title={t.dishes.deleteConfirmTitle}
            confirmLabel={t.dishes.deleteConfirm}
            cancelLabel={t.restaurant.cancel}
            action={deleteDish.bind(null, restaurant.id, dish.id)}
          >
            {t.dishes.deleteDescription}
          </ConfirmDialog>
        </div>
      </section>
    </>
  );
}
