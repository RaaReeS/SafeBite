import { findMyRestaurantForDownload } from "@/lib/data/restaurants";
import { menuUrl, qrPng } from "@/lib/qr";

/** Descarga del QR en PNG. Solo para el dueño del restaurante; si no, 404. */
export async function GET(
  request: Request,
  { params }: RouteContext<"/panel/restaurantes/[id]/qr/png">,
) {
  const { id } = await params;
  const restaurant = await findMyRestaurantForDownload(id);
  if (restaurant === null) {
    return new Response("No encontrado", { status: 404 });
  }

  const png = await qrPng(menuUrl(restaurant.slug));
  const inline = new URL(request.url).searchParams.has("vista");

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": inline
        ? "inline"
        : `attachment; filename="safebite-qr-${restaurant.slug}.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
