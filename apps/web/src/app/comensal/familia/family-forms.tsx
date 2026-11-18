"use client";

import { useActionState, useId } from "react";
import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { initialFormState, type FormState } from "@/lib/forms";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/** Añadir un familiar: nombre y declaración de tutor o permiso (obligatoria). */
export function AddMemberForm({ action }: { action: Action }) {
  const t = getMessages();
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const guardianId = useId();
  const guardianError = state.fieldErrors?.guardian;

  return (
    <form
      action={formAction}
      aria-label={t.family.addTitle}
      className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-card"
    >
      <h2 className="text-lg font-semibold">{t.family.addTitle}</h2>
      <FormStatus state={state} />
      <TextField
        label={t.family.name}
        name="name"
        hint={t.family.nameHint}
        maxLength={40}
        required
        defaultValue={state.values?.name}
        error={state.fieldErrors?.name}
      />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <input
            id={guardianId}
            name="guardian"
            type="checkbox"
            required
            aria-invalid={guardianError ? true : undefined}
            aria-describedby={guardianError ? `${guardianId}-error` : undefined}
            className="mt-1 size-4 accent-primary"
          />
          <label htmlFor={guardianId} className="text-sm">
            {t.family.guardian}
          </label>
        </div>
        {guardianError ? (
          <p id={`${guardianId}-error`} className="text-sm font-semibold text-danger">
            {guardianError}
          </p>
        ) : null}
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {t.family.add}
        </Button>
      </div>
    </form>
  );
}

export function RenameMemberForm({ action, name }: { action: Action; name: string }) {
  const t = getMessages();
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <form action={formAction} aria-label={t.family.renameTitle} className="flex flex-col gap-3">
      <FormStatus state={state} />
      <TextField
        label={t.family.name}
        name="name"
        maxLength={40}
        required
        defaultValue={state.values?.name ?? name}
        error={state.fieldErrors?.name}
      />
      <div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {t.family.rename}
        </Button>
      </div>
    </form>
  );
}
