"use client";

import { AllergenIcon } from "@/components/menu/allergen-icon";
import {
  ALLERGENS,
  ALLERGEN_LABELS,
  ALLERGEN_LEVELS,
  type Allergen,
  type AllergenLevel,
  type AllergenSuggestion,
} from "@safebite/core";
import { useActionState, useRef, useState } from "react";
import { FormStatus } from "@/components/form-status";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { UNDECLARED, allergenFieldName } from "@/lib/allergen-form";
import { initialFormState, type FormState } from "@/lib/forms";

type Choice = AllergenLevel | typeof UNDECLARED;
type Choices = Record<Allergen, Choice>;

const CHOICES: readonly Choice[] = [...ALLERGEN_LEVELS, UNDECLARED];

const CHOICE_CLASSES: Record<Choice, string> = {
  contains:
    "peer-checked:bg-status-no-apto peer-checked:text-on-status peer-checked:border-transparent",
  may_contain:
    "peer-checked:bg-status-trazas peer-checked:text-on-status-trazas peer-checked:border-transparent",
  free_from:
    "peer-checked:bg-status-apto peer-checked:text-on-status peer-checked:border-transparent",
  undeclared:
    "peer-checked:bg-status-sin-datos peer-checked:text-on-status peer-checked:border-transparent",
};

function toChoices(declarations: readonly { allergen: Allergen; level: AllergenLevel }[]): Choices {
  const choices = Object.fromEntries(ALLERGENS.map((a) => [a, UNDECLARED])) as Choices;
  for (const { allergen, level } of declarations) choices[allergen] = level;
  return choices;
}

type AllergenEditorProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  declarations: { allergen: Allergen; level: AllergenLevel }[];
  /**
   * Propuestas de la importación de la carta: se preseleccionan donde no hay
   * nada declarado, marcadas «Propuesto». No cuentan hasta guardar.
   */
  suggestions?: AllergenSuggestion[];
};

export function AllergenEditor({ action, declarations, suggestions = [] }: AllergenEditorProps) {
  const t = getMessages();
  const labels = ALLERGEN_LABELS.es;
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const saved = toChoices(declarations);
  // Solo donde no hay declaración: lo que el dueño ya declaró manda.
  const proposed = new Map(
    suggestions
      .filter((suggestion) => saved[suggestion.allergen] === UNDECLARED)
      .map((suggestion) => [suggestion.allergen, suggestion.level] as const),
  );
  const [choices, setChoices] = useState<Choices>(() => {
    const initial = { ...saved };
    for (const [allergen, level] of proposed) initial[allergen] = level;
    return initial;
  });
  const dialogRef = useRef<HTMLDialogElement>(null);

  const undeclared = ALLERGENS.filter((allergen) => choices[allergen] === UNDECLARED);
  const declaredCount = ALLERGENS.length - undeclared.length;
  const dirty = ALLERGENS.some((allergen) => choices[allergen] !== saved[allergen]);

  function markUndeclaredAsFreeFrom() {
    setChoices((current) => {
      const next = { ...current };
      for (const allergen of ALLERGENS) {
        if (next[allergen] === UNDECLARED) next[allergen] = "free_from";
      }
      return next;
    });
    dialogRef.current?.close();
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert tone="info">{t.allergens.responsibility}</Alert>
      {proposed.size > 0 ? <Alert tone="warning">{t.menuImport.editorNotice}</Alert> : null}

      <form action={formAction} aria-label={t.allergens.title} className="flex flex-col gap-4">
        <FormStatus state={state} />

        <p className="text-sm font-medium" aria-live="polite">
          {t.allergens.progress(declaredCount, ALLERGENS.length)}
          {undeclared.length > 0 ? ` · ${t.allergens.missing(undeclared.length)}` : ""}
        </p>

        <div className="flex flex-col divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-card">
          {ALLERGENS.map((allergen) => (
            <fieldset key={allergen} className="px-4 py-3">
              {/* float: el legend se comporta como un bloque normal dentro del fieldset. */}
              <legend className="float-left w-full pb-2 text-sm font-semibold sm:w-60 sm:pb-0 sm:pt-1.5">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <AllergenIcon allergen={allergen} className="size-5 text-primary-text" />
                  {labels[allergen]}
                  {proposed.has(allergen) ? (
                    <span className="rounded-full bg-warning-bg px-2 py-0.5 text-xs font-semibold text-warning-fg">
                      {t.menuImport.suggested}
                    </span>
                  ) : null}
                </span>
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {CHOICES.map((choice) => (
                  <label key={choice} className="cursor-pointer">
                    <input
                      type="radio"
                      name={allergenFieldName(allergen)}
                      value={choice}
                      checked={choices[allergen] === choice}
                      onChange={() => setChoices((current) => ({ ...current, [allergen]: choice }))}
                      className="peer sr-only"
                    />
                    <span
                      className={`inline-flex min-h-9 cursor-pointer items-center rounded-full border border-input px-3 text-xs font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-text ${CHOICE_CLASSES[choice]}`}
                    >
                      {t.allergens.levels[choice]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        {dirty ? <Alert tone="warning">{t.allergens.unsaved}</Alert> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? t.allergens.saving : t.allergens.save}
          </Button>
          <Button
            variant="secondary"
            disabled={undeclared.length === 0}
            onClick={() => dialogRef.current?.showModal()}
          >
            {t.allergens.bulkButton}
          </Button>
        </div>
      </form>

      <dialog
        ref={dialogRef}
        aria-labelledby="bulk-free-from-title"
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-2xl bg-card p-6 text-fg shadow-raised backdrop:bg-black/50"
      >
        <h2 id="bulk-free-from-title" className="text-lg font-semibold">
          {t.allergens.bulkTitle}
        </h2>
        <div className="mt-3 flex flex-col gap-3 text-sm text-muted">
          <p>{t.allergens.bulkIntro}</p>
          <ul className="list-disc pl-6">
            {undeclared.map((allergen) => (
              <li key={allergen}>{labels[allergen]}</li>
            ))}
          </ul>
          <Alert tone="warning">{t.allergens.bulkWarning}</Alert>
          <p>{t.allergens.bulkNote}</p>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => dialogRef.current?.close()} autoFocus>
            {t.restaurant.cancel}
          </Button>
          <Button onClick={markUndeclaredAsFreeFrom}>{t.allergens.bulkConfirm}</Button>
        </div>
      </dialog>
    </div>
  );
}
