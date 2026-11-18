"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { initialFormState, type FormState } from "@/lib/forms";

/**
 * Botón «Rechazar» que abre una ventana emergente para escribir el motivo
 * (obligatorio: el dueño lo verá en su panel). Usa <dialog> nativo: atrapa el
 * foco, se cierra con Escape y es accesible por teclado.
 */
export function RejectButton({
  action,
  restaurantName,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  restaurantName: string;
}) {
  const t = getMessages();
  const labels = t.admin.restaurants;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [state, formAction, pending] = useActionState(action, initialFormState);

  // Al rechazar con éxito se cierra (la tarjeta sale de «Pendientes»).
  useEffect(() => {
    if (state.status === "success") dialogRef.current?.close();
  }, [state]);

  return (
    <>
      <Button variant="danger" icon="close" onClick={() => dialogRef.current?.showModal()}>
        {labels.reject}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-2xl bg-card p-6 text-fg shadow-raised backdrop:bg-black/50"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {labels.rejectFormLabel(restaurantName)}
        </h2>
        <form
          action={formAction}
          aria-label={labels.rejectFormLabel(restaurantName)}
          className="mt-4 flex flex-col gap-4"
        >
          <TextAreaField
            name="note"
            label={labels.noteLabel}
            hint={labels.noteHint}
            defaultValue={state.values?.note}
            error={state.fieldErrors?.note}
            rows={3}
            maxLength={500}
            autoFocus
          />
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" onClick={() => dialogRef.current?.close()}>
              {labels.cancel}
            </Button>
            <Button type="submit" variant="danger" disabled={pending}>
              {labels.reject}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
