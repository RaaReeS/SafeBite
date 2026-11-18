"use client";

import { useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  /** Texto del botón que abre el diálogo. */
  trigger: string;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  /** Server Action que se ejecuta al confirmar. */
  action: () => Promise<void>;
};

/** Pide confirmación antes de una acción destructiva. Usa <dialog> nativo (accesible por teclado). */
export function ConfirmDialog({
  trigger,
  title,
  children,
  confirmLabel,
  cancelLabel,
  action,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button variant="danger" onClick={() => dialogRef.current?.showModal()}>
        {trigger}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-dialog-title"
        className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-2xl bg-card p-6 text-fg shadow-raised backdrop:bg-black/50"
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-3 text-sm text-muted">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={() => dialogRef.current?.close()} autoFocus>
            {cancelLabel}
          </Button>
          <form action={action}>
            <Button type="submit" variant="danger">
              {confirmLabel}
            </Button>
          </form>
        </div>
      </dialog>
    </>
  );
}
