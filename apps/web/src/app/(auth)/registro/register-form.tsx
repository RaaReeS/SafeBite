"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { initialFormState } from "@/lib/forms";
import { signUp } from "../actions";

export function RegisterForm() {
  const t = getMessages();
  const [state, action, pending] = useActionState(signUp, initialFormState);
  const termsId = useId();
  const termsError = state.fieldErrors?.accepted_terms;

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
      <TextField
        label={t.auth.password}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        hint={t.auth.passwordHint}
        error={state.fieldErrors?.password}
      />
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <input
            id={termsId}
            name="accepted_terms"
            type="checkbox"
            required
            aria-invalid={termsError ? true : undefined}
            aria-describedby={termsError ? `${termsId}-error` : undefined}
            className="mt-1 size-4 accent-emerald-700"
          />
          <label htmlFor={termsId} className="text-sm">
            {t.auth.register.acceptTermsBefore}{" "}
            <Link href="/terminos" target="_blank" className="underline">
              {t.auth.register.terms}
            </Link>{" "}
            {t.auth.register.acceptTermsMiddle}{" "}
            <Link href="/privacidad" target="_blank" className="underline">
              {t.auth.register.privacy}
            </Link>
            {t.auth.register.acceptTermsAfter}
          </label>
        </div>
        {termsError ? (
          <p id={`${termsId}-error`} className="text-xs font-medium text-red-700 dark:text-red-400">
            {termsError}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t.auth.register.pending : t.auth.register.submit}
      </Button>
    </form>
  );
}
