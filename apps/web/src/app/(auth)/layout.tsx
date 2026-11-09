import Link from "next/link";
import type { ReactNode } from "react";
import { getMessages } from "@/i18n";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const t = getMessages();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <Link href="/" className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
        {t.common.appName} {t.common.forRestaurants}
      </Link>
      {children}
    </main>
  );
}
