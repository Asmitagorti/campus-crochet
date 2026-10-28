import { loadSettings } from "@/lib/store-data";
export const runtime = "nodejs";
export async function GET() {
  try {
    return Response.json(await loadSettings(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Site content unavailable" },
      { status: 503 },
    );
  }
}
