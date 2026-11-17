"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
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
  const typeErrorId = useId();
  const termsError = state.fieldErrors?.accepted_terms;
  const typeError = state.fieldErrors?.account_type;
  const [accountType, setAccountType] = useState(state.values?.account_type ?? "");

  if (state.status === "success") {
    return <FormStatus state={state} />;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <FormStatus state={state} />
      <fieldset
        className="flex flex-col gap-2"
        aria-describedby={typeError ? typeErrorId : undefined}
      >
        <legend className="mb-1 text-sm font-medium">{t.auth.register.accountType}</legend>
        {(
          [
            ["diner", t.auth.register.diner, t.auth.register.dinerHint],
            ["restaurant_owner", t.auth.register.owner, t.auth.register.ownerHint],
          ] as const
        ).map(([value, label, hint]) => (
          <label
            key={value}
            className="flex cursor-pointer items-start gap-3 rounded-2xl bg-card p-4 shadow-card has-checked:bg-success-bg has-checked:ring-2 has-checked:ring-primary has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-text"
          >
            <input
              type="radio"
              name="account_type"
              value={value}
              required
              checked={accountType === value}
              onChange={() => setAccountType(value)}
              className="mt-1 size-4 accent-primary"
            />
            <span className="flex flex-col">
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted">{hint}</span>
            </span>
          </label>
        ))}
        {typeError ? (
          <p id={typeErrorId} className="text-sm font-semibold text-danger">
            {typeError}
          </p>
        ) : null}
      </fieldset>
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
            className="mt-1 size-4 accent-primary"
          />
          <label htmlFor={termsId} className="text-sm">
            {t.auth.register.acceptTermsBefore}{" "}
            <Link
              href="/terminos"
              target="_blank"
              className="font-semibold text-primary-text underline"
            >
              {t.auth.register.terms}
            </Link>{" "}
            {t.auth.register.acceptTermsMiddle}{" "}
            <Link
              href="/privacidad"
              target="_blank"
              className="font-semibold text-primary-text underline"
            >
              {t.auth.register.privacy}
            </Link>
            {t.auth.register.acceptTermsAfter}
            {accountType === "restaurant_owner" ? t.auth.register.ownerResponsibility : null}
          </label>
        </div>
        {termsError ? (
          <p id={`${termsId}-error`} className="text-sm font-semibold text-danger">
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
