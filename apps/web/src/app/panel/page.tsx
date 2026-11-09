import type { Metadata } from "next";
import { getMessages } from "@/i18n";
import { requireRestaurantOwner } from "@/lib/auth";

export const metadata: Metadata = { title: "Mis restaurantes · SafeBite" };

// Provisional: la gestión de restaurantes llega en el siguiente paso.
export default async function PanelPage() {
  const t = getMessages();
  await requireRestaurantOwner();

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.panel.title}</h1>
      <p className="text-zinc-700 dark:text-zinc-300">{t.panel.empty}</p>
    </>
  );
}
