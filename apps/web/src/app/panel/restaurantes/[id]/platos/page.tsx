import { formatCents } from "@safebite/core";
import type { Metadata } from "next";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { listMyDishes } from "@/lib/data/dishes";
import { moveDish } from "./actions";

export const metadata: Metadata = { title: "Platos · SafeBite" };

export default async function DishesPage({ params }: PageProps<"/panel/restaurantes/[id]/platos">) {
  const t = getMessages();
  const { id } = await params;
  const { restaurant, dishes } = await listMyDishes(id);
  const base = `/panel/restaurantes/${restaurant.id}`;

  return (
    <>
      <Link href={base} className="text-sm underline">
        {t.dishes.backToRestaurant}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t.dishes.title}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {restaurant.name} · {t.dishes.count(dishes.length)}
          </p>
        </div>
        <ButtonLink href={`${base}/platos/nuevo`}>{t.dishes.newDish}</ButtonLink>
      </div>

      {dishes.length === 0 ? (
        <p className="text-zinc-700 dark:text-zinc-300">{t.dishes.empty}</p>
      ) : (
        <ol
          aria-label={t.dishes.title}
          className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
        >
          {dishes.map((dish, index) => (
            <li key={dish.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex flex-col">
                <form action={moveDish.bind(null, restaurant.id, dish.id, "up")}>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="px-2 py-0.5"
                    disabled={index === 0}
                    aria-label={t.dishes.moveUp(dish.name)}
                  >
                    ↑
                  </Button>
                </form>
                <form action={moveDish.bind(null, restaurant.id, dish.id, "down")}>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="px-2 py-0.5"
                    disabled={index === dishes.length - 1}
                    aria-label={t.dishes.moveDown(dish.name)}
                  >
                    ↓
                  </Button>
                </form>
              </div>
              <Link
                href={`${base}/platos/${dish.id}`}
                className="flex flex-1 flex-wrap items-center justify-between gap-2 hover:underline"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{dish.name}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {dish.category ?? t.dishes.noCategory}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-sm">
                  {dish.is_active ? null : (
                    <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {t.dishes.inactive}
                    </span>
                  )}
                  {dish.price_cents === null ? null : <span>{formatCents(dish.price_cents)}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
