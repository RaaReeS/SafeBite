"use client";

import { ALLERGENS, ALLERGEN_LABELS, type Allergen } from "@safebite/core";
import Link from "next/link";
import { useActionState, useId } from "react";
import { AllergenIcon } from "@/components/menu/allergen-icon";
import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { initialFormState, type FormState } from "@/lib/forms";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Consentimiento explícito para guardar datos de salud (RGPD, art. 9). */
export function ConsentForm({ action }: { action: Action }) {
  const t = getMessages();
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const checkboxId = useId();
  const error = state.fieldErrors?.consent;

  return (
    <form
      action={formAction}
      aria-label={t.diner.consent.title}
      className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-lg font-semibold">{t.diner.consent.title}</h2>
      <p className="text-zinc-700 dark:text-zinc-300">{t.diner.consent.intro}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
        {t.diner.consent.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <FormStatus state={state} />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <input
            id={checkboxId}
            name="consent"
            type="checkbox"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${checkboxId}-error` : undefined}
            className="mt-1 size-4 accent-emerald-700"
          />
          <label htmlFor={checkboxId} className="text-sm">
            {t.diner.consent.checkbox}
          </label>
        </div>
        {error ? (
          <p
            id={`${checkboxId}-error`}
            className="text-xs font-medium text-red-700 dark:text-red-400"
          >
            {error}
          </p>
        ) : null}
      </div>
      <Link href="/privacidad" target="_blank" className="text-sm underline">
        {t.diner.consent.privacy}
      </Link>
      <div>
        <Button type="submit" disabled={pending}>
          {t.diner.consent.accept}
        </Button>
      </div>
    </form>
  );
}

/** Los 14 alérgenos para marcar. Se guardan todos de una vez. */
export function AllergiesForm({
  action,
  initial,
  label,
}: {
  action: Action;
  initial: Allergen[];
  /** Nombre accesible del formulario (por defecto, «Mis alergias»). */
  label?: string;
}) {
  const t = getMessages();
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <form
      action={formAction}
      aria-label={label ?? t.diner.allergies.title}
      className="flex flex-col gap-4"
    >
      <FormStatus state={state} />
      <fieldset className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <legend className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
          {t.diner.allergies.description}
        </legend>
        {ALLERGENS.map((allergen) => (
          <label
            key={allergen}
            className="flex items-center gap-3 rounded-md border border-zinc-300 px-3 py-2 has-checked:border-emerald-700 has-checked:bg-emerald-50 dark:border-zinc-700 dark:has-checked:bg-emerald-950"
          >
            <input
              type="checkbox"
              name="allergen"
              value={allergen}
              defaultChecked={initial.includes(allergen)}
              className="size-4 accent-emerald-700"
            />
            <AllergenIcon allergen={allergen} />
            <span className="text-sm">{ALLERGEN_LABELS.es[allergen]}</span>
          </label>
        ))}
      </fieldset>
      <div>
        <Button type="submit" disabled={pending}>
          {t.diner.allergies.save}
        </Button>
      </div>
    </form>
  );
}
