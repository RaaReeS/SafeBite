"use client";

import {
  ALLERGENS,
  ALLERGEN_LABELS,
  FILTER_DISCLAIMER,
  FILTER_EMPTY_PROFILE_HINT,
  FILTER_SOURCE_NOTICE,
  FILTER_STATUS_LABELS,
  buildMenu,
  combineProfiles,
  countByStatus,
  formatCents,
  type Allergen,
  type EvaluatedDish,
  type FilterStatus,
} from "@safebite/core";
import Link from "next/link";
import { Fragment, useId, useState } from "react";
import { getMessages } from "@/i18n";
import type { Person } from "@/lib/data/health-profile";
import type { MenuDish, MenuRestaurant } from "@/lib/data/public-menu";
import { AllergenIcon } from "./allergen-icon";

type MenuViewProps = {
  restaurant: MenuRestaurant;
  dishes: MenuDish[];
  /**
   * Comensal con sesión: las personas para las que filtra («Yo» y su familia).
   * null o ausente: visitante anónimo o vista previa del panel. Si las hay, la
   * carta parte de las alergias de todas (seleccionadas por defecto).
   */
  diner?: { consentGiven: boolean; people: Person[] } | null;
};

function sameAllergens(a: readonly Allergen[], b: readonly Allergen[]): boolean {
  return a.length === b.length && a.every((allergen) => b.includes(allergen));
}

/**
 * Carta de un restaurante. La comparten la carta pública por QR (/r/[slug]) y
 * la vista previa del panel. La evaluación de cada plato viene de
 * @safebite/core (buildMenu): aquí solo se presenta.
 *
 * Privacidad: las alergias seleccionadas viven solo en el estado de este
 * componente. No se guardan (ni URL, ni almacenamiento local) ni se envían.
 */
export function MenuView({ restaurant, dishes, diner = null }: MenuViewProps) {
  const t = getMessages();
  const people = diner?.consentGiven ? diner.people : null;
  // Por defecto, para todas las personas: un plato apto lo es para toda la familia.
  const [selected, setSelected] = useState<string[]>(() => people?.map((p) => p.id) ?? []);
  const profileFor = (ids: readonly string[]) =>
    combineProfiles((people ?? []).filter((p) => ids.includes(p.id)).map((p) => p.allergens));
  const saved = people === null ? null : profileFor(selected);
  // Los ajustes sobre el perfil guardado son solo para esta carta: no se guardan.
  const [profile, setProfile] = useState<Allergen[]>(saved ?? []);

  function togglePerson(id: string) {
    // Siempre queda al menos una persona seleccionada.
    const next = selected.includes(id)
      ? selected.length === 1
        ? selected
        : selected.filter((other) => other !== id)
      : [...selected, id];
    setSelected(next);
    setProfile(profileFor(next));
  }
  const selectedNames = (people ?? []).filter((p) => selected.includes(p.id)).map((p) => p.name);
  const [hideNotSuitable, setHideNotSuitable] = useState(false);
  const hideId = useId();

  const sections = buildMenu(dishes, profile);
  const filtering = profile.length > 0;
  const counts = countByStatus(sections);
  const hiding = filtering && hideNotSuitable;

  const toggle = (allergen: Allergen) =>
    setProfile((current) =>
      current.includes(allergen) ? current.filter((a) => a !== allergen) : [...current, allergen],
    );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        {diner !== null ? (
          <Link href="/comensal/restaurantes" className="text-sm underline">
            {t.menu.backToSearch}
          </Link>
        ) : null}
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

      <section
        aria-labelledby="allergen-filter-title"
        className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <h2 id="allergen-filter-title" className="font-semibold">
          {t.menu.filterTitle}
        </h2>
        {people !== null && people.length > 1 ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">{t.menu.forWhom}</legend>
            <div className="flex flex-wrap gap-2">
              {people.map((person) => (
                <label
                  key={person.id}
                  className="flex min-h-11 items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm has-checked:border-emerald-700 has-checked:bg-emerald-50 dark:border-zinc-700 dark:has-checked:bg-emerald-950"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(person.id)}
                    onChange={() => togglePerson(person.id)}
                    className="size-4 accent-emerald-700"
                  />
                  {person.name}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        {saved !== null ? (
          sameAllergens(profile, saved) ? (
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              {people !== null && people.length > 1
                ? t.menu.usingProfileFor(selectedNames.join(", "))
                : t.menu.usingProfile}
            </p>
          ) : (
            <p className="flex flex-wrap items-center gap-x-3 text-sm">
              <span>{t.menu.adjusted}</span>
              <button type="button" onClick={() => setProfile(saved)} className="underline">
                {t.menu.resetToProfile}
              </button>
            </p>
          )
        ) : null}
        {diner !== null && people === null ? (
          <p className="text-sm">
            <Link href="/comensal/alergias" className="underline">
              {t.menu.configureProfile}
            </Link>
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALLERGENS.map((allergen) => {
            const pressed = profile.includes(allergen);
            return (
              <button
                key={allergen}
                type="button"
                aria-pressed={pressed}
                onClick={() => toggle(allergen)}
                className={`flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                  pressed
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <AllergenIcon allergen={allergen} className="size-5 shrink-0" />
                {ALLERGEN_LABELS.es[allergen]}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{t.menu.filterHint}</p>

        {filtering ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium" aria-live="polite">
              {t.menu.summary(counts)}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <input
                  id={hideId}
                  type="checkbox"
                  checked={hideNotSuitable}
                  onChange={(event) => setHideNotSuitable(event.target.checked)}
                  className="size-4 accent-emerald-700"
                />
                <label htmlFor={hideId} className="text-sm">
                  {t.menu.hideNotSuitable}
                </label>
              </div>
              <button type="button" onClick={() => setProfile([])} className="text-sm underline">
                {t.menu.clear}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm font-medium" aria-live="polite">
            {FILTER_EMPTY_PROFILE_HINT.es}
          </p>
        )}
      </section>

      {sections.length === 0 ? (
        <p className="text-zinc-700 dark:text-zinc-300">{t.menu.empty}</p>
      ) : null}
      {hiding && counts.no_apto > 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t.menu.hiddenCount(counts.no_apto)}
        </p>
      ) : null}
      {hiding && sections.length > 0 && counts.no_apto === dishes.length ? (
        <p className="font-medium">{t.menu.allHidden}</p>
      ) : null}

      {sections.map((section) => {
        const visible = hiding
          ? section.dishes.filter((item) => item.evaluation.status !== "no_apto")
          : section.dishes;
        if (visible.length === 0) return null;
        return (
          <section key={section.category ?? ""} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{section.category ?? t.menu.uncategorized}</h2>
            <ul className="flex flex-col gap-3">
              {visible.map((item) => (
                <DishCard key={item.dish.id} item={item} profile={profile} />
              ))}
            </ul>
          </section>
        );
      })}

      <aside className="flex flex-col items-start gap-2 rounded-lg bg-emerald-50 p-4 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-50">
        <p className="text-sm">{t.appPromo.text}</p>
        <Link
          href="/app"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          {t.appPromo.button}
        </Link>
      </aside>

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

// El estado se indica con texto y símbolo, no solo con color (daltonismo).
const STATUS_STYLES: Record<FilterStatus, { symbol: string; className: string }> = {
  no_apto: { symbol: "✕", className: "bg-red-700 text-white" },
  posibles_trazas: { symbol: "!", className: "bg-amber-400 text-zinc-950" },
  sin_datos: { symbol: "?", className: "bg-zinc-600 text-white" },
  apto: { symbol: "✓", className: "bg-emerald-700 text-white" },
};

function StatusBadge({ status }: { status: FilterStatus }) {
  const { symbol, className } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      data-status={status}
    >
      <span aria-hidden="true">{symbol}</span>
      {FILTER_STATUS_LABELS.es[status].short}
    </span>
  );
}

function AllergenList({ allergens }: { allergens: readonly Allergen[] }) {
  // Contenedor en línea (no flex) para que el separador ", " conserve el espacio:
  // lo leen los lectores de pantalla y se copia bien.
  return (
    <span>
      {allergens.map((allergen, index) => (
        <Fragment key={allergen}>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <AllergenIcon allergen={allergen} className="size-4 shrink-0" />
            {ALLERGEN_LABELS.es[allergen]}
          </span>
          {index < allergens.length - 1 ? ", " : null}
        </Fragment>
      ))}
    </span>
  );
}

type DishCardProps = {
  item: EvaluatedDish<MenuDish>;
  profile: readonly Allergen[];
};

function DishCard({ item, profile }: DishCardProps) {
  const t = getMessages();
  const { dish, evaluation } = item;
  const filtering = profile.length > 0;
  const notSuitable = filtering && evaluation.status === "no_apto";

  // Lo que el establecimiento ha declarado. Con filtro, los alérgenos de la
  // selección ya aparecen como motivo del estado: aquí solo se listan los demás.
  const levelOf = new Map(dish.allergens.map((d) => [d.allergen, d.level]));
  const shown = (level: "contains" | "may_contain") =>
    ALLERGENS.filter((a) => levelOf.get(a) === level && !profile.includes(a));
  const contains = shown("contains");
  const traces = shown("may_contain");
  const undeclared = ALLERGENS.length - levelOf.size;

  return (
    <li
      className={`flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 ${
        notSuitable ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={`font-medium ${notSuitable ? "line-through" : ""}`}>{dish.name}</h3>
        {dish.price_cents === null ? null : (
          <span className="shrink-0 font-medium">{formatCents(dish.price_cents)}</span>
        )}
      </div>

      {filtering ? (
        <div className="flex flex-col gap-1 text-sm">
          <div>
            <StatusBadge status={evaluation.status} />
          </div>
          {evaluation.contains.length > 0 ? (
            <p>
              <span className="font-medium">{t.menu.reasonContains}</span>{" "}
              <AllergenList allergens={evaluation.contains} />
            </p>
          ) : null}
          {evaluation.mayContain.length > 0 ? (
            <p>
              <span className="font-medium">{t.menu.reasonTraces}</span>{" "}
              <AllergenList allergens={evaluation.mayContain} />
            </p>
          ) : null}
          {evaluation.missing.length > 0 ? (
            <p>
              <span className="font-medium">{t.menu.reasonMissing}</span>{" "}
              <AllergenList allergens={evaluation.missing} />
            </p>
          ) : null}
        </div>
      ) : null}

      {dish.description ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{dish.description}</p>
      ) : null}
      {dish.ingredients ? (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {t.menu.ingredients} {dish.ingredients}
        </p>
      ) : null}

      <div className="flex flex-col gap-1 text-xs text-zinc-700 dark:text-zinc-300">
        {levelOf.size === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">{t.menu.noDeclarations}</p>
        ) : (
          <>
            {filtering && contains.length + traces.length > 0 ? (
              <p className="font-medium">{t.menu.otherDeclared}</p>
            ) : null}
            {contains.length > 0 ? (
              <p>
                <span className="font-medium">{t.menu.declaredContains}</span>{" "}
                <AllergenList allergens={contains} />
              </p>
            ) : null}
            {traces.length > 0 ? (
              <p>
                <span className="font-medium">{t.menu.declaredTraces}</span>{" "}
                <AllergenList allergens={traces} />
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
