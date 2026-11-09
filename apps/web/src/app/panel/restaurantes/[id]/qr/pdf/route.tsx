import { renderToBuffer } from "@react-pdf/renderer";
import { findMyRestaurantForDownload } from "@/lib/data/restaurants";
import { QrSheet } from "@/lib/pdf/qr-sheet";
import { menuUrl, qrDataUrl } from "@/lib/qr";

/** Descarga de la hoja A5 imprimible con el QR. Solo para el dueño; si no, 404. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/panel/restaurantes/[id]/qr/pdf">,
) {
  const { id } = await params;
  const restaurant = await findMyRestaurantForDownload(id);
  if (restaurant === null) {
    return new Response("No encontrado", { status: 404 });
  }

  const url = menuUrl(restaurant.slug);
  const pdf = await renderToBuffer(
    <QrSheet restaurantName={restaurant.name} url={url} qrDataUrl={await qrDataUrl(url)} />,
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="safebite-qr-${restaurant.slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
