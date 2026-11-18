import { centsToPriceInput } from "@safebite/core";
import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getMessages } from "@/i18n";
import { getMyDish, listMyCategories, listMyDishAllergens } from "@/lib/data/dishes";
import { deleteDish, saveDishAllergens, updateDish } from "../actions";
import { DishForm } from "../dish-form";
import { AllergenEditor } from "./allergen-editor";

export const metadata: Metadata = { title: "Plato · SafeBite" };

export default async function DishPage({
  params,
}: PageProps<"/panel/restaurantes/[id]/platos/[dishId]">) {
  const t = getMessages();
  const { id, dishId } = await params;
  const { restaurant, dish } = await getMyDish(id, dishId);
  const [categories, declarations] = await Promise.all([
    listMyCategories(restaurant.id),
    listMyDishAllergens(restaurant.id, dish.id),
  ]);

  return (
    <>
      <Link
        href={`/panel/restaurantes/${restaurant.id}/platos`}
        className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
      >
        {t.dishes.backToDishes}
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{dish.name}</h1>
        <p className="text-sm text-muted">{restaurant.name}</p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t.allergens.title}</h2>
          <p className="text-sm text-muted">{t.allergens.description}</p>
        </div>
        <AllergenEditor
          action={saveDishAllergens.bind(null, restaurant.id, dish.id)}
          declarations={declarations}
        />
      </section>

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

      <section className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-card ring-1 ring-danger/30">
        <h2 className="text-lg font-semibold">{t.dishes.delete}</h2>
        <p className="text-sm text-muted">{t.dishes.deleteDescription}</p>
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
