import type { Metadata } from "next";
import Link from "next/link";
import { getMessages } from "@/i18n";
import { getMyRestaurant } from "@/lib/data/restaurants";
import { ImportFlow } from "./import-flow";

export const metadata: Metadata = { title: "Importar la carta · SafeBite" };

// La lectura de la carta (Server Action de esta página) puede tardar.
export const maxDuration = 60;

export default async function ImportMenuPage({
  params,
}: PageProps<"/panel/restaurantes/[id]/platos/importar">) {
  const t = getMessages();
  const { id } = await params;
  const restaurant = await getMyRestaurant(id);

  return (
    <>
      <Link
        href={`/panel/restaurantes/${restaurant.id}/platos`}
        className="inline-flex min-h-11 w-fit items-center text-sm font-semibold text-primary-text hover:underline"
      >
        {t.dishes.backToDishes}
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t.menuImport.title}</h1>
        <p className="text-sm text-muted">{restaurant.name}</p>
      </div>
      <ImportFlow restaurantId={restaurant.id} />
    </>
  );
}
