import { useId, type ComponentProps, type ReactNode } from "react";

const CONTROL_CLASSES =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs focus:border-emerald-700 focus:outline-2 focus:outline-emerald-700/30 aria-invalid:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

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
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children({ id, describedBy })}
      {hint ? (
        <p id={hintId} className="text-xs text-zinc-600 dark:text-zinc-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs font-medium text-red-700 dark:text-red-400">
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
