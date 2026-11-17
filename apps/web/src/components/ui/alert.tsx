import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

type Tone = "info" | "success" | "warning" | "error";

const TONES: Record<Tone, { className: string; icon: IconName }> = {
  info: { className: "bg-info-bg text-info-fg", icon: "info" },
  success: { className: "bg-success-bg text-success-fg", icon: "checkmark-circle" },
  warning: { className: "bg-warning-bg text-warning-fg", icon: "warning" },
  error: { className: "bg-danger-soft text-danger", icon: "alert" },
};

export function Alert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  const { className, icon } = TONES[tone];
  // Los errores se anuncian de inmediato a los lectores de pantalla.
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm font-medium ${className}`}
    >
      <Icon name={icon} className="mt-0.5 size-5" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
