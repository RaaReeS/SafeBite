"use client";

import {
  ALLERGENS,
  ALLERGEN_LABELS,
  FILTER_DISCLAIMER,
  FILTER_SOURCE_NOTICE,
  buildMenu,
  formatCents,
  type Allergen,
  type EvaluatedDish,
} from "@safebite/core";
import { getMessages } from "@/i18n";
import type { MenuDish, MenuRestaurant } from "@/lib/data/public-menu";

type MenuViewProps = {
  restaurant: MenuRestaurant;
  dishes: MenuDish[];
};

/**
 * Carta de un restaurante. La comparten la carta pública por QR (/r/[slug]) y
 * la vista previa del panel. La evaluación de cada plato viene de
 * @safebite/core (buildMenu): aquí solo se presenta.
 */
export function MenuView({ restaurant, dishes }: MenuViewProps) {
  const t = getMessages();
  // El selector de alergias llega en el siguiente paso; sin perfil no hay etiquetas.
  const profile: Allergen[] = [];
  const sections = buildMenu(dishes, profile);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {[restaurant.address, restaurant.city].filter(Boolean).join(" · ")}
        </p>
        {restaurant.phone ? (
          <a href={`tel:${restaurant.phone.replace(/[^+0-9]/g, "")}`} className="text-sm underline">
            {t.menu.call} {restaurant.phone}
          </a>
        ) : null}
      </header>

      <Notices />

      {sections.length === 0 ? (
        <p className="text-zinc-700 dark:text-zinc-300">{t.menu.empty}</p>
      ) : (
        sections.map((section) => (
          <section key={section.category ?? ""} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{section.category ?? t.menu.uncategorized}</h2>
            <ul className="flex flex-col gap-3">
              {section.dishes.map((item) => (
                <DishCard key={item.dish.id} item={item} />
              ))}
            </ul>
          </section>
        ))
      )}

      <footer className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <Notices />
        <p className="text-center text-xs text-zinc-500">{t.menu.poweredBy}</p>
      </footer>
    </div>
  );
}

/** Aviso obligatorio: siempre visible (regla crítica 5). */
function Notices() {
  return (
    <p className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
      {FILTER_SOURCE_NOTICE.es} <strong>{FILTER_DISCLAIMER.es}</strong>
    </p>
  );
}

function DishCard({ item }: { item: EvaluatedDish<MenuDish> }) {
  const t = getMessages();
  const { dish } = item;
  const labels = ALLERGEN_LABELS.es;

  // Lo que el establecimiento ha declarado (independiente del perfil del usuario).
  const levelOf = new Map(dish.allergens.map((d) => [d.allergen, d.level]));
  const contains = ALLERGENS.filter((a) => levelOf.get(a) === "contains");
  const traces = ALLERGENS.filter((a) => levelOf.get(a) === "may_contain");
  const undeclared = ALLERGENS.length - levelOf.size;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium">{dish.name}</h3>
        {dish.price_cents === null ? null : (
          <span className="shrink-0 font-medium">{formatCents(dish.price_cents)}</span>
        )}
      </div>
      {dish.description ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{dish.description}</p>
      ) : null}
      {dish.ingredients ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {t.menu.ingredients} {dish.ingredients}
        </p>
      ) : null}

      <div className="flex flex-col gap-1 text-sm">
        {levelOf.size === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">{t.menu.noDeclarations}</p>
        ) : (
          <>
            {contains.length > 0 ? (
              <p>
                <span className="font-medium">{t.menu.declaredContains}</span>{" "}
                {contains.map((a) => labels[a]).join(", ")}
              </p>
            ) : null}
            {traces.length > 0 ? (
              <p>
                <span className="font-medium">{t.menu.declaredTraces}</span>{" "}
                {traces.map((a) => labels[a]).join(", ")}
              </p>
            ) : null}
            {undeclared > 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">{t.menu.undeclared(undeclared)}</p>
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}
