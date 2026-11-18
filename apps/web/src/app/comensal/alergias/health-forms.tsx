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
      className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-card"
    >
      <h2 className="text-lg font-semibold">{t.diner.consent.title}</h2>
      <p className="text-muted">{t.diner.consent.intro}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
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
            className="mt-1 size-4 accent-primary"
          />
          <label htmlFor={checkboxId} className="text-sm">
            {t.diner.consent.checkbox}
          </label>
        </div>
        {error ? (
          <p id={`${checkboxId}-error`} className="text-sm font-semibold text-danger">
            {error}
          </p>
        ) : null}
      </div>
      <Link
        href="/privacidad"
        target="_blank"
        className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
      >
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
        <legend className="mb-2 text-sm text-muted">{t.diner.allergies.description}</legend>
        {ALLERGENS.map((allergen) => (
          <label
            key={allergen}
            className="flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl bg-card px-4 py-2 shadow-card has-checked:bg-success-bg has-checked:ring-2 has-checked:ring-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-text"
          >
            <input
              type="checkbox"
              name="allergen"
              value={allergen}
              defaultChecked={initial.includes(allergen)}
              className="size-4 accent-primary"
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
