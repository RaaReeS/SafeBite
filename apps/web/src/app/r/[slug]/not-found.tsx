import { IconBadge } from "@/components/ui/card";
import { getMessages } from "@/i18n";

export default function MenuNotFound() {
  const t = getMessages();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <IconBadge icon="restaurant" size="lg" />
      <h1 className="text-2xl font-bold tracking-tight">{t.menu.notFoundTitle}</h1>
      <p className="text-muted">{t.menu.notFoundText}</p>
    </div>
  );
}
