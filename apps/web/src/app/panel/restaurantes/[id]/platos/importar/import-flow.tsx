"use client";

import {
  ALLERGEN_LABELS,
  centsToPriceInput,
  parsePrice,
  type AllergenSuggestion,
  type ImportedDish,
} from "@safebite/core";
import { useId, useRef, useState, useTransition } from "react";
import { AllergenIcon } from "@/components/menu/allergen-icon";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { TextAreaField, TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { PAGE_FIELD } from "@/lib/menu-import/limits";
import { ACCEPT, PrepareError, prepareImages } from "@/lib/menu-import/prepare-images";
import { createImportedDishes, readMenu } from "./actions";

type ReviewDish = {
  key: number;
  include: boolean;
  name: string;
  price: string;
  category: string;
  description: string;
  ingredients: string;
  suggestions: AllergenSuggestion[];
};

type Stage = { kind: "select" } | { kind: "reading" } | { kind: "review"; dishes: ReviewDish[] };

function toReview(dishes: ImportedDish[]): ReviewDish[] {
  return dishes.map((dish, key) => ({
    key,
    include: true,
    name: dish.name,
    price: dish.priceCents === null ? "" : centsToPriceInput(dish.priceCents),
    category: dish.category ?? "",
    description: dish.description ?? "",
    ingredients: dish.ingredients ?? "",
    suggestions: dish.suggestions,
  }));
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Importar la carta: elegir fotos o PDF → leer (IA en el servidor) → revisar →
 * añadir. Los archivos se preparan aquí, en el navegador, y no se guardan.
 */
export function ImportFlow({ restaurantId }: { restaurantId: string }) {
  const t = getMessages().menuImport;
  const [stage, setStage] = useState<Stage>({ kind: "select" });
  // Los archivos se leen del campo al pulsar «Leer la carta» (no del estado):
  // así funciona aunque se elijan antes de que la página termine de cargar.
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const inputId = useId();

  async function read() {
    const files = Array.from(fileInput.current?.files ?? []);
    if (files.length === 0) {
      setError(t.prepare.noFiles);
      return;
    }
    setError(null);
    setStage({ kind: "reading" });
    const formData = new FormData();
    try {
      for (const page of await prepareImages(files))
        formData.append(PAGE_FIELD, page, "pagina.jpg");
    } catch (prepareError) {
      setError(
        prepareError instanceof PrepareError
          ? t.prepare[prepareError.reason]
          : t.prepare.unreadable,
      );
      setStage({ kind: "select" });
      return;
    }
    let result: Awaited<ReturnType<typeof readMenu>>;
    try {
      result = await readMenu(restaurantId, formData);
    } catch {
      // Fallo inesperado (red, tiempo agotado, servidor): nunca se queda cargando.
      setError(t.errors.unavailable);
      setStage({ kind: "select" });
      return;
    }
    if (result.status === "error") {
      setError(result.message);
      setStage({ kind: "select" });
      return;
    }
    setSubmitted(false);
    setStage({ kind: "review", dishes: toReview(result.dishes) });
  }

  if (stage.kind === "reading") {
    return (
      <div role="status" aria-label={t.reading} className="flex flex-col gap-4">
        <p className="text-sm text-muted">{t.reading}</p>
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (stage.kind === "review") {
    const dishes = stage.dishes;
    const included = dishes.filter((dish) => dish.include);
    const missingName = included.some((dish) => dish.name.trim() === "");

    const update = (key: number, patch: Partial<ReviewDish>) =>
      setStage({
        kind: "review",
        dishes: dishes.map((dish) => (dish.key === key ? { ...dish, ...patch } : dish)),
      });

    function save() {
      setSubmitted(true);
      if (included.length === 0 || missingName) return;
      setSaveError(null);
      startSaving(async () => {
        let result: Awaited<ReturnType<typeof createImportedDishes>>;
        try {
          result = await createImportedDishes(
            restaurantId,
            included.map((dish) => ({
              name: dish.name.trim(),
              description: emptyToNull(dish.description),
              priceCents: parsePrice(dish.price),
              category: emptyToNull(dish.category),
              ingredients: emptyToNull(dish.ingredients),
              suggestions: dish.suggestions,
            })),
          );
        } catch {
          setSaveError(t.errors.createFailed);
          return;
        }
        setSaveError(result.message);
      });
    }

    return (
      <form
        aria-label={t.reviewLabel}
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t.reviewTitle}</h2>
          <p className="text-sm text-muted">{t.reviewIntro(dishes.length)}</p>
        </div>
        <Alert tone="warning">{t.responsibility}</Alert>

        <ul className="flex flex-col gap-4">
          {dishes.map((dish, index) => (
            <Card as="li" key={dish.key} className={dish.include ? "" : "opacity-60"}>
              <fieldset className="flex flex-col gap-4">
                <legend className="sr-only">{t.dishLegend(index + 1, dish.name)}</legend>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
                  <input
                    type="checkbox"
                    checked={dish.include}
                    onChange={(event) => update(dish.key, { include: event.target.checked })}
                    className="size-5 accent-primary"
                  />
                  {t.include(dish.name || t.untitled)}
                </label>
                {dish.include ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                      <TextField
                        label={t.fields.name}
                        value={dish.name}
                        maxLength={120}
                        onChange={(event) => update(dish.key, { name: event.target.value })}
                        error={submitted && dish.name.trim() === "" ? t.nameRequired : undefined}
                      />
                      <TextField
                        label={t.fields.price}
                        value={dish.price}
                        inputMode="decimal"
                        onChange={(event) => update(dish.key, { price: event.target.value })}
                      />
                    </div>
                    <TextField
                      label={t.fields.category}
                      value={dish.category}
                      maxLength={60}
                      onChange={(event) => update(dish.key, { category: event.target.value })}
                    />
                    <TextAreaField
                      label={t.fields.description}
                      value={dish.description}
                      maxLength={1000}
                      rows={2}
                      onChange={(event) => update(dish.key, { description: event.target.value })}
                    />
                    <TextAreaField
                      label={t.fields.ingredients}
                      value={dish.ingredients}
                      maxLength={2000}
                      rows={2}
                      onChange={(event) => update(dish.key, { ingredients: event.target.value })}
                    />
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold">{t.suggestedTitle}</p>
                      {dish.suggestions.length === 0 ? (
                        <p className="text-sm text-muted">{t.noSuggestions}</p>
                      ) : (
                        <ul aria-label={t.suggestedTitle} className="flex flex-wrap gap-2">
                          {dish.suggestions.map((suggestion) => (
                            <li
                              key={suggestion.allergen}
                              className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-3 py-1 text-sm font-medium text-warning-fg"
                            >
                              <AllergenIcon allergen={suggestion.allergen} className="size-4" />
                              {ALLERGEN_LABELS.es[suggestion.allergen]} ·{" "}
                              {t.levels[suggestion.level]}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                ) : null}
              </fieldset>
            </Card>
          ))}
        </ul>

        {submitted && included.length === 0 ? <Alert tone="error">{t.noneIncluded}</Alert> : null}
        {saveError ? <Alert tone="error">{saveError}</Alert> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" icon="add" disabled={saving}>
            {t.add(included.length)}
          </Button>
          <Button variant="secondary" onClick={() => setStage({ kind: "select" })}>
            {t.startOver}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Card>
      <p className="text-sm text-muted">{t.intro}</p>
      {error ? <Alert tone="error">{error}</Alert> : null}
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-semibold">
          {t.fileLabel}
        </label>
        <input
          id={inputId}
          type="file"
          accept={ACCEPT}
          multiple
          ref={fileInput}
          className="block w-full rounded-xl border-[1.5px] border-dashed border-input bg-surface p-4 text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-on-primary"
        />
        <p className="text-sm text-muted">{t.fileHint}</p>
      </div>
      <div>
        <Button icon="scan" onClick={() => void read()}>
          {t.read}
        </Button>
      </div>
    </Card>
  );
}
