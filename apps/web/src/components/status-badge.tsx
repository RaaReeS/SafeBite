import { getMessages } from "@/i18n";

export function PublishedBadge({ published }: { published: boolean }) {
  const t = getMessages();
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        published
          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100"
          : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
      }`}
    >
      {published ? t.panel.published : t.panel.draft}
    </span>
  );
}
