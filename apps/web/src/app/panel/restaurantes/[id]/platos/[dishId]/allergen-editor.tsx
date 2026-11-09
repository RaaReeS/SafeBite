"use client";

import {
  ALLERGENS,
  ALLERGEN_LABELS,
  ALLERGEN_LEVELS,
  type Allergen,
  type AllergenLevel,
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
  contains: "peer-checked:bg-red-700 peer-checked:text-white peer-checked:border-red-700",
  may_contain: "peer-checked:bg-amber-500 peer-checked:text-zinc-950 peer-checked:border-amber-500",
  free_from: "peer-checked:bg-emerald-700 peer-checked:text-white peer-checked:border-emerald-700",
  undeclared: "peer-checked:bg-zinc-700 peer-checked:text-white peer-checked:border-zinc-700",
};

function toChoices(declarations: readonly { allergen: Allergen; level: AllergenLevel }[]): Choices {
  const choices = Object.fromEntries(ALLERGENS.map((a) => [a, UNDECLARED])) as Choices;
  for (const { allergen, level } of declarations) choices[allergen] = level;
  return choices;
}

type AllergenEditorProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  declarations: { allergen: Allergen; level: AllergenLevel }[];
};

export function AllergenEditor({ action, declarations }: AllergenEditorProps) {
  const t = getMessages();
  const labels = ALLERGEN_LABELS.es;
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const saved = toChoices(declarations);
  const [choices, setChoices] = useState<Choices>(saved);
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

      <form action={formAction} aria-label={t.allergens.title} className="flex flex-col gap-4">
        <FormStatus state={state} />

        <p className="text-sm font-medium" aria-live="polite">
          {t.allergens.progress(declaredCount, ALLERGENS.length)}
          {undeclared.length > 0 ? ` · ${t.allergens.missing(undeclared.length)}` : ""}
        </p>

        <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {ALLERGENS.map((allergen) => (
            <fieldset key={allergen} className="px-4 py-3">
              {/* float: el legend se comporta como un bloque normal dentro del fieldset. */}
              <legend className="float-left w-full pb-2 text-sm font-medium sm:w-56 sm:pb-0 sm:pt-1">
                {labels[allergen]}
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
                      className={`inline-block rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-700 dark:border-zinc-700 ${CHOICE_CLASSES[choice]}`}
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
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-lg border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <h2 id="bulk-free-from-title" className="text-lg font-semibold">
          {t.allergens.bulkTitle}
        </h2>
        <div className="mt-3 flex flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300">
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
