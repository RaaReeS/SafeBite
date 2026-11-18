import type { Database } from "@safebite/core";
import { Alert } from "@/components/ui/alert";
import { getMessages } from "@/i18n";

export type VerificationStatus = Database["public"]["Enums"]["restaurant_verification_status"];

const BADGE_CLASSES: Record<VerificationStatus, string> = {
  pending: "bg-warning-bg text-warning-fg",
  verified: "bg-primary-soft text-primary-strong",
  rejected: "bg-danger-soft text-danger",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const t = getMessages();
  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${BADGE_CLASSES[status]}`}
    >
      {t.verification.badge[status]}
    </span>
  );
}

/** Aviso para el dueño: qué significa el estado y, si se rechazó, el motivo. */
export function VerificationNotice({
  status,
  note,
}: {
  status: VerificationStatus;
  note: string | null;
}) {
  const t = getMessages();
  if (status === "verified") return null;
  if (status === "pending") {
    return (
      <Alert tone="warning">
        <strong className="block">{t.verification.pendingTitle}</strong>
        {t.verification.pending}
      </Alert>
    );
  }
  return (
    <Alert tone="error">
      <strong className="block">{t.verification.rejectedTitle}</strong>
      {note !== null ? (
        <span className="block">
          {t.verification.rejectedReason} {note}
        </span>
      ) : null}
      <span className="block">{t.verification.rejectedHelp}</span>
    </Alert>
  );
}
