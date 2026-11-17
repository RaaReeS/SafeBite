"use client";

import { useActionState } from "react";
import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { initialFormState, type FormState } from "@/lib/forms";

export function PlanForm({
  action,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const t = getMessages();
  const [state, formAction, pending] = useActionState(action, initialFormState);

  return (
    <form action={formAction} aria-label={t.admin.plans.formLabel} className="flex flex-col gap-4">
      <FormStatus state={state} />
      <TextField
        label={t.admin.plans.email}
        name="email"
        type="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="plan" value="premium" disabled={pending}>
          {t.admin.plans.makePremium}
        </Button>
        <Button type="submit" name="plan" value="free" variant="secondary" disabled={pending}>
          {t.admin.plans.makeFree}
        </Button>
      </div>
    </form>
  );
}
