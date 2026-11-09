"use client";

import { useActionState } from "react";
import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { initialFormState } from "@/lib/forms";
import { signIn } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const t = getMessages();
  const [state, action, pending] = useActionState(signIn, initialFormState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormStatus state={state} />
      <input type="hidden" name="next" value={next} />
      <TextField
        label={t.auth.email}
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <TextField
        label={t.auth.password}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <Button type="submit" disabled={pending}>
        {pending ? t.auth.login.pending : t.auth.login.submit}
      </Button>
    </form>
  );
}
