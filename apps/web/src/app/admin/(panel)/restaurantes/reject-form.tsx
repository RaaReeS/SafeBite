"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { initialFormState, type FormState } from "@/lib/forms";

/** Rechazo con motivo obligatorio: el dueño lo verá en su panel. */
export function RejectForm({
  action,
  restaurantName,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  restaurantName: string;
}) {
  const t = getMessages();
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <form
      action={formAction}
      aria-label={t.admin.restaurants.rejectFormLabel(restaurantName)}
      className="flex flex-col gap-2"
    >
      <TextAreaField
        name="note"
        label={t.admin.restaurants.noteLabel}
        hint={t.admin.restaurants.noteHint}
        defaultValue={state.values?.note}
        error={state.fieldErrors?.note}
        rows={2}
        maxLength={500}
      />
      <div>
        <Button type="submit" variant="danger" disabled={pending}>
          {t.admin.restaurants.reject}
        </Button>
      </div>
    </form>
  );
}
