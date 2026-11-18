import { useId, type ComponentProps, type ReactNode } from "react";

const CONTROL_CLASSES =
  "min-h-11 w-full rounded-xl border-[1.5px] border-input bg-card px-4 py-2.5 text-base text-fg placeholder:text-subtle focus:border-primary-text focus:outline-2 focus:outline-primary-text/30 aria-invalid:border-danger";

type FieldShellProps = {
  label: string;
  hint?: ReactNode;
  error?: string | undefined;
  children: (ids: { id: string; describedBy: string | undefined }) => ReactNode;
};

function FieldShell({ label, hint, error, children }: FieldShellProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {children({ id, describedBy })}
      {hint ? (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  hint?: ReactNode;
  error?: string | undefined;
};

export function TextField({ label, hint, error, className = "", ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`${CONTROL_CLASSES} ${className}`}
          {...props}
        />
      )}
    </FieldShell>
  );
}

type TextAreaFieldProps = Omit<ComponentProps<"textarea">, "id"> & {
  label: string;
  hint?: ReactNode;
  error?: string | undefined;
};

export function TextAreaField({
  label,
  hint,
  error,
  className = "",
  ...props
}: TextAreaFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={`${CONTROL_CLASSES} min-h-24 ${className}`}
          {...props}
        />
      )}
    </FieldShell>
  );
}
