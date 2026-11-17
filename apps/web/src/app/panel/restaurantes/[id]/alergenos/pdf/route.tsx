import { renderToBuffer } from "@react-pdf/renderer";
import { getMyAllergenTableData } from "@/lib/data/dishes";
import { AllergenTable } from "@/lib/pdf/allergen-table";

/** Tabla de alérgenos imprimible (PDF A4 apaisado). Solo para el dueño; si no, 404. */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/panel/restaurantes/[id]/alergenos/pdf">,
) {
  const { id } = await params;
  const data = await getMyAllergenTableData(id);
  if (data === null) {
    return new Response("No encontrado", { status: 404 });
  }

  const pdf = await renderToBuffer(
    <AllergenTable
      restaurantName={data.restaurant.name}
      dishes={data.dishes}
      generatedAt={new Date()}
    />,
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="safebite-alergenos-${data.restaurant.slug}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
