"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { initialTwoFactorState, type TwoFactorState } from "@/lib/two-factor";

type Action = (prev: TwoFactorState, formData: FormData) => Promise<TwoFactorState>;

/** Formulario del código de 6 cifras. */
export function CodeForm({
  action,
  initialState = initialTwoFactorState,
  hint,
}: {
  action: Action;
  initialState?: TwoFactorState;
  hint?: string;
}) {
  const t = getMessages();
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      aria-label={t.admin.twoFactor.codeFormLabel}
      className="flex flex-col gap-3"
    >
      {state.status === "error" && state.message ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}
      <TextField
        name="code"
        label={t.admin.twoFactor.codeLabel}
        hint={hint ?? t.admin.twoFactor.codeHint}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        required
      />
      <div>
        <Button type="submit" disabled={pending}>
          {t.admin.twoFactor.verify}
        </Button>
      </div>
    </form>
  );
}

/** Alta del autenticador: muestra el QR y pide el primer código. */
export function EnrollFlow({ start, confirm }: { start: Action; confirm: Action }) {
  const t = getMessages();
  const [state, formAction, pending] = useActionState(start, initialTwoFactorState);

  if (state.enrollment === undefined) {
    return (
      <form action={formAction} className="flex flex-col gap-3">
        {state.status === "error" && state.message ? (
          <Alert tone="error">{state.message}</Alert>
        ) : null}
        <p className="text-zinc-700 dark:text-zinc-300">{t.admin.twoFactor.enrollIntro}</p>
        <div>
          <Button type="submit" disabled={pending}>
            {t.admin.twoFactor.startEnroll}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="list-decimal space-y-1 pl-5 text-zinc-700 dark:text-zinc-300">
        <li>{t.admin.twoFactor.step1}</li>
        <li>{t.admin.twoFactor.step2}</li>
        <li>{t.admin.twoFactor.step3}</li>
      </ol>
      {/* El QR es una imagen SVG generada por Supabase (data URL). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={state.enrollment.qrCode}
        alt={t.admin.twoFactor.qrAlt}
        width={200}
        height={200}
        className="rounded-md border border-zinc-200 bg-white p-2"
      />
      <p className="text-sm">
        {t.admin.twoFactor.manualKey}{" "}
        <code className="font-mono break-all" data-testid="totp-secret">
          {state.enrollment.secret}
        </code>
      </p>
      <CodeForm action={confirm} initialState={state} />
    </div>
  );
}

/** Código por email: se pide el envío y luego se escribe el código recibido. */
export function EmailCodeFlow({
  email,
  request,
  verify,
}: {
  email: string;
  request: Action;
  verify: Action;
}) {
  const t = getMessages();
  const [state, formAction, pending] = useActionState(request, initialTwoFactorState);

  return (
    <div className="flex flex-col gap-4">
      {state.status === "error" && state.message ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}
      {state.emailSent ? (
        <>
          <Alert tone="success">{t.admin.twoFactor.emailSent(email)}</Alert>
          <CodeForm action={verify} initialState={state} hint={t.admin.twoFactor.emailCodeHint} />
        </>
      ) : (
        <p className="text-zinc-700 dark:text-zinc-300">{t.admin.twoFactor.emailIntro(email)}</p>
      )}
      <form action={formAction}>
        <Button
          type="submit"
          variant={state.emailSent ? "secondary" : "primary"}
          disabled={pending}
        >
          {state.emailSent ? t.admin.twoFactor.resendEmail : t.admin.twoFactor.sendEmail}
        </Button>
      </form>
    </div>
  );
}
