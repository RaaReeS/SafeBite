"use client";

import { useActionState } from "react";
import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n";
import { initialFormState } from "@/lib/forms";
import { resendConfirmation } from "../actions";

/** Se muestra al intentar entrar con una cuenta sin confirmar. */
export function ResendConfirmationForm({ email }: { email: string }) {
  const t = getMessages();
  const [state, action, pending] = useActionState(resendConfirmation, initialFormState);

  if (state.status === "success") {
    return <FormStatus state={state} />;
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <FormStatus state={state} />
      <input type="hidden" name="email" value={email} />
      <div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? t.auth.login.resending : t.auth.login.resend}
        </Button>
      </div>
    </form>
  );
}
