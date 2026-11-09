"use client";

import { useActionState } from "react";
import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { initialFormState } from "@/lib/forms";
import { requestPasswordReset } from "../actions";

export function ForgotForm() {
  const t = getMessages();
  const [state, action, pending] = useActionState(requestPasswordReset, initialFormState);

  if (state.status === "success") {
    return <FormStatus state={state} />;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormStatus state={state} />
      <TextField
        label={t.auth.email}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Button type="submit" disabled={pending}>
        {pending ? t.auth.forgot.pending : t.auth.forgot.submit}
      </Button>
    </form>
  );
}
