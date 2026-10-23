import { loadProducts } from "@/lib/database";
export const runtime = "nodejs";
export async function GET() {
  try {
    const products = await loadProducts();
    return Response.json(
      {
        products,
        stock: Object.fromEntries(products.map((p) => [p.id, p.stock])),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("Catalogue unavailable");
    return Response.json(
      { error: "The collection is taking a moment. Please try again." },
      { status: 503 },
    );
  }
}
