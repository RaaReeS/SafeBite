import type { Database } from "@safebite/core";
import { Alert } from "@/components/ui/alert";
import { getMessages } from "@/i18n";

export type VerificationStatus = Database["public"]["Enums"]["restaurant_verification_status"];

const BADGE_CLASSES: Record<VerificationStatus, string> = {
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
  verified: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100",
  rejected: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const t = getMessages();
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_CLASSES[status]}`}>
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
