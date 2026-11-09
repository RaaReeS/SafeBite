"use client";

import { useActionState } from "react";
import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { initialFormState } from "@/lib/forms";
import { updatePassword } from "../actions";

export function NewPasswordForm() {
  const t = getMessages();
  const [state, action, pending] = useActionState(updatePassword, initialFormState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormStatus state={state} />
      <TextField
        label={t.auth.newPassword.password}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint={t.auth.passwordHint}
        error={state.fieldErrors?.password}
      />
      <TextField
        label={t.auth.newPassword.confirmation}
        name="password_confirmation"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.password_confirmation}
      />
      <Button type="submit" disabled={pending}>
        {pending ? t.auth.newPassword.pending : t.auth.newPassword.submit}
      </Button>
    </form>
  );
}
