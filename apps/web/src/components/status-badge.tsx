import { getMessages } from "@/i18n";

export function PublishedBadge({ published }: { published: boolean }) {
  const t = getMessages();
  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
        published ? "bg-primary-soft text-primary-strong" : "bg-surface text-muted"
      }`}
    >
      {published ? t.panel.published : t.panel.draft}
    </span>
  );
}
