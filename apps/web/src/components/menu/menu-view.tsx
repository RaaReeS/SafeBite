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
import { IconBadge } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { STATUS_STYLES } from "@/components/ui/status";
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
      {diner !== null ? (
        <Link
          href="/comensal/restaurantes"
          className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline gap-1"
        >
          {t.menu.backToSearch}
        </Link>
      ) : null}
      <header className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-card sm:flex-row sm:items-center">
        <IconBadge icon="restaurant" size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">{restaurant.name}</h1>
          <p className="inline-flex items-center gap-1 text-sm text-muted">
            <Icon name="location" className="size-4" />
            {[restaurant.address, restaurant.city].filter(Boolean).join(" · ")}
          </p>
        </div>
        {restaurant.phone ? (
          <a
            href={`tel:${restaurant.phone.replace(/[^+0-9]/g, "")}`}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-input bg-card px-5 text-sm font-semibold hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
          >
            <Icon name="call" className="size-[1.15rem]" />
            {t.menu.call} {restaurant.phone}
          </a>
        ) : null}
      </header>

      <Notices />

      <section
        aria-labelledby="allergen-filter-title"
        className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-card"
      >
        <h2 id="allergen-filter-title" className="text-lg font-semibold">
          {t.menu.filterTitle}
        </h2>
        {people !== null && people.length > 1 ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold text-muted">{t.menu.forWhom}</legend>
            <div className="flex flex-wrap gap-2">
              {people.map((person) => (
                <label
                  key={person.id}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-surface px-4 text-sm font-medium has-checked:bg-success-bg has-checked:ring-2 has-checked:ring-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-text"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(person.id)}
                    onChange={() => togglePerson(person.id)}
                    className="size-4 accent-primary"
                  />
                  {person.name}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        {saved !== null ? (
          sameAllergens(profile, saved) ? (
            <p className="text-sm text-primary-text">
              {people !== null && people.length > 1
                ? t.menu.usingProfileFor(selectedNames.join(", "))
                : t.menu.usingProfile}
            </p>
          ) : (
            <p className="flex flex-wrap items-center gap-x-3 text-sm">
              <span>{t.menu.adjusted}</span>
              <button
                type="button"
                onClick={() => setProfile(saved)}
                className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
              >
                {t.menu.resetToProfile}
              </button>
            </p>
          )
        ) : null}
        {diner !== null && people === null ? (
          <p className="text-sm">
            <Link
              href="/comensal/alergias"
              className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
            >
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
                className={`flex min-h-11 items-center gap-2 rounded-full px-3 py-2 text-left text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
                  pressed
                    ? "bg-primary text-on-primary shadow-card"
                    : "bg-surface text-fg hover:brightness-95"
                }`}
              >
                <AllergenIcon allergen={allergen} className="size-5 shrink-0" />
                {ALLERGEN_LABELS.es[allergen]}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">{t.menu.filterHint}</p>

        {filtering ? (
          <div className="flex flex-col gap-3">
            <p className="font-semibold" aria-live="polite">
              {t.menu.summary(counts)}
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2">
                <input
                  id={hideId}
                  type="checkbox"
                  checked={hideNotSuitable}
                  onChange={(event) => setHideNotSuitable(event.target.checked)}
                  className="size-5 accent-primary"
                />
                <label htmlFor={hideId} className="text-sm">
                  {t.menu.hideNotSuitable}
                </label>
              </div>
              <button
                type="button"
                onClick={() => setProfile([])}
                className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
              >
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

      {sections.length === 0 ? <p className="text-muted">{t.menu.empty}</p> : null}
      {hiding && counts.no_apto > 0 ? (
        <p className="text-sm text-muted">{t.menu.hiddenCount(counts.no_apto)}</p>
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

      <aside className="flex flex-col items-start gap-2 rounded-2xl bg-primary-soft p-5 text-primary-strong">
        <p className="text-sm">{t.appPromo.text}</p>
        <Link
          href="/app"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-on-primary shadow-card hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
        >
          {t.appPromo.button}
        </Link>
      </aside>

      <footer className="flex flex-col gap-3 border-t border-line pt-4">
        <Notices />
        <p className="text-center text-xs text-muted">{t.menu.poweredBy}</p>
      </footer>
    </div>
  );
}

/** Aviso obligatorio: siempre visible (regla crítica 5). */
function Notices() {
  return (
    <p className="rounded-2xl bg-warning-bg px-4 py-3 text-sm font-medium text-warning-fg">
      {FILTER_SOURCE_NOTICE.es} <strong>{FILTER_DISCLAIMER.es}</strong>
    </p>
  );
}

function StatusBadge({ status }: { status: FilterStatus }) {
  const { symbol, className } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${className}`}
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

const STATUS_COLOR: Record<FilterStatus, string> = {
  apto: "var(--status-apto)",
  no_apto: "var(--status-no-apto)",
  posibles_trazas: "var(--status-trazas)",
  sin_datos: "var(--status-sin-datos)",
};

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
      className={`flex flex-col gap-2 rounded-2xl border-l-[6px] bg-card p-5 shadow-card ${
        notSuitable ? "opacity-60" : ""
      }`}
      // Franja del color del estado (además de la etiqueta con texto).
      style={{ borderLeftColor: filtering ? STATUS_COLOR[evaluation.status] : "var(--card)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className={`text-lg font-semibold ${notSuitable ? "line-through" : ""}`}>
          {dish.name}
        </h3>
        {dish.price_cents === null ? null : (
          <span className="shrink-0 text-lg font-bold text-primary-text">
            {formatCents(dish.price_cents)}
          </span>
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

      {dish.description ? <p className="text-sm text-muted">{dish.description}</p> : null}
      {dish.ingredients ? (
        <p className="text-xs text-muted">
          {t.menu.ingredients} {dish.ingredients}
        </p>
      ) : null}

      <div className="flex flex-col gap-1 text-xs text-muted">
        {levelOf.size === 0 ? (
          <p className="text-muted">{t.menu.noDeclarations}</p>
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
            {undeclared > 0 ? <p className="text-muted">{t.menu.undeclared(undeclared)}</p> : null}
          </>
        )}
      </div>
    </li>
  );
}
