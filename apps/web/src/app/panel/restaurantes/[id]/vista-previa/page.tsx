import type { Metadata } from "next";
import Link from "next/link";
import { MenuView } from "@/components/menu/menu-view";
import { Alert } from "@/components/ui/alert";
import { getMessages } from "@/i18n";
import { getMyMenuPreview } from "@/lib/data/dishes";

export const metadata: Metadata = { title: "Vista previa · SafeBite" };

// Mismo componente que la carta pública (/r/[slug]): lo que ve el dueño aquí es
// exactamente lo que verán sus clientes, aunque la carta aún no esté publicada.
export default async function MenuPreviewPage({
  params,
}: PageProps<"/panel/restaurantes/[id]/vista-previa">) {
  const t = getMessages();
  const { id } = await params;
  const { restaurant, dishes } = await getMyMenuPreview(id);

  return (
    <>
      <Link
        href={`/panel/restaurantes/${restaurant.id}`}
        className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
      >
        {t.preview.backToRestaurant}
      </Link>
      <h1 className="sr-only">{t.preview.title}</h1>
      <Alert tone="info">{t.preview.notice}</Alert>
      {restaurant.published ? null : <Alert tone="warning">{t.preview.notPublished}</Alert>}
      {restaurant.published && restaurant.verification_status !== "verified" ? (
        <Alert tone="warning">{t.verification.notVisibleYet}</Alert>
      ) : null}
      <div className="rounded-2xl border-2 border-dashed border-line">
        <MenuView restaurant={restaurant} dishes={dishes} />
      </div>
    </>
  );
}
