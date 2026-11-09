import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MenuView } from "@/components/menu/menu-view";
import { getMessages } from "@/i18n";
import { getPublicMenu } from "@/lib/data/public-menu";

// Carta pública por QR: sin registro ni sesión. Sin caché a propósito: si el
// restaurante cambia un alérgeno, el cliente debe ver el cambio al momento.

export async function generateMetadata({ params }: PageProps<"/r/[slug]">): Promise<Metadata> {
  const t = getMessages();
  const { slug } = await params;
  const menu = await getPublicMenu(slug);
  if (menu === null) return { title: t.menu.notFoundTitle };
  return {
    title: t.menu.metaTitle(menu.restaurant.name),
    description: t.menu.metaDescription(menu.restaurant.name),
  };
}

export default function PublicMenuPage({ params }: PageProps<"/r/[slug]">) {
  const t = getMessages();
  return (
    <main className="flex flex-1 flex-col">
      <Suspense fallback={<p className="px-4 py-8">{t.common.loading}</p>}>
        <PublicMenu params={params} />
      </Suspense>
    </main>
  );
}

async function PublicMenu({ params }: Pick<PageProps<"/r/[slug]">, "params">) {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);
  if (menu === null) notFound();
  return <MenuView restaurant={menu.restaurant} dishes={menu.dishes} />;
}
