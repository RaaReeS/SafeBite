import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Logo, PageSkeleton } from "@/components/app-shell/app-shell";
import { MenuView } from "@/components/menu/menu-view";
import { getMessages } from "@/i18n";
import { getPeopleIfDiner } from "@/lib/data/health-profile";
import { getPublicMenu } from "@/lib/data/public-menu";

// Carta pública por QR: sin registro ni sesión (con sesión de comensal, se
// filtra con su perfil). Sin caché a propósito: si el restaurante cambia un
// alérgeno, el cliente debe ver el cambio al momento.

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
  return (
    <div className="flex flex-1 flex-col">
      {/* Barra mínima con la marca: la carta se abre desde un QR, sin más navegación. */}
      <header className="border-b border-line bg-card/90 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-2xl px-4 py-2">
          <Logo href="/" />
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <Suspense fallback={<PageSkeleton padded />}>
          <PublicMenu params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function PublicMenu({ params }: Pick<PageProps<"/r/[slug]">, "params">) {
  const { slug } = await params;
  const [menu, diner] = await Promise.all([getPublicMenu(slug), getPeopleIfDiner()]);
  if (menu === null) notFound();
  // Con sesión de comensal, la carta parte de su perfil y el de su familia (solo lo ve él).
  return <MenuView restaurant={menu.restaurant} dishes={menu.dishes} diner={diner} />;
}
