import { getMessages } from "@/i18n";

export default function MenuNotFound() {
  const t = getMessages();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-3 px-4 py-16">
      <h1 className="text-2xl font-semibold">{t.menu.notFoundTitle}</h1>
      <p className="text-zinc-700 dark:text-zinc-300">{t.menu.notFoundText}</p>
    </div>
  );
}
