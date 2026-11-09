import type { ReactNode } from "react";

type Tone = "info" | "success" | "warning" | "error";

const TONE_CLASSES: Record<Tone, string> = {
  info: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100",
  success:
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100",
  warning:
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  error:
    "border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
};

export function Alert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  // Los errores se anuncian de inmediato a los lectores de pantalla.
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md border px-4 py-3 text-sm ${TONE_CLASSES[tone]}`}
    >
      {children}
    </div>
  );
}
